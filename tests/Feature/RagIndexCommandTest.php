<?php

namespace Tests\Feature;

use App\Contracts\AiProvider;
use App\Enums\CourseStatus;
use App\Models\Course;
use App\Models\KnowledgeChunk;
use App\Models\Module;
use App\Models\Resource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RagIndexCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockEmbedding();
    }

    public function test_indexes_published_course_and_creates_chunks(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published]);
        $module = Module::factory()->create(['course_id' => $course->id]);
        Resource::factory()->create(['module_id' => $module->id, 'type' => 'text', 'content' => 'Hello world']);

        $this->artisan('rag:index')->assertSuccessful();

        $this->assertDatabaseHas('knowledge_chunks', ['source_type' => 'course', 'source_id' => $course->id]);
        $this->assertDatabaseHas('knowledge_chunks', ['source_type' => 'module', 'source_id' => $module->id]);
    }

    public function test_skips_draft_courses(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Draft]);
        $module = Module::factory()->create(['course_id' => $course->id]);
        Resource::factory()->create(['module_id' => $module->id]);

        $this->artisan('rag:index')->assertSuccessful();

        $this->assertDatabaseMissing('knowledge_chunks', ['source_type' => 'course', 'source_id' => $course->id]);
    }

    public function test_skips_unchanged_chunks_based_on_content_hash(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published, 'description' => 'Test course']);
        $module = Module::factory()->create(['course_id' => $course->id]);

        // Run index once
        $this->artisan('rag:index')->assertSuccessful();
        $firstCount = KnowledgeChunk::count();

        // Capture the embed call count by checking AI mock interactions
        $callCount = 0;
        $this->instance(AiProvider::class, $this->makeMockAiProvider(function () use (&$callCount) {
            $callCount++;

            return array_fill(0, 512, 0.1);
        }));

        // Run index again — nothing changed, embed should not be called
        $this->artisan('rag:index')->assertSuccessful();

        $this->assertEquals(0, $callCount, 'embed() should not be called for unchanged chunks');
        $this->assertEquals($firstCount, KnowledgeChunk::count());
    }

    public function test_reindexes_when_content_changes(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published, 'description' => 'Original']);
        $module = Module::factory()->create(['course_id' => $course->id]);

        $this->artisan('rag:index')->assertSuccessful();

        $originalHash = KnowledgeChunk::where('source_type', 'course')->value('content_hash');

        // Update course description
        $course->update(['description' => 'Changed description with new content']);

        $this->artisan('rag:index')->assertSuccessful();

        $newHash = KnowledgeChunk::where('source_type', 'course')->value('content_hash');
        $this->assertNotEquals($originalHash, $newHash);
    }

    public function test_fresh_flag_drops_and_reindexes_all(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published]);
        $module = Module::factory()->create(['course_id' => $course->id]);

        $this->artisan('rag:index')->assertSuccessful();
        $countBefore = KnowledgeChunk::count();
        $this->assertGreaterThan(0, $countBefore);

        $this->artisan('rag:index', ['--fresh' => true])->assertSuccessful();

        $this->assertEquals($countBefore, KnowledgeChunk::count());
    }

    public function test_single_course_option_indexes_only_that_course(): void
    {
        $courseA = Course::factory()->create(['status' => CourseStatus::Published]);
        $courseB = Course::factory()->create(['status' => CourseStatus::Published]);
        Module::factory()->create(['course_id' => $courseA->id]);
        Module::factory()->create(['course_id' => $courseB->id]);

        $this->artisan('rag:index', ['--course' => $courseA->id])->assertSuccessful();

        $this->assertDatabaseHas('knowledge_chunks', ['source_type' => 'course', 'source_id' => $courseA->id]);
        $this->assertDatabaseMissing('knowledge_chunks', ['source_type' => 'course', 'source_id' => $courseB->id]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function mockEmbedding(): void
    {
        $this->instance(AiProvider::class, $this->makeMockAiProvider(fn () => array_fill(0, 512, 0.1)));
    }

    private function makeMockAiProvider(callable $embedFn): AiProvider
    {
        return new class($embedFn) implements AiProvider
        {
            public function __construct(private readonly mixed $embedFn) {}

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
                $onChunk('Mock response');
            }

            /** @return float[] */
            public function embed(string $text): array
            {
                return ($this->embedFn)($text);
            }
        };
    }
}
