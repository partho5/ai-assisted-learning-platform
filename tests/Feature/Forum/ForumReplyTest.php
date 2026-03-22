<?php

namespace Tests\Feature\Forum;

use App\Jobs\GenerateAiReply;
use App\Models\AiMember;
use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ForumReplyTest extends TestCase
{
    use RefreshDatabase;

    private function replyRoute(ForumThread $thread, string $action = 'store', ?ForumReply $reply = null): string
    {
        $params = [
            'locale' => 'en',
            'forumCategory' => $thread->category->slug,
            'forumThread' => $thread->slug,
        ];

        if ($reply) {
            $params['forumReply'] = $reply->id;
        }

        return match ($action) {
            'store' => route('forum.replies.store', $params),
            'update' => route('forum.replies.update', $params),
            'destroy' => route('forum.replies.destroy', $params),
            'accept' => route('forum.replies.accept', $params),
        };
    }

    // ──────────────────────────────────────────────
    // Store
    // ──────────────────────────────────────────────

    public function test_guest_cannot_post_reply(): void
    {
        $thread = ForumThread::factory()->create();

        $this->post($this->replyRoute($thread), ['body' => '<p>Reply</p>'])
            ->assertRedirect();

        $this->assertDatabaseEmpty('forum_replies');
    }

    public function test_paid_user_can_post_reply(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), ['body' => '<p>My reply</p>'])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_replies', [
            'thread_id' => $thread->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_reply_increments_thread_replies_count(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create(['replies_count' => 0]);

        $this->actingAs($user)
            ->post($this->replyRoute($thread), ['body' => '<p>reply</p>']);

        $this->assertEquals(1, $thread->fresh()->replies_count);
    }

    public function test_cannot_reply_to_locked_thread(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->locked()->create();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), ['body' => '<p>reply</p>'])
            ->assertForbidden();
    }

    public function test_reply_body_is_required(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), ['body' => ''])
            ->assertSessionHasErrors('body');
    }

    // ──────────────────────────────────────────────
    // Update
    // ──────────────────────────────────────────────

    public function test_reply_author_can_edit_reply(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $reply = ForumReply::factory()->for($thread, 'thread')->for($user, 'author')->create();

        $this->actingAs($user)
            ->put($this->replyRoute($thread, 'update', $reply), ['body' => '<p>Edited</p>'])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_replies', ['id' => $reply->id, 'body' => '<p>Edited</p>']);
    }

    public function test_other_user_cannot_edit_reply(): void
    {
        $owner = User::factory()->paid()->create();
        $other = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $reply = ForumReply::factory()->for($thread, 'thread')->for($owner, 'author')->create();

        $this->actingAs($other)
            ->put($this->replyRoute($thread, 'update', $reply), ['body' => '<p>Hacked</p>'])
            ->assertForbidden();
    }

    // ──────────────────────────────────────────────
    // Delete
    // ──────────────────────────────────────────────

    public function test_reply_author_can_delete_reply(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create(['replies_count' => 1]);
        $reply = ForumReply::factory()->for($thread, 'thread')->for($user, 'author')->create();

        $this->actingAs($user)
            ->delete($this->replyRoute($thread, 'destroy', $reply))
            ->assertRedirect();

        $this->assertSoftDeleted('forum_replies', ['id' => $reply->id]);
        $this->assertEquals(0, $thread->fresh()->replies_count);
    }

    // ──────────────────────────────────────────────
    // Accept
    // ──────────────────────────────────────────────

    public function test_thread_author_can_mark_accepted_answer(): void
    {
        $threadAuthor = User::factory()->paid()->create();
        $replyAuthor = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($threadAuthor, 'author')->create(['is_resolved' => false]);
        $reply = ForumReply::factory()->for($thread, 'thread')->for($replyAuthor, 'author')->create(['is_accepted_answer' => false]);

        $this->actingAs($threadAuthor)
            ->post($this->replyRoute($thread, 'accept', $reply))
            ->assertRedirect();

        $this->assertTrue($reply->fresh()->is_accepted_answer);
        $this->assertTrue($thread->fresh()->is_resolved);
    }

    public function test_accepting_answer_removes_previous_accepted_answer(): void
    {
        $threadAuthor = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($threadAuthor, 'author')->create(['is_resolved' => true]);
        $oldAccepted = ForumReply::factory()->for($thread, 'thread')->accepted()->create();
        $newReply = ForumReply::factory()->for($thread, 'thread')->create(['is_accepted_answer' => false]);

        $this->actingAs($threadAuthor)
            ->post($this->replyRoute($thread, 'accept', $newReply));

        $this->assertFalse($oldAccepted->fresh()->is_accepted_answer);
        $this->assertTrue($newReply->fresh()->is_accepted_answer);
    }

    public function test_other_user_cannot_mark_accepted_answer(): void
    {
        $threadAuthor = User::factory()->paid()->create();
        $other = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($threadAuthor, 'author')->create();
        $reply = ForumReply::factory()->for($thread, 'thread')->create();

        $this->actingAs($other)
            ->post($this->replyRoute($thread, 'accept', $reply))
            ->assertForbidden();
    }

    // ──────────────────────────────────────────────
    // Nested Replies
    // ──────────────────────────────────────────────

    public function test_user_can_post_nested_reply_with_parent_id(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $parent = ForumReply::factory()->for($thread, 'thread')->create();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>Nested reply</p>',
                'parent_id' => $parent->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('forum_replies', [
            'thread_id' => $thread->id,
            'user_id' => $user->id,
            'parent_id' => $parent->id,
            'depth' => 1,
        ]);
    }

    public function test_root_reply_has_depth_zero(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), ['body' => '<p>Root reply</p>']);

        $reply = ForumReply::where('user_id', $user->id)->first();
        $this->assertEquals(0, $reply->depth);
        $this->assertNull($reply->parent_id);
    }

    public function test_nested_reply_computes_depth_from_parent(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $depth2 = ForumReply::factory()->for($thread, 'thread')->create(['depth' => 2, 'parent_id' => null]);

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>Deep reply</p>',
                'parent_id' => $depth2->id,
            ]);

        $child = ForumReply::where('user_id', $user->id)->first();
        $this->assertEquals(3, $child->depth);
        $this->assertEquals($depth2->id, $child->parent_id);
    }

    public function test_nested_reply_rejects_when_max_depth_reached(): void
    {
        config(['forum.max_reply_depth' => 3]);

        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $atMaxDepth = ForumReply::factory()->for($thread, 'thread')->create(['depth' => 3]);

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>Too deep</p>',
                'parent_id' => $atMaxDepth->id,
            ])
            ->assertStatus(422);
    }

    public function test_nested_reply_rejects_parent_from_different_thread(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $otherThread = ForumThread::factory()->create();
        $parentInOtherThread = ForumReply::factory()->for($otherThread, 'thread')->create();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>Cross-thread reply</p>',
                'parent_id' => $parentInOtherThread->id,
            ])
            ->assertStatus(422);
    }

    public function test_nested_reply_preserves_thread_counter_updates(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create(['replies_count' => 1]);
        $parent = ForumReply::factory()->for($thread, 'thread')->create();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>Nested</p>',
                'parent_id' => $parent->id,
            ]);

        $this->assertEquals(2, $thread->fresh()->replies_count);
    }

    // ──────────────────────────────────────────────
    // Reply-to-AI Trigger
    // ──────────────────────────────────────────────

    public function test_reply_to_ai_dispatches_ai_job(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->create();
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $aiReply = ForumReply::factory()->for($thread, 'thread')->create([
            'user_id' => $ai->user_id,
        ]);

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>Follow-up question</p>',
                'parent_id' => $aiReply->id,
            ]);

        Queue::assertPushed(GenerateAiReply::class, function (GenerateAiReply $job) use ($ai, $thread) {
            return $job->aiMemberId === $ai->id
                && $job->threadId === $thread->id
                && $job->trigger === 'reply_to_ai';
        });
    }

    public function test_reply_to_human_does_not_trigger_ai(): void
    {
        Queue::fake();

        AiMember::factory()->create();
        $user = User::factory()->paid()->create();
        $other = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();
        $humanReply = ForumReply::factory()->for($thread, 'thread')->create([
            'user_id' => $other->id,
        ]);

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>Replying to human</p>',
                'parent_id' => $humanReply->id,
            ]);

        Queue::assertNotPushed(GenerateAiReply::class, function (GenerateAiReply $job) {
            return $job->trigger === 'reply_to_ai';
        });
    }

    public function test_reply_to_ai_respects_max_ai_replies_per_thread(): void
    {
        Queue::fake();
        config(['forum.max_ai_replies_per_thread' => 2]);

        $ai = AiMember::factory()->create();
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create();

        // AI already has 2 replies in this thread
        ForumReply::factory()->count(2)->for($thread, 'thread')->create([
            'user_id' => $ai->user_id,
        ]);

        $aiReply = ForumReply::where('user_id', $ai->user_id)->first();

        $this->actingAs($user)
            ->post($this->replyRoute($thread), [
                'body' => '<p>One more question</p>',
                'parent_id' => $aiReply->id,
            ]);

        Queue::assertNotPushed(GenerateAiReply::class, function (GenerateAiReply $job) {
            return $job->trigger === 'reply_to_ai';
        });
    }
}
