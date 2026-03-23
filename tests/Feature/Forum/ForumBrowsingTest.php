<?php

namespace Tests\Feature\Forum;

use App\Models\ForumCategory;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForumBrowsingTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Forum home
    // ──────────────────────────────────────────────

    public function test_guest_can_view_forum_home(): void
    {
        ForumCategory::factory()->count(3)->create();

        $this->get(route('forum.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('forum/index')
                ->has('categories', 3)
            );
    }

    public function test_authenticated_user_can_view_forum_home(): void
    {
        $user = User::factory()->paid()->create();
        ForumCategory::factory()->count(2)->create();

        $this->actingAs($user)
            ->get(route('forum.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('forum/index'));
    }

    // ──────────────────────────────────────────────
    // Category page
    // ──────────────────────────────────────────────

    public function test_guest_can_view_category_page(): void
    {
        $category = ForumCategory::factory()->create();
        ForumThread::factory()->for($category)->count(3)->create();

        $this->get(route('forum.category.show', ['locale' => 'en', 'forumCategory' => $category->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('forum/show-category')
                ->has('threads')
                ->where('filter', 'recent')
            );
    }

    public function test_category_filter_recent_is_default(): void
    {
        $category = ForumCategory::factory()->create();

        $this->get(route('forum.category.show', ['locale' => 'en', 'forumCategory' => $category->slug]))
            ->assertInertia(fn ($page) => $page->where('filter', 'recent'));
    }

    public function test_category_filter_unanswered_returns_threads_with_no_replies(): void
    {
        $category = ForumCategory::factory()->create();
        ForumThread::factory()->for($category)->create(['replies_count' => 0]);
        ForumThread::factory()->for($category)->create(['replies_count' => 3]);

        $this->get(route('forum.category.show', ['locale' => 'en', 'forumCategory' => $category->slug, 'filter' => 'unanswered']))
            ->assertInertia(fn ($page) => $page
                ->has('threads.data', 1)
                ->where('filter', 'unanswered')
            );
    }

    public function test_category_page_returns_404_for_unknown_slug(): void
    {
        $this->get(route('forum.category.show', ['locale' => 'en', 'forumCategory' => 'nonexistent-slug']))
            ->assertNotFound();
    }

    // ──────────────────────────────────────────────
    // Thread show
    // ──────────────────────────────────────────────

    public function test_guest_can_view_thread(): void
    {
        $thread = ForumThread::factory()->create();

        $this->get(route('forum.threads.show', [
            'locale' => 'en',
            'forumCategory' => $thread->category->slug,
            'forumThread' => $thread->slug,
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('forum/show-thread')
                ->where('thread.id', $thread->id)
            );
    }

    public function test_thread_show_returns_404_when_category_slug_mismatch(): void
    {
        $categoryA = ForumCategory::factory()->create();
        $categoryB = ForumCategory::factory()->create();
        $thread = ForumThread::factory()->for($categoryA)->create();

        $this->get(route('forum.threads.show', [
            'locale' => 'en',
            'forumCategory' => $categoryB->slug,
            'forumThread' => $thread->slug,
        ]))
            ->assertNotFound();
    }

    // ──────────────────────────────────────────────
    // Search
    // ──────────────────────────────────────────────

    public function test_guest_can_search_forum(): void
    {
        ForumCategory::factory()->count(2)->create();

        $this->get(route('forum.search', ['locale' => 'en', 'q' => 'hello']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('forum/search'));
    }

    public function test_search_returns_matching_threads(): void
    {
        $category = ForumCategory::factory()->create();
        ForumThread::factory()->for($category)->create(['title' => 'How to debug PHP errors']);
        ForumThread::factory()->for($category)->create(['title' => 'Unrelated topic about cooking']);

        $this->get(route('forum.search', ['locale' => 'en', 'q' => 'debug PHP']))
            ->assertInertia(fn ($page) => $page
                ->has('threads.data', 1)
            );
    }

    // ──────────────────────────────────────────────
    // Sitemap
    // ──────────────────────────────────────────────

    public function test_forum_threads_appear_in_sitemap(): void
    {
        $category = ForumCategory::factory()->create(['slug' => 'general']);
        $thread = ForumThread::factory()->for($category, 'category')->create([
            'slug' => 'my-thread',
            'last_activity_at' => now(),
        ]);

        $response = $this->get(route('sitemap'));
        $response->assertOk();
        $response->assertSee('/en/forum');
        $response->assertSee('/en/forum/general');
        $response->assertSee('/en/forum/general/my-thread');
        $response->assertDontSee('/bn/forum');
    }

    public function test_soft_deleted_threads_excluded_from_sitemap(): void
    {
        $category = ForumCategory::factory()->create(['slug' => 'bugs']);
        $thread = ForumThread::factory()->for($category, 'category')->create([
            'slug' => 'deleted-thread',
            'last_activity_at' => now(),
        ]);
        $thread->delete();

        $response = $this->get(route('sitemap'));
        $response->assertOk();
        $response->assertDontSee('/forum/bugs/deleted-thread');
    }
}
