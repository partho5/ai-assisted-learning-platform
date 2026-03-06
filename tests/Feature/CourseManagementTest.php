<?php

namespace Tests\Feature;

use App\Enums\CourseDifficulty;
use App\Enums\CourseStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseManagementTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // index
    // ──────────────────────────────────────────────

    public function test_guest_sees_public_catalog_at_course_index(): void
    {
        $this->get(route('courses.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/index'));
    }

    public function test_learner_sees_public_catalog_at_course_index(): void
    {
        $this->actingAs(User::factory()->learner()->create())
            ->get(route('courses.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/index'));
    }

    public function test_mentor_can_view_course_index(): void
    {
        $this->actingAs(User::factory()->mentor()->create())
            ->get(route('courses.index', ['locale' => 'en']))
            ->assertOk();
    }

    public function test_mentor_sees_only_their_own_courses(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();

        Course::factory()->for($mentor, 'mentor')->create(['title' => 'My Course']);
        Course::factory()->for($other, 'mentor')->create(['title' => 'Their Course']);

        $this->actingAs($mentor)
            ->get(route('courses.index', ['locale' => 'en']))
            ->assertInertia(fn ($page) => $page
                ->component('mentor/courses/index')
                ->has('courses', 1)
            );
    }

    // ──────────────────────────────────────────────
    // create / store
    // ──────────────────────────────────────────────

    public function test_mentor_can_view_create_page(): void
    {
        $this->actingAs(User::factory()->mentor()->create())
            ->get(route('courses.create', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('mentor/courses/create'));
    }

    public function test_mentor_can_create_a_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $category = Category::factory()->create();

        $this->actingAs($mentor)
            ->post(route('courses.store', ['locale' => 'en']), [
                'title' => 'Intro to Laravel',
                'description' => 'A great course.',
                'what_you_will_learn' => 'You will learn Laravel.',
                'difficulty' => CourseDifficulty::Beginner->value,
                'category_id' => $category->id,
                'estimated_duration' => 120,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('courses', [
            'title' => 'Intro to Laravel',
            'user_id' => $mentor->id,
            'status' => CourseStatus::Draft->value,
        ]);
    }

    public function test_course_slug_is_auto_generated(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)->post(route('courses.store', ['locale' => 'en']), [
            'title' => 'My Awesome Course',
            'description' => 'Desc',
            'what_you_will_learn' => 'Things',
            'difficulty' => CourseDifficulty::Intermediate->value,
        ]);

        $this->assertDatabaseHas('courses', ['slug' => 'my-awesome-course']);
    }

    public function test_slug_is_unique_when_title_collides(): void
    {
        $mentor = User::factory()->mentor()->create();
        Course::factory()->for($mentor, 'mentor')->create(['slug' => 'my-course']);

        $this->actingAs($mentor)->post(route('courses.store', ['locale' => 'en']), [
            'title' => 'My Course',
            'description' => 'Desc',
            'what_you_will_learn' => 'Things',
            'difficulty' => CourseDifficulty::Beginner->value,
        ]);

        $this->assertDatabaseHas('courses', ['slug' => 'my-course-1']);
    }

    public function test_course_creation_requires_title(): void
    {
        $this->actingAs(User::factory()->mentor()->create())
            ->post(route('courses.store', ['locale' => 'en']), [
                'description' => 'Desc',
                'what_you_will_learn' => 'Things',
                'difficulty' => CourseDifficulty::Beginner->value,
            ])
            ->assertSessionHasErrors('title');
    }

    public function test_course_creation_requires_what_you_will_learn(): void
    {
        $this->actingAs(User::factory()->mentor()->create())
            ->post(route('courses.store', ['locale' => 'en']), [
                'title' => 'Test',
                'description' => 'Desc',
                'difficulty' => CourseDifficulty::Beginner->value,
            ])
            ->assertSessionHasErrors('what_you_will_learn');
    }

    // ──────────────────────────────────────────────
    // edit / update
    // ──────────────────────────────────────────────

    public function test_mentor_can_edit_own_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->get(route('courses.edit', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('mentor/courses/edit'));
    }

    public function test_mentor_cannot_edit_another_mentors_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();

        $this->actingAs($mentor)
            ->get(route('courses.edit', ['locale' => 'en', 'course' => $course->slug]))
            ->assertForbidden();
    }

    public function test_admin_can_edit_any_course(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($admin)
            ->get(route('courses.edit', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk();
    }

    public function test_mentor_can_update_own_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->put(route('courses.update', ['locale' => 'en', 'course' => $course->slug]), [
                'title' => 'Updated Title',
                'description' => 'Updated description.',
                'what_you_will_learn' => 'Updated outcomes.',
                'difficulty' => CourseDifficulty::Advanced->value,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'title' => 'Updated Title',
            'difficulty' => CourseDifficulty::Advanced->value,
        ]);
    }

    public function test_mentor_can_publish_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->draft()->create();

        $this->actingAs($mentor)
            ->put(route('courses.update', ['locale' => 'en', 'course' => $course->slug]), [
                'title' => $course->title,
                'description' => $course->description,
                'what_you_will_learn' => $course->what_you_will_learn,
                'difficulty' => $course->difficulty->value,
                'status' => CourseStatus::Published->value,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'status' => CourseStatus::Published->value,
        ]);
    }

    public function test_mentor_cannot_update_another_mentors_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();

        $this->actingAs($mentor)
            ->put(route('courses.update', ['locale' => 'en', 'course' => $course->slug]), [
                'title' => 'Hacked',
                'description' => 'x',
                'what_you_will_learn' => 'x',
                'difficulty' => CourseDifficulty::Beginner->value,
            ])
            ->assertForbidden();
    }

    // ──────────────────────────────────────────────
    // destroy
    // ──────────────────────────────────────────────

    public function test_mentor_can_delete_own_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->delete(route('courses.destroy', ['locale' => 'en', 'course' => $course->slug]))
            ->assertRedirect(route('courses.index', ['locale' => 'en']));

        $this->assertDatabaseMissing('courses', ['id' => $course->id]);
    }

    public function test_mentor_cannot_delete_another_mentors_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();

        $this->actingAs($mentor)
            ->delete(route('courses.destroy', ['locale' => 'en', 'course' => $course->slug]))
            ->assertForbidden();
    }
}
