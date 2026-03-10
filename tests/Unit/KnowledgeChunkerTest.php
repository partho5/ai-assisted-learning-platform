<?php

namespace Tests\Unit;

use App\Enums\CourseStatus;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Services\KnowledgeChunker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KnowledgeChunkerTest extends TestCase
{
    use RefreshDatabase;

    private KnowledgeChunker $chunker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->chunker = new KnowledgeChunker;
    }

    public function test_produces_course_module_and_resource_chunks(): void
    {
        $course = Course::factory()->create([
            'status' => CourseStatus::Published,
            'title' => 'Laravel Fundamentals',
            'description' => 'Learn Laravel from scratch.',
        ]);
        $module = Module::factory()->create(['course_id' => $course->id, 'title' => 'Intro Module']);
        Resource::factory()->create([
            'module_id' => $module->id,
            'title' => 'Getting Started',
            'type' => 'text',
            'content' => '<p>This is the resource body.</p>',
        ]);

        $course->load('modules.resources');
        $chunks = $this->chunker->chunksForCourse($course);

        // Expect: 1 course chunk + 1 module chunk + 1 resource chunk
        $this->assertCount(3, $chunks);

        $types = array_column($chunks, 'source_type');
        $this->assertContains('course', $types);
        $this->assertContains('module', $types);
        $this->assertContains('resource', $types);
    }

    public function test_strips_html_from_content(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published]);
        $module = Module::factory()->create(['course_id' => $course->id]);
        Resource::factory()->create([
            'module_id' => $module->id,
            'type' => 'text',
            'content' => '<h1>Title</h1><p>Body with <strong>bold</strong> text.</p>',
        ]);

        $course->load('modules.resources');
        $chunks = $this->chunker->chunksForCourse($course);

        $resourceChunk = collect($chunks)->firstWhere('source_type', 'resource');
        $this->assertNotNull($resourceChunk);
        $this->assertStringNotContainsString('<h1>', $resourceChunk['chunk_text']);
        $this->assertStringNotContainsString('<strong>', $resourceChunk['chunk_text']);
        $this->assertStringContainsString('bold', $resourceChunk['chunk_text']);
    }

    public function test_skips_video_resource_with_no_body(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published]);
        $module = Module::factory()->create(['course_id' => $course->id]);
        Resource::factory()->create([
            'module_id' => $module->id,
            'type' => 'video',
            'content' => null,
            'mentor_note' => null,
            'why_this_resource' => '',
        ]);

        $course->load('modules.resources');
        $chunks = $this->chunker->chunksForCourse($course);

        $resourceChunks = array_filter($chunks, fn ($c) => $c['source_type'] === 'resource');
        // Video with no body should be skipped — only course + module chunks
        $this->assertEmpty($resourceChunks);
    }

    public function test_video_with_mentor_note_is_not_skipped(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published]);
        $module = Module::factory()->create(['course_id' => $course->id]);
        Resource::factory()->create([
            'module_id' => $module->id,
            'type' => 'video',
            'content' => null,
            'mentor_note' => 'Watch from 2:30 for the key concept.',
        ]);

        $course->load('modules.resources');
        $chunks = $this->chunker->chunksForCourse($course);

        $resourceChunks = array_filter($chunks, fn ($c) => $c['source_type'] === 'resource');
        $this->assertCount(1, $resourceChunks);
    }

    public function test_content_hash_is_sha256_of_chunk_text(): void
    {
        $course = Course::factory()->create(['status' => CourseStatus::Published, 'description' => 'A description']);
        $module = Module::factory()->create(['course_id' => $course->id]);

        $course->load('modules.resources');
        $chunks = $this->chunker->chunksForCourse($course);

        foreach ($chunks as $chunk) {
            $this->assertEquals(hash('sha256', $chunk['chunk_text']), $chunk['content_hash']);
        }
    }

    public function test_long_text_resource_is_split_into_multiple_chunks(): void
    {
        $longContent = '<p>'.implode("</p>\n\n<p>", array_fill(0, 20, str_repeat('Lorem ipsum dolor sit amet. ', 15))).'</p>';

        $course = Course::factory()->create(['status' => CourseStatus::Published]);
        $module = Module::factory()->create(['course_id' => $course->id]);
        $resource = Resource::factory()->create([
            'module_id' => $module->id,
            'type' => 'text',
            'content' => $longContent,
        ]);

        $chunks = $this->chunker->chunksForResource($resource, $course);

        $this->assertGreaterThan(1, count($chunks));
        foreach ($chunks as $i => $chunk) {
            $this->assertEquals($i, $chunk['chunk_index']);
        }
    }
}
