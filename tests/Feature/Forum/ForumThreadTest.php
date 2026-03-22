<?php

namespace Tests\Feature\Forum;

use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForumThreadTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Create / Store
    // ──────────────────────────────────────────────

    public function test_guest_cannot_create_thread(): void
    {
        $this->get(route('forum.threads.create', ['locale' => 'en']))
            ->assertRedirect();
    }

    public function test_paid_user_can_view_create_thread_form(): void
    {
        $user = User::factory()->paid()->create();
        ForumCategory::factory()->create();

        $this->actingAs($user)
            ->get(route('forum.threads.create', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('forum/create-thread'));
    }

    public function test_paid_user_can_create_thread(): void
    {
        $user = User::factory()->paid()->create();
        $category = ForumCategory::factory()->create();

        $this->actingAs($user)
            ->post(route('forum.threads.store', ['locale' => 'en']), [
                'title' => 'How do I learn PHP?',
                'body' => '<p>I am a beginner, help!</p>',
                'category_id' => $category->id,
                'tags' => ['php', 'beginner'],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_threads', [
            'title' => 'How do I learn PHP?',
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);
    }

    public function test_thread_creation_increments_category_thread_count(): void
    {
        $user = User::factory()->paid()->create();
        $category = ForumCategory::factory()->create(['thread_count' => 0]);

        $this->actingAs($user)
            ->post(route('forum.threads.store', ['locale' => 'en']), [
                'title' => 'Test thread',
                'body' => '<p>body</p>',
                'category_id' => $category->id,
            ]);

        $this->assertEquals(1, $category->fresh()->thread_count);
    }

    public function test_thread_creation_requires_title(): void
    {
        $user = User::factory()->paid()->create();
        $category = ForumCategory::factory()->create();

        $this->actingAs($user)
            ->post(route('forum.threads.store', ['locale' => 'en']), [
                'title' => '',
                'body' => '<p>body</p>',
                'category_id' => $category->id,
            ])
            ->assertSessionHasErrors('title');
    }

    public function test_thread_creation_requires_valid_category(): void
    {
        $user = User::factory()->paid()->create();

        $this->actingAs($user)
            ->post(route('forum.threads.store', ['locale' => 'en']), [
                'title' => 'Test',
                'body' => '<p>body</p>',
                'category_id' => 9999,
            ])
            ->assertSessionHasErrors('category_id');
    }

    // ──────────────────────────────────────────────
    // Update
    // ──────────────────────────────────────────────

    public function test_thread_author_can_edit_their_thread(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($user, 'author')->create();

        $this->actingAs($user)
            ->put(route('forum.threads.update', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]), [
                'title' => 'Updated Title',
                'body' => '<p>Updated body</p>',
                'category_id' => $thread->category_id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_threads', ['title' => 'Updated Title']);
    }

    public function test_other_user_cannot_edit_thread(): void
    {
        $owner = User::factory()->paid()->create();
        $other = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($owner, 'author')->create();

        $this->actingAs($other)
            ->put(route('forum.threads.update', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]), [
                'title' => 'Hacked Title',
                'body' => '<p>body</p>',
                'category_id' => $thread->category_id,
            ])
            ->assertForbidden();
    }

    public function test_admin_can_edit_any_thread(): void
    {
        $admin = User::factory()->admin()->create();
        $thread = ForumThread::factory()->create();

        $this->actingAs($admin)
            ->put(route('forum.threads.update', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]), [
                'title' => 'Admin Edited Title',
                'body' => '<p>body</p>',
                'category_id' => $thread->category_id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_threads', ['title' => 'Admin Edited Title']);
    }

    // ──────────────────────────────────────────────
    // Delete
    // ──────────────────────────────────────────────

    public function test_thread_author_can_delete_their_thread(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($user, 'author')->create();

        $this->actingAs($user)
            ->delete(route('forum.threads.destroy', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertRedirect();

        $this->assertSoftDeleted('forum_threads', ['id' => $thread->id]);
    }

    public function test_other_user_cannot_delete_thread(): void
    {
        $owner = User::factory()->paid()->create();
        $other = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($owner, 'author')->create();

        $this->actingAs($other)
            ->delete(route('forum.threads.destroy', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertForbidden();

        $this->assertDatabaseHas('forum_threads', ['id' => $thread->id, 'deleted_at' => null]);
    }

    // ──────────────────────────────────────────────
    // Show — nested reply props
    // ──────────────────────────────────────────────

    public function test_show_thread_returns_replies_with_nesting_fields(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();

        $root = ForumReply::factory()->for($thread, 'thread')->create(['depth' => 0]);
        $child = ForumReply::factory()->for($thread, 'thread')->childOf($root)->create();

        $this->actingAs($user)
            ->get(route('forum.threads.show', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('forum/show-thread')
                ->has('replies', 2)
                ->has('maxReplyDepth')
                ->where('replies.0.parent_id', null)
                ->where('replies.0.depth', 0)
                ->where('replies.1.parent_id', $root->id)
                ->where('replies.1.depth', 1)
            );
    }
}
