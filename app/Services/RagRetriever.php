<?php

namespace App\Services;

use App\Contracts\AiProvider;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Three-tier retrieval pipeline (cheapest first):
 *
 *  1. FAQ keyword match    — zero API cost, handles ~70% of common questions
 *  2. PostgreSQL FTS       — free full-text search; skips embedding if ≥ 3 quality hits
 *  3. Vector similarity    — one embed() call per unique query (cached 24h)
 *
 * Scope filtering ensures platform chat searches all content, course chat searches
 * only its course/module/resources, and resource chat narrows further.
 */
class RagRetriever
{
    /** Minimum cosine similarity (0–1) below which vector results are discarded */
    private const VECTOR_SCORE_THRESHOLD = 0.35;

    /** Minimum ts_rank score below which FTS results are discarded */
    private const FTS_RANK_THRESHOLD = 0.05;

    /** Minimum FTS results needed to skip the vector search entirely */
    private const FTS_MIN_QUALITY_RESULTS = 3;

    public function __construct(private readonly AiProvider $ai) {}

    /**
     * Retrieve relevant knowledge chunks for a user query.
     *
     * @param  string  $query  The user's message
     * @param  string|null  $sourceType  Scope filter: 'course' | 'module' | 'resource' | null (all)
     * @param  int|null  $sourceId  ID of the scoped entity
     * @param  int  $limit  Max chunks to return
     * @return array{type: 'faq'|'fts'|'vector'|'none', answer?: string, chunks?: Collection}
     */
    public function retrieve(string $query, ?string $sourceType, ?int $sourceId, int $limit = 5): array
    {
        // ── Tier 1: FAQ keyword match (zero API cost) ────────────────────────
        $faqAnswer = $this->matchFaq($query);
        if ($faqAnswer !== null) {
            return ['type' => 'faq', 'answer' => $faqAnswer];
        }

        // ── Tier 2: Full-text search (free, Postgres built-in) ───────────────
        $ftsResults = $this->fullTextSearch($query, $sourceType, $sourceId, $limit);
        if ($ftsResults->count() >= self::FTS_MIN_QUALITY_RESULTS) {
            return ['type' => 'fts', 'chunks' => $ftsResults];
        }

        // ── Tier 3: Vector similarity (one embed() call, cached 24h) ─────────
        $vectorResults = $this->vectorSearch($query, $sourceType, $sourceId, $limit);
        if ($vectorResults->isEmpty()) {
            return ['type' => 'none'];
        }

        return ['type' => 'vector', 'chunks' => $vectorResults];
    }

    // ─── Tier 1: FAQ ─────────────────────────────────────────────────────────

    private function matchFaq(string $query): ?string
    {
        $lower = mb_strtolower(trim($query));

        /** @var array<int, array{triggers: string[], answer: string}> $faqs */
        $faqs = config('chat-faq', []);

        foreach ($faqs as $faq) {
            foreach ($faq['triggers'] as $trigger) {
                if (str_contains($lower, $trigger)) {
                    return $faq['answer'];
                }
            }
        }

        return null;
    }

    // ─── Tier 2: Full-text search ─────────────────────────────────────────────

    private function fullTextSearch(string $query, ?string $sourceType, ?int $sourceId, int $limit): Collection
    {
        // Convert query to tsquery: split words, join with &
        $words = preg_split('/\s+/', trim($query)) ?: [];
        $words = array_filter($words, fn ($w) => mb_strlen($w) >= 2);

        if (empty($words)) {
            return collect();
        }

        $tsQuery = implode(' & ', array_map(fn ($w) => pg_escape_string($w).':*', $words));

        $sql = "
            SELECT id, source_type, source_id, chunk_text, metadata,
                   ts_rank(to_tsvector('english', chunk_text), to_tsquery('english', ?)) AS rank
            FROM knowledge_chunks
            WHERE to_tsvector('english', chunk_text) @@ to_tsquery('english', ?)
              AND ts_rank(to_tsvector('english', chunk_text), to_tsquery('english', ?)) >= ?
        ";

        $bindings = [$tsQuery, $tsQuery, $tsQuery, self::FTS_RANK_THRESHOLD];

        [$scopeSql, $scopeBindings] = $this->scopeClause($sourceType, $sourceId);
        $sql .= $scopeSql;
        $bindings = array_merge($bindings, $scopeBindings);

        $sql .= ' ORDER BY rank DESC LIMIT ?';
        $bindings[] = $limit;

        return collect(DB::select($sql, $bindings));
    }

    // ─── Tier 3: Vector similarity ────────────────────────────────────────────

    private function vectorSearch(string $query, ?string $sourceType, ?int $sourceId, int $limit): Collection
    {
        // embed() caches by SHA-256(text)+model for 24h — repeated questions are free
        $embedding = $this->ai->embed($query);

        if (empty($embedding)) {
            return collect();
        }

        $vectorLiteral = '['.implode(',', $embedding).']';

        $sql = '
            SELECT id, source_type, source_id, chunk_text, metadata,
                   1 - (embedding <=> ?::vector) AS similarity
            FROM knowledge_chunks
            WHERE 1 - (embedding <=> ?::vector) >= ?
              AND embedding IS NOT NULL
        ';

        $bindings = [$vectorLiteral, $vectorLiteral, self::VECTOR_SCORE_THRESHOLD];

        [$scopeSql, $scopeBindings] = $this->scopeClause($sourceType, $sourceId);
        $sql .= $scopeSql;
        $bindings = array_merge($bindings, $scopeBindings);

        $sql .= ' ORDER BY similarity DESC LIMIT ?';
        $bindings[] = $limit;

        return collect(DB::select($sql, $bindings));
    }

    // ─── Scope filtering ──────────────────────────────────────────────────────

    /**
     * Build the WHERE clause fragment for source scoping.
     * - null/null  → no filter (platform-wide search)
     * - 'course'/id → restrict to source_type IN ('course','module','resource') matching that course_id in metadata
     * - 'resource'/id → restrict to that specific resource chunk first, fallback handled by caller
     *
     * @return array{0: string, 1: array<int, mixed>}
     */
    private function scopeClause(?string $sourceType, ?int $sourceId): array
    {
        if ($sourceType === null || $sourceId === null) {
            return ['', []];
        }

        if ($sourceType === 'resource') {
            return [
                " AND ((source_type = 'resource' AND source_id = ?) OR (metadata->>'course_id' = (SELECT (metadata->>'course_id') FROM knowledge_chunks WHERE source_type = 'resource' AND source_id = ? LIMIT 1)))",
                [$sourceId, $sourceId],
            ];
        }

        if ($sourceType === 'course') {
            return [
                " AND (metadata->>'course_id')::int = ?",
                [$sourceId],
            ];
        }

        return ['', []];
    }
}
