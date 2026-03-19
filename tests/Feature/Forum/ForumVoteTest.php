<?php

namespace Tests\Feature\Forum;

use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForumVoteTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Thread votes
    // ──────────────────────────────────────────────

    public function test_guest_cannot_vote_on_thread(): void
    {
        $thread = ForumThread::factory()->create();

        $this->post(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]))
            ->assertRedirect();

        $this->assertDatabaseEmpty('forum_votes');
    }

    public function test_authenticated_user_can_upvote_thread(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create(['upvotes_count' => 0]);

        $response = $this->actingAs($user)
            ->postJson(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]));

        $response->assertOk()
            ->assertJsonFragment(['voted' => true, 'upvotes_count' => 1]);

        $this->assertEquals(1, $thread->fresh()->upvotes_count);
    }

    public function test_upvoting_twice_removes_the_vote(): void
    {
        $user = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create(['upvotes_count' => 0]);

        $this->actingAs($user)
            ->postJson(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]));

        $response = $this->actingAs($user)
            ->postJson(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]));

        $response->assertOk()
            ->assertJsonFragment(['voted' => false, 'upvotes_count' => 0]);

        $this->assertDatabaseEmpty('forum_votes');
    }

    // ──────────────────────────────────────────────
    // Reply votes
    // ──────────────────────────────────────────────

    public function test_authenticated_user_can_upvote_reply(): void
    {
        $user = User::factory()->paid()->create();
        $reply = ForumReply::factory()->create(['upvotes_count' => 0]);

        $response = $this->actingAs($user)
            ->postJson(route('forum.votes.reply', ['locale' => 'en', 'forumReply' => $reply->id]));

        $response->assertOk()
            ->assertJsonFragment(['voted' => true, 'upvotes_count' => 1]);

        $this->assertEquals(1, $reply->fresh()->upvotes_count);
    }

    public function test_multiple_users_can_vote_independently(): void
    {
        $user1 = User::factory()->paid()->create();
        $user2 = User::factory()->paid()->create();
        $thread = ForumThread::factory()->create(['upvotes_count' => 0]);

        $this->actingAs($user1)
            ->postJson(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]));
        $this->actingAs($user2)
            ->postJson(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]));

        $this->assertEquals(2, $thread->fresh()->upvotes_count);
    }
}
