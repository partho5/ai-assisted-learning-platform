<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LinkOnlyCourseTest extends TestCase
{
    use RefreshDatabase;

    public function test_link_only_course_is_excluded_from_public_catalog(): void
    {
        $mentor = User::factory()->mentor()->create();

        Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Normal Course', 'is_link_only' => false]);
        Course::factory()->for($mentor, 'mentor')->published()->create(['title' => 'Link Only Course', 'is_link_only' => true]);

        $this->get(route('courses.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('courses/index')
                ->has('courses.data', 1)
                ->where('courses.data.0.title', 'Normal Course')
            );
    }

    public function test_link_only_course_is_directly_accessible_via_url(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create(['is_link_only' => true]);

        $this->get(route('courses.show', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/show'));
    }

    public function test_link_only_course_is_excluded_from_sitemap(): void
    {
        $mentor = User::factory()->mentor()->create();

        Course::factory()->for($mentor, 'mentor')->published()->create(['slug' => 'normal-course', 'is_link_only' => false]);
        Course::factory()->for($mentor, 'mentor')->published()->create(['slug' => 'link-only-course', 'is_link_only' => true]);

        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('normal-course', $xml);
        $this->assertStringNotContainsString('link-only-course', $xml);
    }

    public function test_mentor_can_set_is_link_only_when_creating_a_course(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->post(route('courses.store', ['locale' => 'en']), [
                'language' => 'en',
                'title' => 'Secret Course',
                'description' => 'Description here',
                'what_you_will_learn' => 'Things',
                'difficulty' => 'beginner',
                'is_link_only' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('courses', [
            'title' => 'Secret Course',
            'is_link_only' => true,
        ]);
    }

    public function test_mentor_can_toggle_is_link_only_when_updating_a_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->draft()->create(['is_link_only' => false]);
        $course->authors()->attach($mentor->id, ['role' => 'lead', 'added_by' => $mentor->id]);

        $this->actingAs($mentor)
            ->put(route('courses.update', ['locale' => 'en', 'course' => $course->slug]), [
                'language' => $course->language->value,
                'title' => $course->title,
                'description' => $course->description,
                'what_you_will_learn' => $course->what_you_will_learn,
                'difficulty' => $course->difficulty->value,
                'is_link_only' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'is_link_only' => true,
        ]);
    }
}
