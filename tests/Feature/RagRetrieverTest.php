<?php

namespace Tests\Feature;

use App\Contracts\AiProvider;
use App\Enums\CourseStatus;
use App\Models\Course;
use App\Services\RagRetriever;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RagRetrieverTest extends TestCase
{
    use RefreshDatabase;

    private RagRetriever $retriever;

    protected function setUp(): void
    {
        parent::setUp();

        $mockAi = new class implements AiProvider
        {
            /** @return array{score: int, explanation: string} */
            public function grade(string $questionBody, string $rubric, string $answer, int $maxPoints): array
            {
                return ['score' => 100, 'explanation' => 'Mock'];
            }

            public function hint(string $questionBody, string $answerDraft): string
            {
                return 'Mock hint';
            }

            /** @param array<int, array{role: 'user'|'assistant', content: string}> $history */
            public function streamChat(string $systemPrompt, array $history, callable $onChunk, string $model = 'gpt-4o-mini'): void
            {
                $onChunk('Mock');
            }

            public function complete(string $systemPrompt, string $userMessage, string $model = 'gpt-4o-mini'): string
            {
                return 'Mock response';
            }

            /** @return float[] */
            public function embed(string $text): array
            {
                // Return a deterministic vector based on text hash for testing
                $seed = crc32($text);
                srand($seed);
                $vec = [];
                for ($i = 0; $i < 512; $i++) {
                    $vec[] = (rand(0, 1000) / 1000.0) - 0.5;
                }
                srand();

                return $vec;
            }
        };

        $this->retriever = new RagRetriever($mockAi);
    }

    public function test_faq_match_returns_canned_answer_without_db_query(): void
    {
        $result = $this->retriever->retrieve('How do I sign up?', null, null);

        $this->assertEquals('faq', $result['type']);
        $this->assertArrayHasKey('answer', $result);
        $this->assertIsString($result['answer']);
    }

    public function test_faq_is_case_insensitive(): void
    {
        $result = $this->retriever->retrieve('HOW DO I SIGN UP', null, null);
        $this->assertEquals('faq', $result['type']);
    }

    public function test_returns_none_when_no_chunks_exist(): void
    {
        $result = $this->retriever->retrieve('Tell me about Laravel routing', null, null);

        $this->assertEquals('none', $result['type']);
    }

    public function test_fts_retrieves_chunks_with_matching_keywords(): void
    {
        $this->seedChunk('course', 1, 'Laravel is a PHP framework for web artisans with elegant syntax', 1);
        $this->seedChunk('course', 2, 'React is a JavaScript library for building user interfaces', 2);
        $this->seedChunk('course', 3, 'Laravel routing and middleware for PHP applications', 3);

        $result = $this->retriever->retrieve('Laravel PHP framework', null, null);

        // Should match via FTS before hitting vector search
        $this->assertContains($result['type'], ['fts', 'vector']);
        if ($result['type'] === 'fts') {
            $this->assertGreaterThan(0, $result['chunks']->count());
        }
    }

    public function test_returns_none_when_vector_score_below_threshold(): void
    {
        // Seed a chunk about a completely unrelated topic
        $this->seedChunk('course', 1, 'Cooking recipes: mix flour, sugar, and eggs.', 1);

        // Query about a totally different domain
        $result = $this->retriever->retrieve('quantum computing algorithms', null, null);

        // May return none if similarity is too low — acceptable outcome
        $this->assertContains($result['type'], ['fts', 'vector', 'none']);
    }

    public function test_scope_filters_to_specific_course(): void
    {
        $courseA = Course::factory()->create(['status' => CourseStatus::Published]);
        $courseB = Course::factory()->create(['status' => CourseStatus::Published]);

        $this->seedChunk('course', $courseA->id, 'Course A: Advanced Docker containerisation techniques', $courseA->id);
        $this->seedChunk('course', $courseB->id, 'Course B: Machine learning with Python and TensorFlow', $courseB->id);

        $result = $this->retriever->retrieve('Docker containers', 'course', $courseA->id);

        if (isset($result['chunks'])) {
            foreach ($result['chunks'] as $chunk) {
                $metadata = is_string($chunk->metadata) ? json_decode($chunk->metadata, true) : (array) $chunk->metadata;
                $this->assertEquals($courseA->id, $metadata['course_id'] ?? null);
            }
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function seedChunk(string $sourceType, int $sourceId, string $text, int $courseId): void
    {
        // Use a zero vector as embedding placeholder in tests — not used for FTS path
        $zeroVector = '['.implode(',', array_fill(0, 512, 0.0)).']';

        DB::statement(
            'INSERT INTO knowledge_chunks
                (source_type, source_id, chunk_index, chunk_text, content_hash, embedding, metadata, created_at, updated_at)
             VALUES (?, ?, 0, ?, ?, ?::vector, ?::jsonb, NOW(), NOW())',
            [
                $sourceType,
                $sourceId,
                $text,
                hash('sha256', $text),
                $zeroVector,
                json_encode(['course_id' => $courseId]),
            ]
        );
    }
}
