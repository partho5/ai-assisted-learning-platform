<?php

namespace App\Console\Commands;

use App\Contracts\AiProvider;
use App\Enums\CourseStatus;
use App\Models\Course;
use App\Models\KnowledgeChunk;
use App\Services\KnowledgeChunker;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class IndexKnowledge extends Command
{
    protected $signature = 'rag:index
                            {--fresh : Drop all existing chunks and re-index everything}
                            {--course= : Index a single course by ID}';

    protected $description = 'Index published course content into knowledge_chunks for RAG retrieval.
                              Runs daily via scheduler; only re-embeds content whose hash changed.';

    public function handle(AiProvider $ai, KnowledgeChunker $chunker): int
    {
        $fresh = (bool) $this->option('fresh');
        $courseId = $this->option('course');

        if ($fresh) {
            $this->warn('Fresh mode: dropping all existing chunks...');
            KnowledgeChunk::query()->whereIn('source_type', ['course', 'module', 'resource'])->delete();
        }

        $query = Course::query()
            ->where('status', CourseStatus::Published)
            ->with('modules.resources');

        if ($courseId) {
            $query->where('id', (int) $courseId);
        }

        $courses = $query->get();

        if ($courses->isEmpty()) {
            $this->info('No published courses found.');

            return self::SUCCESS;
        }

        $this->info("Indexing {$courses->count()} course(s)...");

        $created = 0;
        $skipped = 0;
        $deleted = 0;

        foreach ($courses as $course) {
            $chunks = $chunker->chunksForCourse($course);

            if (empty($chunks)) {
                continue;
            }

            // Collect all source pairs for this course to detect orphaned chunks
            $incomingKeys = collect($chunks)->map(fn ($c) => $c['source_type'].':'.$c['source_id'].':'.$c['chunk_index']);

            foreach ($chunks as $chunk) {
                $existing = KnowledgeChunk::query()
                    ->where('source_type', $chunk['source_type'])
                    ->where('source_id', $chunk['source_id'])
                    ->where('chunk_index', $chunk['chunk_index'])
                    ->first();

                // Content hash matches — no change, skip embedding API call
                if ($existing && $existing->content_hash === $chunk['content_hash']) {
                    $skipped++;

                    continue;
                }

                // Delete stale chunk before re-creating
                if ($existing) {
                    $existing->delete();
                }

                // Embed and store
                $embedding = $ai->embed($chunk['chunk_text']);

                DB::statement(
                    'INSERT INTO knowledge_chunks
                        (source_type, source_id, chunk_index, chunk_text, content_hash, embedding, metadata, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?::vector, ?::jsonb, NOW(), NOW())',
                    [
                        $chunk['source_type'],
                        $chunk['source_id'],
                        $chunk['chunk_index'],
                        $chunk['chunk_text'],
                        $chunk['content_hash'],
                        '['.implode(',', $embedding).']',
                        json_encode($chunk['metadata']),
                    ]
                );

                $created++;
            }

            // Remove orphaned chunks — e.g. a resource was deleted since last index run
            $sourcePairs = collect($chunks)
                ->groupBy('source_type')
                ->map(fn ($group) => $group->pluck('source_id')->unique()->values());

            foreach ($sourcePairs as $sourceType => $sourceIds) {
                // Also remove chunks with chunk_index no longer in the incoming set for this source
                $incomingIndexesBySource = collect($chunks)
                    ->where('source_type', $sourceType)
                    ->groupBy('source_id')
                    ->map(fn ($g) => $g->pluck('chunk_index')->values());

                foreach ($sourceIds as $sourceId) {
                    $validIndexes = $incomingIndexesBySource[$sourceId] ?? collect([]);

                    $orphaned = KnowledgeChunk::query()
                        ->where('source_type', $sourceType)
                        ->where('source_id', $sourceId)
                        ->whereNotIn('chunk_index', $validIndexes->toArray())
                        ->delete();

                    $deleted += $orphaned;
                }
            }
        }

        $this->info("Done. Created/updated: {$created} | Skipped (unchanged): {$skipped} | Orphans removed: {$deleted}");

        return self::SUCCESS;
    }
}
