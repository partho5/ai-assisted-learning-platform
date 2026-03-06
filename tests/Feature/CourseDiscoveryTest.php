<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Public catalog (courses.index)
    // ──────────────────────────────────────────────

    public function test_public_catalog_shows_only_published_courses(): void
    {
        $mentor = User::factory()->mentor()->create();

        Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Published Course']);
        Course::factory()->for($mentor, 'mentor')->draft()->create(['title' => 'Draft Course']);

        $this->get(route('courses.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('courses/index')
                ->has('courses.data', 1)
                ->where('courses.data.0.title', 'Published Course')
            );
    }

    public function test_catalog_filter_by_category(): void
    {
        $mentor = User::factory()->mentor()->create();
        $cat1 = Category::factory()->create(['slug' => 'web-dev']);
        $cat2 = Category::factory()->create(['slug' => 'design']);

        Course::factory()->for($mentor, 'mentor')->published()->create(['category_id' => $cat1->id, 'title' => 'Web Course']);
        Course::factory()->for($mentor, 'mentor')->published()->create(['category_id' => $cat2->id, 'title' => 'Design Course']);

        $this->get(route('courses.index', ['locale' => 'en', 'category' => 'web-dev']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('courses.data', 1)
                ->where('courses.data.0.title', 'Web Course')
            );
    }

    public function test_catalog_filter_by_difficulty(): void
    {
        $mentor = User::factory()->mentor()->create();

        Course::factory()->for($mentor, 'mentor')->published()->create(['difficulty' => 'beginner', 'title' => 'Beginner Course']);
        Course::factory()->for($mentor, 'mentor')->published()->create(['difficulty' => 'advanced', 'title' => 'Advanced Course']);

        $this->get(route('courses.index', ['locale' => 'en', 'difficulty' => 'beginner']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('courses.data', 1)
                ->where('courses.data.0.title', 'Beginner Course')
            );
    }

    public function test_catalog_search_by_keyword(): void
    {
        $mentor = User::factory()->mentor()->create();

        Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Laravel Fundamentals']);
        Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'React Basics']);

        $this->get(route('courses.index', ['locale' => 'en', 'search' => 'laravel']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('courses.data', 1)
                ->where('courses.data.0.title', 'Laravel Fundamentals')
            );
    }

    public function test_mentor_sees_their_management_view_at_course_index(): void
    {
        $mentor = User::factory()->mentor()->create();
        Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->get(route('courses.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('mentor/courses/index'));
    }

    // ──────────────────────────────────────────────
    // Course detail (courses.show)
    // ──────────────────────────────────────────────

    public function test_guest_can_view_published_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create();

        $this->get(route('courses.show', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('courses/show')
                ->where('course.slug', $course->slug)
                ->where('enrollment', null)
            );
    }

    public function test_draft_course_returns_404_on_show(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->draft()->create();

        $this->get(route('courses.show', ['locale' => 'en', 'course' => $course->slug]))
            ->assertNotFound();
    }

    public function test_show_passes_enrollment_to_enrolled_user(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create();

        Enrollment::factory()->create([
            'user_id' => $learner->id,
            'course_id' => $course->id,
        ]);

        $this->actingAs($learner)
            ->get(route('courses.show', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('enrollment.user_id', $learner->id)
                ->where('enrollment.access_level', 'observer')
            );
    }

    // ──────────────────────────────────────────────
    // Enrollment (courses.enroll)
    // ──────────────────────────────────────────────

    public function test_guest_cannot_enroll(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create();

        $this->post(route('courses.enroll', ['locale' => 'en', 'course' => $course->slug]))
            ->assertRedirect(route('login'));
    }

    public function test_logged_in_user_can_enroll_as_observer(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create();

        $this->actingAs($learner)
            ->post(route('courses.enroll', ['locale' => 'en', 'course' => $course->slug]))
            ->assertRedirect();

        $this->assertDatabaseHas('enrollments', [
            'user_id' => $learner->id,
            'course_id' => $course->id,
            'access_level' => 'observer',
        ]);
    }

    public function test_enrolling_twice_is_idempotent(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create();

        $this->actingAs($learner)
            ->post(route('courses.enroll', ['locale' => 'en', 'course' => $course->slug]));

        $this->actingAs($learner)
            ->post(route('courses.enroll', ['locale' => 'en', 'course' => $course->slug]));

        $this->assertDatabaseCount('enrollments', 1);
    }

    public function test_cannot_enroll_in_draft_course(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->draft()->create();

        $this->actingAs($learner)
            ->post(route('courses.enroll', ['locale' => 'en', 'course' => $course->slug]))
            ->assertNotFound();

        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_enrollment_redirects_to_course_show(): void
    {
        $learner = User::factory()->learner()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create();

        $this->actingAs($learner)
            ->post(route('courses.enroll', ['locale' => 'en', 'course' => $course->slug]))
            ->assertRedirect(route('courses.show', ['locale' => 'en', 'course' => $course->slug]));
    }
}
