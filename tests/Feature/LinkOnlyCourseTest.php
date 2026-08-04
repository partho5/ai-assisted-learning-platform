<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LinkOnlyCourseTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A free resource is the only entry point a guest — or a crawler — can reach
     * on a learn page, so it is what these tests exercise.
     */
    private function freeResource(Course $course): Resource
    {
        return Resource::factory()
            ->for(Module::factory()->for($course))
            ->create(['is_free' => true]);
    }

    /**
     * `featuredCourses` is an `Inertia::defer()` prop, so it never appears in an
     * initial page load — it has to be fetched the way the browser fetches it,
     * as a partial reload. The asset version must match or Inertia answers 409.
     *
     * The reply is JSON rather than a view, so callers assert with
     * `assertJsonPath()`; `assertInertia()` only reads HTML responses.
     *
     * @return array<string, string>
     */
    private function deferredFeaturedCoursesHeaders(): array
    {
        return [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
            'X-Inertia-Partial-Component' => 'welcome',
            'X-Inertia-Partial-Data' => 'featuredCourses',
        ];
    }

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

    public function test_link_only_course_page_is_marked_noindex(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create(['is_link_only' => true]);

        $this->get(route('courses.show', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/show')->where('noindex', true));
    }

    public function test_link_only_learn_page_is_marked_noindex(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create(['is_link_only' => true]);
        $resource = $this->freeResource($course);

        $this->get(route('learn.show', ['locale' => 'en', 'course' => $course->slug, 'resource' => $resource->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('courses/learn')->where('noindex', true));
    }

    public function test_normal_published_course_and_lesson_are_indexable(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create(['is_link_only' => false]);
        $resource = $this->freeResource($course);

        $this->get(route('courses.show', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('noindex', false));

        $this->get(route('learn.show', ['locale' => 'en', 'course' => $course->slug, 'resource' => $resource->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('noindex', false));
    }

    public function test_featured_link_only_course_is_excluded_from_the_landing_page(): void
    {
        $mentor = User::factory()->mentor()->create();

        Course::factory()->for($mentor, 'mentor')->published()->english()->create([
            'title' => 'Featured Normal Course',
            'is_featured' => true,
            'is_link_only' => false,
        ]);
        Course::factory()->for($mentor, 'mentor')->published()->english()->create([
            'title' => 'Featured Link Only Course',
            'is_featured' => true,
            'is_link_only' => true,
        ]);

        $this->withHeaders($this->deferredFeaturedCoursesHeaders())
            ->get(route('home', ['locale' => 'en']))
            ->assertOk()
            ->assertJsonCount(1, 'props.featuredCourses')
            ->assertJsonPath('props.featuredCourses.0.title', 'Featured Normal Course');
    }

    public function test_course_page_receives_the_fields_the_json_ld_builder_needs(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->published()->create([
            'price' => null,
            'currency' => 'USD',
            'billing_type' => 'one_time',
            'estimated_duration' => 150,
        ]);

        $this->get(route('courses.show', ['locale' => 'en', 'course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('course.price', null)
                ->where('course.currency', 'USD')
                ->where('course.billing_type', 'one_time')
                ->where('course.estimated_duration', 150)
                ->has('course.what_you_will_learn')
                ->has('course.created_at')
                ->has('course.updated_at')
            );
    }

    public function test_landing_page_receives_raw_pricing_for_the_json_ld_builder(): void
    {
        $mentor = User::factory()->mentor()->create();
        Course::factory()->for($mentor, 'mentor')->published()->english()->create([
            'price' => '5.00',
            'currency' => 'USD',
            'billing_type' => 'subscription',
            'subscription_duration_months' => 6,
        ]);

        $this->withHeaders($this->deferredFeaturedCoursesHeaders())
            ->get(route('home', ['locale' => 'en']))
            ->assertOk()
            ->assertJsonPath('props.featuredCourses.0.price', '$5.00/month')
            ->assertJsonPath('props.featuredCourses.0.raw_price', '5.00')
            ->assertJsonPath('props.featuredCourses.0.currency', 'USD')
            ->assertJsonPath('props.featuredCourses.0.billing_type', 'subscription')
            ->assertJsonPath('props.featuredCourses.0.subscription_duration_months', 6);
    }

    public function test_mentor_can_set_is_link_only_when_creating_a_course(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->post(route('courses.store'), [
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
        $course->authors()->syncWithoutDetaching([$mentor->id => ['role' => 'lead', 'added_by' => $mentor->id]]);

        $this->actingAs($mentor)
            ->put(route('courses.update', ['course' => $course->slug]), [
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
