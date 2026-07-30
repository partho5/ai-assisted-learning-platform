<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Course;
use App\Models\ForumCategory;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Content is single-language, so a record must resolve to exactly one indexable
 * URL. Without this guard every record is reachable under both /bn/ and /en/,
 * serving identical bytes from two URLs.
 */
class EnsureContentLocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_bengali_course_under_english_locale_redirects_permanently(): void
    {
        $course = Course::factory()->published()->bengali()->create();

        $this->get("/en/courses/{$course->slug}")
            ->assertStatus(301)
            ->assertRedirect("/bn/courses/{$course->slug}");
    }

    public function test_english_course_under_bengali_locale_redirects_permanently(): void
    {
        $course = Course::factory()->published()->english()->create();

        $this->get("/bn/courses/{$course->slug}")
            ->assertStatus(301)
            ->assertRedirect("/en/courses/{$course->slug}");
    }

    public function test_course_under_its_own_locale_is_served_directly(): void
    {
        $bengali = Course::factory()->published()->bengali()->create();
        $english = Course::factory()->published()->english()->create();

        $this->get("/bn/courses/{$bengali->slug}")->assertOk();
        $this->get("/en/courses/{$english->slug}")->assertOk();
    }

    public function test_bengali_article_under_english_locale_redirects(): void
    {
        $article = Article::factory()->published()->bengali()->create();

        $this->get("/en/resources/{$article->slug}")
            ->assertStatus(301)
            ->assertRedirect("/bn/resources/{$article->slug}");
    }

    public function test_english_article_under_bengali_locale_redirects(): void
    {
        $article = Article::factory()->published()->english()->create();

        $this->get("/bn/resources/{$article->slug}")
            ->assertStatus(301)
            ->assertRedirect("/en/resources/{$article->slug}");
    }

    public function test_article_under_its_own_locale_is_served_directly(): void
    {
        $article = Article::factory()->published()->bengali()->create();

        $this->get("/bn/resources/{$article->slug}")->assertOk();
    }

    public function test_forum_thread_under_wrong_locale_redirects(): void
    {
        $category = ForumCategory::factory()->create();
        $thread = ForumThread::factory()->bengali()->create(['category_id' => $category->id]);

        $this->get("/en/forum/{$category->slug}/{$thread->slug}")
            ->assertStatus(301)
            ->assertRedirect("/bn/forum/{$category->slug}/{$thread->slug}");
    }

    public function test_forum_thread_under_its_own_locale_is_served_directly(): void
    {
        $category = ForumCategory::factory()->create();
        $thread = ForumThread::factory()->english()->create(['category_id' => $category->id]);

        $this->get("/en/forum/{$category->slug}/{$thread->slug}")->assertOk();
    }

    public function test_query_string_survives_the_redirect(): void
    {
        $course = Course::factory()->published()->bengali()->create();

        $this->get("/en/courses/{$course->slug}?utm_source=fb&ref=x")
            ->assertRedirect("/bn/courses/{$course->slug}?utm_source=fb&ref=x");
    }

    /**
     * Authors preview drafts from whichever locale they happen to be browsing;
     * bouncing them to the content's locale would be wrong.
     */
    public function test_author_preview_route_is_exempt_from_the_guard(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->bengali()->create(['user_id' => $mentor->id]);
        $course->authors()->syncWithoutDetaching([$mentor->id => ['role' => 'lead', 'added_by' => $mentor->id]]);

        $this->actingAs($mentor)
            ->get("/en/courses/{$course->slug}/preview")
            ->assertOk();
    }

    public function test_listing_pages_are_not_redirected(): void
    {
        Course::factory()->published()->bengali()->create();
        Article::factory()->published()->bengali()->create();

        $this->get('/en/courses')->assertOk();
        $this->get('/bn/courses')->assertOk();
        $this->get('/en/resources')->assertOk();
        $this->get('/bn/resources')->assertOk();
    }

    public function test_guard_does_not_mask_a_missing_record(): void
    {
        $this->get('/bn/courses/does-not-exist')->assertNotFound();
        $this->get('/en/resources/does-not-exist')->assertNotFound();
    }

    public function test_bengali_slug_round_trips_through_the_guard(): void
    {
        $article = Article::factory()->published()->bengali()->create([
            'slug' => 'ওয়েব-ডেভেলপমেন্ট',
        ]);

        $this->get('/bn/resources/ওয়েব-ডেভেলপমেন্ট')->assertOk();

        $this->get('/en/resources/ওয়েব-ডেভেলপমেন্ট')
            ->assertStatus(301)
            ->assertRedirect("/bn/resources/{$article->slug}");
    }
}
