<?php

namespace Tests\Feature\Forum;

use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
