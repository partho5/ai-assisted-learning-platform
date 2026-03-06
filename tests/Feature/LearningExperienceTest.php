<?php

namespace Tests\Feature;

use App\Enums\AttemptStatus;
use App\Enums\EvaluationMethod;
use App\Enums\QuestionType;
use App\Enums\ResourceCompletionStatus;
use App\Jobs\GradeTestAnswerWithAi;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Module;
use App\Models\Resource;
use App\Models\Test;
use App\Models\TestAttempt;
use App\Models\TestQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class LearningExperienceTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function learnRoute(Course $course, Resource $resource): string
    {
        return route('learn.show', ['locale' => 'en', 'course' => $course->slug, 'resource' => $resource->id]);
    }

    private function attemptStoreRoute(Course $course, Resource $resource): string
    {
        return route('learn.attempts.store', ['locale' => 'en', 'course' => $course->slug, 'resource' => $resource->id]);
    }

    private function attemptSubmitRoute(TestAttempt $attempt): string
    {
        return route('learn.attempts.submit', ['locale' => 'en', 'attempt' => $attempt->id]);
    }

    private function attemptAnswersRoute(TestAttempt $attempt): string
    {
        return route('learn.attempts.answers', ['locale' => 'en', 'attempt' => $attempt->id]);
    }

    private function completeRoute(Course $course, Resource $resource): string
    {
        return route('learn.complete', ['locale' => 'en', 'course' => $course->slug, 'resource' => $resource->id]);
    }

    private function endorseRoute(TestAttempt $attempt): string
    {
        return route('test-attempts.endorse', ['locale' => 'en', 'attempt' => $attempt->id]);
    }

    private function setupCourseWithResource(string $resourceType = 'text', bool $isFree = false): array
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->for($module)->create([
            'type' => $resourceType,
            'is_free' => $isFree,
        ]);

        return compact('mentor', 'course', 'module', 'resource');
    }

    // ─── Access Control ───────────────────────────────────────────────────────

    public function test_guest_can_access_free_resource(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', true);

        $this->get($this->learnRoute($course, $resource))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('courses/learn')
                ->where('enrollment', null)
            );
    }

    public function test_guest_cannot_access_non_free_resource(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', false);

        $this->get($this->learnRoute($course, $resource))
            ->assertRedirect(route('login'));
    }

    public function test_non_enrolled_auth_user_can_access_free_resource(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', true);
        $learner = User::factory()->learner()->create();

        $this->actingAs($learner)
            ->get($this->learnRoute($course, $resource))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('courses/learn')
                ->where('enrollment', null)
            );
    }

    public function test_non_enrolled_auth_user_cannot_access_non_free_resource(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', false);
        $learner = User::factory()->learner()->create();

        $this->actingAs($learner)
            ->get($this->learnRoute($course, $resource))
            ->assertRedirect(route('courses.show', ['locale' => 'en', 'course' => $course->slug]));
    }

    public function test_observer_sees_all_resources_including_locked(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', false);
        $learner = User::factory()->learner()->create();
        Enrollment::factory()->for($learner, 'user')->for($course)->create();

        // Observer can still reach the learn page — locked resources are handled inline on the frontend
        $this->actingAs($learner)
            ->get($this->learnRoute($course, $resource))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/learn'));
    }

    public function test_observer_can_access_free_resource(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', true);
        $learner = User::factory()->learner()->create();
        Enrollment::factory()->for($learner, 'user')->for($course)->create();

        $this->actingAs($learner)
            ->get($this->learnRoute($course, $resource))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/learn'));
    }

    public function test_full_access_learner_can_access_any_resource(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', false);
        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();

        $this->actingAs($learner)
            ->get($this->learnRoute($course, $resource))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/learn'));
    }

    public function test_resources_array_and_initial_resource_id_are_returned(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', true);
        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();

        $this->actingAs($learner)
            ->get($this->learnRoute($course, $resource))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('courses/learn')
                ->where('initialResourceId', $resource->id)
                ->has('resources', 1)
                ->has('resources.0', fn ($r) => $r
                    ->where('id', $resource->id)
                    ->where('title', $resource->title)
                    ->etc()
                )
            );
    }

    public function test_learner_props_do_not_contain_correct_answer_or_ai_rubric(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create(['is_free' => true]);
        $test = Test::factory()->forResource($resource)->create();
        TestQuestion::factory()->for($test)->create([
            'correct_answer' => 'secret answer',
            'ai_rubric' => 'secret rubric',
        ]);

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->for($learner, 'user')->for($course)->create();

        $response = $this->actingAs($learner)
            ->get($this->learnRoute($course, $resource));

        $response->assertOk();
        $content = $response->getContent();
        $this->assertStringNotContainsString('secret answer', $content);
        $this->assertStringNotContainsString('secret rubric', $content);
    }

    // ─── Attempt Management ───────────────────────────────────────────────────

    public function test_starting_attempt_creates_test_attempt_in_progress(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        Test::factory()->forResource($resource)->create();

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();

        $this->actingAs($learner)
            ->post($this->attemptStoreRoute($course, $resource))
            ->assertRedirect();

        $this->assertDatabaseHas('test_attempts', [
            'user_id' => $learner->id,
            'status' => AttemptStatus::InProgress->value,
        ]);
    }

    public function test_cannot_exceed_max_attempts(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create(['max_attempts' => 1]);

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();

        // Create a completed attempt
        TestAttempt::factory()->for($test)->for($learner, 'user')->graded()->create(['attempt_number' => 1]);

        $this->actingAs($learner)
            ->post($this->attemptStoreRoute($course, $resource))
            ->assertRedirect()
            ->assertSessionHas('error', 'Maximum attempts reached.');
    }

    public function test_autosave_updates_answer_without_changing_status(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create();
        $question = TestQuestion::factory()->for($test)->create();

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();
        $attempt = TestAttempt::factory()->for($test)->for($learner, 'user')->inProgress()->create();

        $this->actingAs($learner)
            ->putJson($this->attemptAnswersRoute($attempt), [
                'answers' => [
                    ['question_id' => $question->id, 'value' => 'my answer'],
                ],
            ])
            ->assertOk()
            ->assertJson(['saved' => true]);

        $this->assertDatabaseHas('test_attempt_answers', [
            'test_attempt_id' => $attempt->id,
            'test_question_id' => $question->id,
            'answer_value' => 'my answer',
        ]);
        $this->assertDatabaseHas('test_attempts', [
            'id' => $attempt->id,
            'status' => AttemptStatus::InProgress->value,
        ]);
    }

    // ─── Grading ──────────────────────────────────────────────────────────────

    public function test_submit_transitions_to_graded_without_ai_questions(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create();
        TestQuestion::factory()->for($test)->create([
            'question_type' => QuestionType::ShortText,
            'evaluation_method' => EvaluationMethod::ExactMatch,
            'correct_answer' => 'paris',
            'points' => 2,
        ]);

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();
        $attempt = TestAttempt::factory()->for($test)->for($learner, 'user')->inProgress()->create();

        $this->actingAs($learner)
            ->post($this->attemptSubmitRoute($attempt))
            ->assertRedirect();

        $this->assertDatabaseHas('test_attempts', [
            'id' => $attempt->id,
            'status' => AttemptStatus::Graded->value,
        ]);
    }

    public function test_correct_answer_scores_full_points(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create();
        $question = TestQuestion::factory()->for($test)->create([
            'evaluation_method' => EvaluationMethod::ExactMatch,
            'correct_answer' => 'paris',
            'points' => 3,
        ]);

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();
        $attempt = TestAttempt::factory()->for($test)->for($learner, 'user')->inProgress()->create();

        // Save the correct answer
        $this->actingAs($learner)->putJson($this->attemptAnswersRoute($attempt), [
            'answers' => [['question_id' => $question->id, 'value' => 'paris']],
        ]);

        $this->actingAs($learner)->post($this->attemptSubmitRoute($attempt));

        $this->assertDatabaseHas('test_attempt_answers', [
            'test_attempt_id' => $attempt->id,
            'test_question_id' => $question->id,
            'is_correct' => true,
            'points_earned' => 3,
        ]);
    }

    public function test_wrong_answer_scores_zero(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create();
        $question = TestQuestion::factory()->for($test)->create([
            'evaluation_method' => EvaluationMethod::ExactMatch,
            'correct_answer' => 'paris',
            'points' => 3,
        ]);

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();
        $attempt = TestAttempt::factory()->for($test)->for($learner, 'user')->inProgress()->create();

        $this->actingAs($learner)->putJson($this->attemptAnswersRoute($attempt), [
            'answers' => [['question_id' => $question->id, 'value' => 'london']],
        ]);

        $this->actingAs($learner)->post($this->attemptSubmitRoute($attempt));

        $this->assertDatabaseHas('test_attempt_answers', [
            'test_attempt_id' => $attempt->id,
            'test_question_id' => $question->id,
            'is_correct' => false,
            'points_earned' => 0,
        ]);
    }

    public function test_ai_questions_dispatch_grade_job_on_submit(): void
    {
        Queue::fake();

        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create();
        TestQuestion::factory()->for($test)->aiGraded()->create(['points' => 5]);

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();
        $attempt = TestAttempt::factory()->for($test)->for($learner, 'user')->inProgress()->create();

        $this->actingAs($learner)
            ->post($this->attemptSubmitRoute($attempt))
            ->assertRedirect();

        Queue::assertPushed(GradeTestAnswerWithAi::class);

        $this->assertDatabaseHas('test_attempts', [
            'id' => $attempt->id,
            'status' => AttemptStatus::Grading->value,
        ]);
    }

    // ─── Completion ───────────────────────────────────────────────────────────

    public function test_non_test_resource_mark_complete_auto_endorses(): void
    {
        ['course' => $course, 'resource' => $resource] = $this->setupCourseWithResource('text', false);
        $learner = User::factory()->learner()->create();
        $enrollment = Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();

        $this->actingAs($learner)
            ->post($this->completeRoute($course, $resource))
            ->assertRedirect();

        $this->assertDatabaseHas('resource_completions', [
            'enrollment_id' => $enrollment->id,
            'resource_id' => $resource->id,
            'status' => ResourceCompletionStatus::Endorsed->value,
        ]);
    }

    // ─── Endorsement ─────────────────────────────────────────────────────────

    public function test_mentor_can_endorse_submission(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create();

        $learner = User::factory()->learner()->create();
        $enrollment = Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();
        $attempt = TestAttempt::factory()->for($test)->for($learner, 'user')->graded()->create();

        $this->actingAs($mentor)
            ->post($this->endorseRoute($attempt), ['mentor_feedback' => 'Great work!'])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('test_attempts', [
            'id' => $attempt->id,
            'status' => AttemptStatus::Endorsed->value,
            'mentor_feedback' => 'Great work!',
        ]);
    }

    public function test_non_mentor_cannot_endorse(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->assignment()->for($module)->create();
        $test = Test::factory()->forResource($resource)->create();

        $learner = User::factory()->learner()->create();
        Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();
        $attempt = TestAttempt::factory()->for($test)->for($learner, 'user')->graded()->create();

        $anotherLearner = User::factory()->learner()->create();
        $this->actingAs($anotherLearner)
            ->post($this->endorseRoute($attempt))
            ->assertForbidden();
    }

    // ─── Progress ────────────────────────────────────────────────────────────

    public function test_progress_percent_reflects_endorsed_completions(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->published()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $r1 = Resource::factory()->for($module)->create(['is_free' => true]);
        $r2 = Resource::factory()->for($module)->create(['is_free' => true]);

        $learner = User::factory()->learner()->create();
        $enrollment = Enrollment::factory()->full()->for($learner, 'user')->for($course)->create();

        // Complete 1 of 2 resources
        $this->actingAs($learner)->post($this->completeRoute($course, $r1));

        $enrollment->refresh();
        $this->assertEquals(50, $enrollment->completionPercentage(2));
    }
}
