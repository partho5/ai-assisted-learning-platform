<?php

namespace Tests\Feature\Forum;

use App\Enums\UserRole;
use App\Models\AiMember;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumReport;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForumAdminPanelTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Forum Categories Admin
    // ──────────────────────────────────────────────

    public function test_admin_can_view_forum_categories(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        ForumCategory::factory()->create(['name' => 'General']);

        $this->actingAs($admin)
            ->get(route('admin.forum.categories.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/forum/categories/index')
                ->has('categories', 1)
            );
    }

    public function test_non_admin_cannot_view_forum_categories(): void
    {
        $learner = User::factory()->create(['role' => UserRole::Learner]);

        $this->actingAs($learner)
            ->get(route('admin.forum.categories.index', ['locale' => 'en']))
            ->assertForbidden();
    }

    public function test_admin_can_create_forum_category(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)
            ->post(route('admin.forum.categories.store', ['locale' => 'en']), [
                'name' => 'Course Help',
                'description' => 'Get help with courses',
                'color' => 'indigo',
                'sort_order' => 1,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_categories', ['name' => 'Course Help', 'color' => 'indigo']);
    }

    public function test_admin_can_update_forum_category(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $category = ForumCategory::factory()->create(['name' => 'Old Name']);

        $this->actingAs($admin)
            ->put(route('admin.forum.categories.update', ['locale' => 'en', 'forumCategory' => $category->slug]), [
                'name' => 'New Name',
                'color' => 'emerald',
                'sort_order' => 2,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_categories', ['id' => $category->id, 'name' => 'New Name']);
    }

    public function test_admin_can_delete_forum_category(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $category = ForumCategory::factory()->create();

        $this->actingAs($admin)
            ->delete(route('admin.forum.categories.destroy', ['locale' => 'en', 'forumCategory' => $category->slug]))
            ->assertRedirect();

        $this->assertDatabaseMissing('forum_categories', ['id' => $category->id]);
    }

    // ──────────────────────────────────────────────
    // AI Members Admin
    // ──────────────────────────────────────────────

    public function test_admin_can_view_ai_members(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        AiMember::factory()->create();

        $this->actingAs($admin)
            ->get(route('admin.forum.ai-members.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/forum/ai-members')
                ->has('aiMembers', 1)
            );
    }

    public function test_admin_can_create_ai_member(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)
            ->post(route('admin.forum.ai-members.store', ['locale' => 'en']), [
                'name' => 'Aria',
                'persona_prompt' => 'You are Aria, a helpful learning assistant.',
                'description' => 'AI learning guide',
                'is_active' => true,
                'is_moderator' => false,
                'trigger_constraints' => ['trigger_on' => ['new_thread'], 'categories' => []],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('ai_members', ['persona_prompt' => 'You are Aria, a helpful learning assistant.']);
        $this->assertDatabaseHas('users', ['name' => 'Aria', 'is_ai' => true]);
    }

    public function test_admin_can_update_ai_member(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $aiMember = AiMember::factory()->create();

        $this->actingAs($admin)
            ->put(route('admin.forum.ai-members.update', ['locale' => 'en', 'aiMember' => $aiMember->id]), [
                'name' => 'Updated Aria',
                'persona_prompt' => 'Updated prompt.',
                'is_active' => false,
                'is_moderator' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('ai_members', ['id' => $aiMember->id, 'is_active' => false, 'is_moderator' => true]);
        $this->assertDatabaseHas('users', ['id' => $aiMember->user_id, 'name' => 'Updated Aria']);
    }

    public function test_admin_can_delete_ai_member(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $aiMember = AiMember::factory()->create();
        $userId = $aiMember->user_id;

        $this->actingAs($admin)
            ->delete(route('admin.forum.ai-members.destroy', ['locale' => 'en', 'aiMember' => $aiMember->id]))
            ->assertRedirect();

        $this->assertDatabaseMissing('ai_members', ['id' => $aiMember->id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_non_admin_cannot_manage_ai_members(): void
    {
        $learner = User::factory()->create(['role' => UserRole::Learner]);

        $this->actingAs($learner)
            ->get(route('admin.forum.ai-members.index', ['locale' => 'en']))
            ->assertForbidden();
    }

    // ──────────────────────────────────────────────
    // Moderation Queue Admin
    // ──────────────────────────────────────────────

    public function test_admin_can_view_moderation_queue(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $reporter = User::factory()->create();
        $thread = ForumThread::factory()->create();

        ForumReport::factory()->create([
            'user_id' => $reporter->id,
            'reportable_type' => ForumThread::class,
            'reportable_id' => $thread->id,
            'reason' => 'spam',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.forum.moderation.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/forum/moderation')
                ->has('reports.data', 1)
            );
    }

    public function test_admin_can_dismiss_report(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $reporter = User::factory()->create();
        $thread = ForumThread::factory()->create();

        $report = ForumReport::factory()->create([
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

        $report = ForumReport::factory()->create([
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
        $reply = ForumReply::factory()->create();

        $report = ForumReport::factory()->create([
            'user_id' => $reporter->id,
            'reportable_type' => ForumReply::class,
            'reportable_id' => $reply->id,
            'reason' => 'inappropriate',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.forum.moderation.delete-content', ['locale' => 'en', 'forumReport' => $report->id]))
            ->assertOk()
            ->assertJson(['deleted' => true]);

        $this->assertSoftDeleted('forum_replies', ['id' => $reply->id]);
    }

    public function test_non_admin_cannot_access_moderation_queue(): void
    {
        $learner = User::factory()->create(['role' => UserRole::Learner]);

        $this->actingAs($learner)
            ->get(route('admin.forum.moderation.index', ['locale' => 'en']))
            ->assertForbidden();
    }
}
