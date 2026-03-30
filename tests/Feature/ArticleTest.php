<?php

namespace Tests\Feature;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleTest extends TestCase
{
    use RefreshDatabase;

    // ── Public browsing ──────────────────────────────────────────────────────

    public function test_guest_can_view_public_article_index(): void
    {
        Article::factory()->count(3)->published()->create();
        Article::factory()->draft()->create(); // must not appear

        $this->get(route('articles.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('articles/index')
                ->where('isAuthorView', false)
                ->has('articles.data', 3)
            );
    }

    public function test_guest_can_view_published_article(): void
    {
        $article = Article::factory()->published()->create();

        $this->get(route('articles.show', ['locale' => 'en', 'article' => $article->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('articles/show')
                ->where('article.slug', $article->slug)
                ->has('schemaTypes')
            );
    }

    public function test_guest_gets_404_for_draft_article(): void
    {
        $article = Article::factory()->draft()->create();

        $this->get(route('articles.show', ['locale' => 'en', 'article' => $article->slug]))
            ->assertNotFound();
    }

    // ── Mentor index sees own articles ───────────────────────────────────────

    public function test_mentor_index_shows_only_own_articles(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();

        Article::factory()->count(2)->create(['author_id' => $mentor->id]);
        Article::factory()->draft()->create(['author_id' => $mentor->id]);
        Article::factory()->create(['author_id' => $other->id]);

        $this->actingAs($mentor)
            ->get(route('articles.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('articles/index')
                ->where('isAuthorView', true)
                ->has('articles', 3) // 2 published + 1 draft, all own
            );
    }

    public function test_admin_index_shows_all_articles(): void
    {
        $admin = User::factory()->admin()->create();
        Article::factory()->count(4)->create();

        $this->actingAs($admin)
            ->get(route('articles.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('articles/index')
                ->where('isAdmin', true)
                ->has('articles', 4)
            );
    }

    // ── Create ───────────────────────────────────────────────────────────────

    public function test_mentor_can_access_create_form(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get(route('articles.create', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('articles/create'));
    }

    public function test_learner_cannot_access_create_form(): void
    {
        $learner = User::factory()->create();

        $this->actingAs($learner)
            ->get(route('articles.create', ['locale' => 'en']))
            ->assertForbidden();
    }

    public function test_guest_cannot_access_create_form(): void
    {
        $this->get(route('articles.create', ['locale' => 'en']))
            ->assertRedirect();
    }

    public function test_mentor_can_store_article(): void
    {
        $mentor = User::factory()->mentor()->create();
        $category = Category::factory()->create();

        $this->actingAs($mentor)
            ->post(route('articles.store', ['locale' => 'en']), [
                'title' => 'How to land a remote job',
                'slug' => 'how-to-land-a-remote-job',
                'excerpt' => 'A practical guide to landing remote work.',
                'body' => '<h2>Step 1</h2><p>Start here.</p>',
                'featured_image' => null,
                'tags' => ['career', 'remote'],
                'category_id' => $category->id,
                'status' => 'published',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('articles', [
            'title' => 'How to land a remote job',
            'author_id' => $mentor->id,
            'status' => ArticleStatus::Published->value,
        ]);
    }

    public function test_store_calculates_read_time(): void
    {
        $mentor = User::factory()->mentor()->create();
        $body = '<p>'.str_repeat('word ', 400).'</p>'; // ~400 words → 2 min

        $this->actingAs($mentor)
            ->post(route('articles.store', ['locale' => 'en']), [
                'title' => 'Long article',
                'slug' => 'long-article',
                'body' => $body,
                'status' => 'published',
            ]);

        $article = Article::where('slug', 'long-article')->first();
        $this->assertNotNull($article);
        $this->assertEquals(2, $article->read_time_minutes);
    }

    // ── Edit / Update ────────────────────────────────────────────────────────

    public function test_author_can_edit_own_article(): void
    {
        $mentor = User::factory()->mentor()->create();
        $article = Article::factory()->create(['author_id' => $mentor->id]);

        $this->actingAs($mentor)
            ->get(route('articles.edit', ['locale' => 'en', 'article' => $article->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('articles/edit'));
    }

    public function test_other_mentor_cannot_edit_article(): void
    {
        $owner = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $article = Article::factory()->create(['author_id' => $owner->id]);

        $this->actingAs($other)
            ->get(route('articles.edit', ['locale' => 'en', 'article' => $article->slug]))
            ->assertForbidden();
    }

    public function test_admin_can_edit_any_article(): void
    {
        $admin = User::factory()->admin()->create();
        $article = Article::factory()->create();

        $this->actingAs($admin)
            ->get(route('articles.edit', ['locale' => 'en', 'article' => $article->slug]))
            ->assertOk();
    }

    public function test_author_can_update_article(): void
    {
        $mentor = User::factory()->mentor()->create();
        $article = Article::factory()->create(['author_id' => $mentor->id]);

        $this->actingAs($mentor)
            ->put(route('articles.update', ['locale' => 'en', 'article' => $article->slug]), [
                'title' => 'Updated Title',
                'slug' => $article->slug,
                'body' => '<p>Updated body content here.</p>',
                'status' => 'published',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'title' => 'Updated Title',
        ]);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public function test_author_can_delete_own_article(): void
    {
        $mentor = User::factory()->mentor()->create();
        $article = Article::factory()->create(['author_id' => $mentor->id]);

        $this->actingAs($mentor)
            ->delete(route('articles.destroy', ['locale' => 'en', 'article' => $article->slug]))
            ->assertRedirect(route('articles.index', ['locale' => 'en']));

        $this->assertDatabaseMissing('articles', ['id' => $article->id]);
    }

    public function test_other_mentor_cannot_delete_article(): void
    {
        $owner = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $article = Article::factory()->create(['author_id' => $owner->id]);

        $this->actingAs($other)
            ->delete(route('articles.destroy', ['locale' => 'en', 'article' => $article->slug]))
            ->assertForbidden();

        $this->assertDatabaseHas('articles', ['id' => $article->id]);
    }

    // ── Schema detection ─────────────────────────────────────────────────────

    public function test_how_to_detection_triggers_on_matching_title(): void
    {
        $article = Article::factory()->make(['title' => 'How to write better code', 'body' => '<p>body</p>']);
        $this->assertTrue($article->detectsHowTo());
    }

    public function test_how_to_detection_does_not_trigger_on_generic_title(): void
    {
        $article = Article::factory()->make(['title' => 'Why Python is great', 'body' => '<p>body</p>']);
        $this->assertFalse($article->detectsHowTo());
    }

    public function test_faq_detection_triggers_with_two_question_headings(): void
    {
        $body = '<h2>What is Laravel?</h2><p>A PHP framework.</p><h2>Why use it?</h2><p>Because it is great.</p>';
        $article = Article::factory()->make(['title' => 'FAQ', 'body' => $body]);
        $this->assertTrue($article->detectsFaq());
    }

    public function test_faq_detection_does_not_trigger_with_one_question(): void
    {
        $body = '<h2>What is Laravel?</h2><p>A PHP framework.</p><h2>Getting started</h2><p>Install it.</p>';
        $article = Article::factory()->make(['title' => 'Guide', 'body' => $body]);
        $this->assertFalse($article->detectsFaq());
    }

    // ── Slug uniqueness ──────────────────────────────────────────────────────

    public function test_duplicate_slug_is_rejected(): void
    {
        $mentor = User::factory()->mentor()->create();
        Article::factory()->create(['slug' => 'my-article', 'author_id' => $mentor->id]);

        $this->actingAs($mentor)
            ->post(route('articles.store', ['locale' => 'en']), [
                'title' => 'Another article',
                'slug' => 'my-article',
                'body' => '<p>body</p>',
                'status' => 'published',
            ])
            ->assertSessionHasErrors('slug');
    }

    // ── Sitemap ──────────────────────────────────────────────────────────────

    public function test_published_articles_appear_in_sitemap(): void
    {
        Article::factory()->published()->create(['slug' => 'my-guide']);
        Article::factory()->draft()->create(['slug' => 'hidden-draft']);

        $response = $this->get(route('sitemap'));
        $response->assertOk();
        $response->assertSee('/en/resources/my-guide');
        $response->assertDontSee('/en/resources/hidden-draft');
    }

    // ── Scheduled status ─────────────────────────────────────────────────────

    public function test_scheduled_article_past_due_returns_404(): void
    {
        $article = Article::factory()->create([
            'status' => 'scheduled',
            'published_at' => now()->subMinute(),
        ]);

        $this->get(route('articles.show', ['locale' => 'en', 'article' => $article->slug]))
            ->assertNotFound();
    }

    public function test_scheduled_article_future_returns_404(): void
    {
        $article = Article::factory()->create([
            'status' => 'scheduled',
            'published_at' => now()->addDay(),
        ]);

        $this->get(route('articles.show', ['locale' => 'en', 'article' => $article->slug]))
            ->assertNotFound();
    }

    public function test_mentor_can_store_scheduled_article(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->post(route('articles.store', ['locale' => 'en']), [
                'title' => 'Future article',
                'slug' => 'future-article',
                'body' => '<p>content</p>',
                'status' => 'scheduled',
                'publish_at' => now()->addDay()->format('Y-m-d\TH:i'),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('articles', [
            'slug' => 'future-article',
            'status' => 'scheduled',
        ]);
    }

    public function test_store_scheduled_requires_publish_at(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->post(route('articles.store', ['locale' => 'en']), [
                'title' => 'Future article',
                'slug' => 'future-article',
                'body' => '<p>content</p>',
                'status' => 'scheduled',
            ])
            ->assertSessionHasErrors('publish_at');
    }

    // ── Preview ───────────────────────────────────────────────────────────────

    public function test_author_can_preview_draft_article(): void
    {
        $mentor = User::factory()->mentor()->create();
        $article = Article::factory()->draft()->create(['author_id' => $mentor->id]);

        $this->actingAs($mentor)
            ->get(route('articles.preview', ['locale' => 'en', 'article' => $article->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('articles/show')
                ->where('isPreview', true)
            );
    }

    public function test_other_mentor_cannot_preview_article(): void
    {
        $owner = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $article = Article::factory()->draft()->create(['author_id' => $owner->id]);

        $this->actingAs($other)
            ->get(route('articles.preview', ['locale' => 'en', 'article' => $article->slug]))
            ->assertForbidden();
    }

    public function test_guest_cannot_preview_article(): void
    {
        $article = Article::factory()->draft()->create();

        $this->get(route('articles.preview', ['locale' => 'en', 'article' => $article->slug]))
            ->assertRedirect();
    }

    // ── Featured image alt ────────────────────────────────────────────────────

    public function test_featured_image_alt_is_stored_on_create(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->post(route('articles.store', ['locale' => 'en']), [
                'title' => 'Alt text test',
                'slug' => 'alt-text-test',
                'body' => '<p>body</p>',
                'featured_image' => 'https://example.com/img.jpg',
                'featured_image_alt' => 'A descriptive alt text',
                'status' => 'draft',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('articles', [
            'slug' => 'alt-text-test',
            'featured_image_alt' => 'A descriptive alt text',
        ]);
    }
}
