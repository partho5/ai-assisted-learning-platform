<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Course;
use App\Models\ForumCategory;
use App\Models\ForumThread;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentLanguageSitemapTest extends TestCase
{
    use RefreshDatabase;

    public function test_articles_are_listed_only_under_their_own_locale(): void
    {
        $bengali = Article::factory()->published()->bengali()->create();
        $english = Article::factory()->published()->english()->create();

        $response = $this->get('/sitemap.xml')->assertOk();

        $response->assertSee("/bn/resources/{$bengali->slug}", false);
        $response->assertDontSee("/en/resources/{$bengali->slug}", false);

        $response->assertSee("/en/resources/{$english->slug}", false);
        $response->assertDontSee("/bn/resources/{$english->slug}", false);
    }

    public function test_courses_are_listed_only_under_their_own_locale(): void
    {
        $bengali = Course::factory()->published()->bengali()->create(['is_link_only' => false]);
        $english = Course::factory()->published()->english()->create(['is_link_only' => false]);

        $response = $this->get('/sitemap.xml')->assertOk();

        $response->assertSee("/bn/courses/{$bengali->slug}", false);
        $response->assertDontSee("/en/courses/{$bengali->slug}", false);

        $response->assertSee("/en/courses/{$english->slug}", false);
        $response->assertDontSee("/bn/courses/{$english->slug}", false);
    }

    public function test_forum_threads_are_listed_only_under_their_own_locale(): void
    {
        $category = ForumCategory::factory()->create();
        $bengali = ForumThread::factory()->bengali()->create(['category_id' => $category->id]);
        $english = ForumThread::factory()->english()->create(['category_id' => $category->id]);

        $response = $this->get('/sitemap.xml')->assertOk();

        $response->assertSee("/bn/forum/{$category->slug}/{$bengali->slug}", false);
        $response->assertDontSee("/en/forum/{$category->slug}/{$bengali->slug}", false);

        $response->assertSee("/en/forum/{$category->slug}/{$english->slug}", false);
        $response->assertDontSee("/bn/forum/{$category->slug}/{$english->slug}", false);
    }

    /**
     * Static pages are UI chrome rather than content records, so both locales
     * are genuinely distinct, self-canonical pages.
     */
    public function test_static_pages_are_listed_under_both_locales(): void
    {
        $response = $this->get('/sitemap.xml')->assertOk();

        foreach (['about-us', 'contact', 'terms', 'privacy-policy', 'refund-policy', 'courses', 'resources'] as $path) {
            $response->assertSee("/bn/{$path}", false);
            $response->assertSee("/en/{$path}", false);
        }
    }

    public function test_bengali_home_outranks_english_home(): void
    {
        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertSame('1.0', $this->priorityFor($xml, '/bn/'));
        $this->assertSame('0.9', $this->priorityFor($xml, '/en/'));
    }

    /**
     * A category with no threads in a locale would be an empty listing page.
     */
    public function test_forum_category_is_only_listed_where_it_has_threads(): void
    {
        $category = ForumCategory::factory()->create();
        ForumThread::factory()->bengali()->create(['category_id' => $category->id]);

        $response = $this->get('/sitemap.xml')->assertOk();

        $response->assertSee("/bn/forum/{$category->slug}", false);
        $response->assertDontSee("/en/forum/{$category->slug}</loc>", false);
    }

    public function test_no_hreflang_alternates_are_emitted(): void
    {
        Article::factory()->published()->bengali()->create();

        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringNotContainsString('hreflang', $xml);
        $this->assertStringNotContainsString('xhtml:link', $xml);
    }

    public function test_sitemap_is_well_formed_xml(): void
    {
        Article::factory()->published()->bengali()->create(['slug' => 'ওয়েব-ডেভেলপমেন্ট']);

        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertNotFalse(simplexml_load_string($xml), 'sitemap is not well-formed XML');
    }

    /**
     * Marking a course link-only is the author opting that resource out of
     * discovery. That intent is locale-independent and applies to LLM crawlers
     * as much as to search engines.
     */
    public function test_link_only_courses_are_excluded_from_discovery_surfaces(): void
    {
        $bengali = Course::factory()->published()->bengali()->create(['is_link_only' => true]);
        $english = Course::factory()->published()->english()->create(['is_link_only' => true]);

        $sitemap = $this->get('/sitemap.xml')->assertOk();
        $llms = $this->get('/llms.txt')->assertOk();

        foreach ([$bengali, $english] as $course) {
            $sitemap->assertDontSee("/courses/{$course->slug}", false);
            $llms->assertDontSee("/courses/{$course->slug}", false);
        }
    }

    public function test_non_link_only_courses_remain_discoverable(): void
    {
        $course = Course::factory()->published()->bengali()->create(['is_link_only' => false]);

        $this->get('/sitemap.xml')->assertOk()->assertSee("/bn/courses/{$course->slug}", false);
        $this->get('/llms.txt')->assertOk()->assertSee("/bn/courses/{$course->slug}", false);
    }

    /**
     * Forum threads are the highest-value indexable forum content, so every
     * live thread must be listed. Soft-deleted threads must not be.
     */
    public function test_every_live_forum_thread_is_listed(): void
    {
        $category = ForumCategory::factory()->create();

        $threads = ForumThread::factory()->english()->count(3)->create(['category_id' => $category->id]);
        $deleted = ForumThread::factory()->english()->create(['category_id' => $category->id]);
        $deleted->delete();

        $response = $this->get('/sitemap.xml')->assertOk();

        foreach ($threads as $thread) {
            $response->assertSee("/en/forum/{$category->slug}/{$thread->slug}", false);
        }

        $response->assertDontSee("/en/forum/{$category->slug}/{$deleted->slug}", false);
    }

    public function test_llms_txt_uses_each_record_own_locale(): void
    {
        $bengali = Article::factory()->published()->bengali()->create();
        $english = Article::factory()->published()->english()->create();

        $response = $this->get('/llms.txt')->assertOk();

        $response->assertSee("/bn/resources/{$bengali->slug}", false);
        $response->assertSee("/en/resources/{$english->slug}", false);
    }

    public function test_robots_disallows_private_paths_in_every_supported_locale(): void
    {
        $response = $this->get('/robots.txt')->assertOk();

        foreach (config('app.supported_locales') as $locale) {
            $response->assertSee("Disallow: /{$locale}/dashboard", false);
            $response->assertSee("Disallow: /{$locale}/admin/", false);
            $response->assertSee("Disallow: /{$locale}/mentor/", false);
        }
    }

    private function priorityFor(string $xml, string $path): ?string
    {
        preg_match_all('#<url>\s*<loc>([^<]+)</loc>.*?<priority>([^<]+)</priority>#s', $xml, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            if (str_ends_with($match[1], $path)) {
                return $match[2];
            }
        }

        return null;
    }
}
