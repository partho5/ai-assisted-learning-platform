<?php

namespace Tests\Feature;

use App\AiChat\UserProgressSummary;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\Resource;
use App\Models\ResourceCompletion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserProgressSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_enrolled_courses_with_completion_percentage(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Laravel Basics']);
        $module = Module::factory()->create(['course_id' => $course->id]);
        $resources = Resource::factory()->count(4)->create(['module_id' => $module->id]);

        $enrollment = Enrollment::factory()->create([
            'user_id' => $learner->id,
            'course_id' => $course->id,
        ]);

        // Complete 2 of 4 resources
        ResourceCompletion::factory()->endorsed()->create([
            'enrollment_id' => $enrollment->id,
            'resource_id' => $resources[0]->id,
        ]);
        ResourceCompletion::factory()->endorsed()->create([
            'enrollment_id' => $enrollment->id,
            'resource_id' => $resources[1]->id,
        ]);

        $summary = UserProgressSummary::forUser($learner);

        $this->assertCount(1, $summary->enrolledCourses);
        $this->assertEquals('Laravel Basics', $summary->enrolledCourses[0]['title']);
        $this->assertEquals(50, $summary->enrolledCourses[0]['completion']);
    }

    public function test_returns_endorsed_skills(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create();
        $module = Module::factory()->create(['course_id' => $course->id]);
        $resource = Resource::factory()->create(['module_id' => $module->id, 'title' => 'PHP OOP']);

        Enrollment::factory()->create(['user_id' => $learner->id, 'course_id' => $course->id]);

        $test = \App\Models\Test::factory()->create([
            'testable_type' => Resource::class,
            'testable_id' => $resource->id,
        ]);

        \App\Models\TestAttempt::factory()->endorsed()->create([
            'user_id' => $learner->id,
            'test_id' => $test->id,
            'endorsed_by' => $mentor->id,
        ]);

        $summary = UserProgressSummary::forUser($learner);

        $this->assertContains('PHP OOP', $summary->endorsedSkills);
        $this->assertEquals(1, $summary->totalEndorsements);
    }

    public function test_returns_empty_for_new_user_with_no_activity(): void
    {
        $learner = User::factory()->learner()->create();

        $summary = UserProgressSummary::forUser($learner);

        $this->assertEmpty($summary->enrolledCourses);
        $this->assertEmpty($summary->endorsedSkills);
        $this->assertEmpty($summary->recentCompletions);
        $this->assertEquals(0, $summary->totalEndorsements);
    }

    public function test_to_prompt_section_returns_empty_string_for_new_user(): void
    {
        $learner = User::factory()->learner()->create();
        $summary = UserProgressSummary::forUser($learner);

        $this->assertEquals('', $summary->toPromptSection());
    }

    public function test_to_prompt_section_includes_course_completion(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'React Essentials']);
        $module = Module::factory()->create(['course_id' => $course->id]);
        Resource::factory()->count(2)->create(['module_id' => $module->id]);

        Enrollment::factory()->create(['user_id' => $learner->id, 'course_id' => $course->id]);

        $summary = UserProgressSummary::forUser($learner);
        $section = $summary->toPromptSection();

        $this->assertStringContainsString('React Essentials', $section);
        $this->assertStringContainsString('0%', $section);
    }

    public function test_to_prompt_section_scoped_to_course_shows_current_course_prominently(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();

        $courseA = Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Course A']);
        $courseB = Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Course B']);

        $moduleA = Module::factory()->create(['course_id' => $courseA->id]);
        $moduleB = Module::factory()->create(['course_id' => $courseB->id]);

        $resA = Resource::factory()->count(2)->create(['module_id' => $moduleA->id]);
        Resource::factory()->count(2)->create(['module_id' => $moduleB->id]);

        $enrollA = Enrollment::factory()->create(['user_id' => $learner->id, 'course_id' => $courseA->id]);
        Enrollment::factory()->create(['user_id' => $learner->id, 'course_id' => $courseB->id]);

        ResourceCompletion::factory()->endorsed()->create([
            'enrollment_id' => $enrollA->id,
            'resource_id' => $resA[0]->id,
        ]);

        $summary = UserProgressSummary::forUser($learner, $courseA);
        $section = $summary->toPromptSection('Course A');

        $this->assertStringContainsString('Current course: Course A', $section);
        $this->assertStringContainsString('50%', $section);
        $this->assertStringContainsString('Course B', $section); // other courses shown briefly
    }

    public function test_platform_chat_includes_progress_in_system_prompt(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Vue Mastery']);
        Module::factory()->create(['course_id' => $course->id]);
        Enrollment::factory()->create(['user_id' => $learner->id, 'course_id' => $course->id]);

        $this->mockAiAndCapturePrompt(function (string $systemPrompt) {
            $this->assertStringContainsString('Vue Mastery', $systemPrompt);
            $this->assertStringContainsString("Learner's Progress", $systemPrompt);
        });

        $this->actingAs($learner)
            ->postJson(route('chat.platform', ['locale' => 'en']), [
                'message' => 'What courses am I enrolled in?',
            ])->assertOk();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function mockAiAndCapturePrompt(callable $assertion): void
    {
        $this->instance(\App\Contracts\AiProvider::class, new class($assertion) implements \App\Contracts\AiProvider
        {
            public function __construct(private readonly mixed $assertion) {}

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
                ($this->assertion)($systemPrompt);
                $onChunk('Response');
            }

            public function complete(string $systemPrompt, string $userMessage, string $model = 'gpt-4o-mini'): string
            {
                return 'Mock response';
            }

            /** @return float[] */
            public function embed(string $text): array
            {
                return array_fill(0, 512, 0.1);
            }
        });
    }
}
