<?php

namespace Tests\Feature\Forum;

use App\Enums\UserRole;
use App\Jobs\AutoFlagWithAi;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumReport;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ForumModerationTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Pin / Lock
    // ──────────────────────────────────────────────

    public function test_admin_can_pin_thread(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $thread = ForumThread::factory()->create(['is_pinned' => false]);

        $this->actingAs($admin)
            ->post(route('forum.moderation.pin', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertOk()
            ->assertJson(['is_pinned' => true]);

        $this->assertDatabaseHas('forum_threads', ['id' => $thread->id, 'is_pinned' => true]);
    }

    public function test_mentor_can_pin_thread(): void
    {
        $mentor = User::factory()->create(['role' => UserRole::Mentor]);
        $thread = ForumThread::factory()->create(['is_pinned' => false]);

        $this->actingAs($mentor)
            ->post(route('forum.moderation.pin', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertOk();
    }

    public function test_learner_cannot_pin_thread(): void
    {
        $learner = User::factory()->create(['role' => UserRole::Learner]);
        $thread = ForumThread::factory()->create();

        $this->actingAs($learner)
            ->post(route('forum.moderation.pin', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertForbidden();
    }

    public function test_pin_toggles_off_when_already_pinned(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $thread = ForumThread::factory()->create(['is_pinned' => true]);

        $this->actingAs($admin)
            ->post(route('forum.moderation.pin', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertJson(['is_pinned' => false]);
    }

    public function test_admin_can_lock_thread(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $thread = ForumThread::factory()->create(['is_locked' => false]);

        $this->actingAs($admin)
            ->post(route('forum.moderation.lock', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]))
            ->assertOk()
            ->assertJson(['is_locked' => true]);
    }

    // ──────────────────────────────────────────────
    // Move thread
    // ──────────────────────────────────────────────

    public function test_admin_can_move_thread_to_different_category(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $thread = ForumThread::factory()->create();
        $originalCategory = $thread->category;
        $newCategory = ForumCategory::factory()->create();

        $this->actingAs($admin)
            ->post(route('forum.moderation.move', [
                'locale' => 'en',
                'forumCategory' => $originalCategory->slug,
                'forumThread' => $thread->slug,
            ]), ['category_id' => $newCategory->id])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_threads', [
            'id' => $thread->id,
            'category_id' => $newCategory->id,
        ]);
    }

    public function test_move_updates_denormalized_thread_counts(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $thread = ForumThread::factory()->create();
        $originalCategory = $thread->category;
        $originalCategory->update(['thread_count' => 1]);

        $newCategory = ForumCategory::factory()->create(['thread_count' => 0]);

        $this->actingAs($admin)->post(route('forum.moderation.move', [
            'locale' => 'en',
            'forumCategory' => $originalCategory->slug,
            'forumThread' => $thread->slug,
        ]), ['category_id' => $newCategory->id]);

        $this->assertDatabaseHas('forum_categories', ['id' => $originalCategory->id, 'thread_count' => 0]);
        $this->assertDatabaseHas('forum_categories', ['id' => $newCategory->id, 'thread_count' => 1]);
    }

    public function test_move_requires_different_category(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $thread = ForumThread::factory()->create();

        $this->actingAs($admin)
            ->post(route('forum.moderation.move', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]), ['category_id' => $thread->category_id])
            ->assertStatus(422);
    }

    // ──────────────────────────────────────────────
    // Admin report queue: resolve + delete content
    // ──────────────────────────────────────────────

    public function test_admin_can_resolve_report(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $reporter = User::factory()->create();
        $thread = ForumThread::factory()->create();
        $report = ForumReport::create([
            'user_id' => $reporter->id,
            'reportable_type' => ForumThread::class,
            'reportable_id' => $thread->id,
            'reason' => 'spam',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.forum.moderation.resolve', ['locale' => 'en', 'forumReport' => $report->id]))
            ->assertOk()
            ->assertJson(['resolved' => true]);

        $this->assertNotNull($report->fresh()->resolved_at);
    }

    public function test_admin_can_delete_reported_thread(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $reporter = User::factory()->create();
        $thread = ForumThread::factory()->create();
        $report = ForumReport::create([
            'user_id' => $reporter->id,
            'reportable_type' => ForumThread::class,
            'reportable_id' => $thread->id,
            'reason' => 'spam',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.forum.moderation.delete-content', ['locale' => 'en', 'forumReport' => $report->id]))
            ->assertOk()
            ->assertJson(['deleted' => true]);

        $this->assertSoftDeleted('forum_threads', ['id' => $thread->id]);
        $this->assertNotNull($report->fresh()->resolved_at);
    }

    public function test_admin_can_delete_reported_reply(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $reporter = User::factory()->create();
        $thread = ForumThread::factory()->create(['replies_count' => 1]);
        $reply = ForumReply::factory()->for($thread, 'thread')->create();
        $report = ForumReport::create([
            'user_id' => $reporter->id,
            'reportable_type' => ForumReply::class,
            'reportable_id' => $reply->id,
            'reason' => 'inappropriate',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.forum.moderation.delete-content', ['locale' => 'en', 'forumReport' => $report->id]))
            ->assertOk();

        $this->assertSoftDeleted('forum_replies', ['id' => $reply->id]);
        $this->assertDatabaseHas('forum_threads', ['id' => $thread->id, 'replies_count' => 0]);
    }

    public function test_non_admin_cannot_access_moderation_queue(): void
    {
        $mentor = User::factory()->create(['role' => UserRole::Mentor]);

        $this->actingAs($mentor)
            ->get(route('admin.forum.moderation.index', ['locale' => 'en']))
            ->assertForbidden();
    }

    // ──────────────────────────────────────────────
    // AutoFlagWithAi job dispatch
    // ──────────────────────────────────────────────

    public function test_creating_thread_dispatches_auto_flag_job(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $category = ForumCategory::factory()->create();

        $this->actingAs($user)
            ->post(route('forum.threads.store', ['locale' => 'en']), [
                'category_id' => $category->id,
                'title' => 'Test moderation dispatch',
                'body' => '<p>Body here</p>',
                'tags' => [],
            ])
            ->assertRedirect();

        Queue::assertPushed(AutoFlagWithAi::class, fn ($job) => $job->contentType === ForumThread::class);
    }

    public function test_posting_reply_dispatches_auto_flag_job(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $thread = ForumThread::factory()->create();

        $this->actingAs($user)
            ->post(route('forum.replies.store', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]), ['body' => '<p>A test reply</p>'])
            ->assertRedirect();

        Queue::assertPushed(AutoFlagWithAi::class, fn ($job) => $job->contentType === ForumReply::class);
    }
}
