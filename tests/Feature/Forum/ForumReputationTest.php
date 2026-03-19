<?php

namespace Tests\Feature\Forum;

use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\User;
use App\Models\UserReputation;
use App\Services\ReputationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ForumReputationTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // ReputationService unit-style tests
    // ──────────────────────────────────────────────

    public function test_award_creates_reputation_record_and_event(): void
    {
        $user = User::factory()->create();
        $service = app(ReputationService::class);

        $service->award($user, 'thread_created', ForumThread::class, 1);

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $user->id,
            'points' => config('forum.reputation.points.thread_created'),
        ]);

        $this->assertDatabaseHas('forum_reputation_events', [
            'user_id' => $user->id,
            'reason' => 'thread_created',
            'points_delta' => config('forum.reputation.points.thread_created'),
        ]);
    }

    public function test_award_accumulates_points_on_subsequent_calls(): void
    {
        $user = User::factory()->create();
        $service = app(ReputationService::class);

        $service->award($user, 'reply_upvoted');
        $service->award($user, 'reply_upvoted');

        $expected = config('forum.reputation.points.reply_upvoted') * 2;

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $user->id,
            'points' => $expected,
        ]);
    }

    public function test_revoke_reduces_points(): void
    {
        $user = User::factory()->create();
        $service = app(ReputationService::class);

        $service->award($user, 'reply_upvoted');
        $service->revoke($user, 'reply_upvoted');

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $user->id,
            'points' => 0,
        ]);
    }

    public function test_revoke_never_goes_below_zero(): void
    {
        $user = User::factory()->create();
        $service = app(ReputationService::class);

        // Revoke without any prior points
        $service->revoke($user, 'thread_upvoted');

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $user->id,
            'points' => 0,
        ]);
    }

    public function test_revoke_logs_negative_event(): void
    {
        $user = User::factory()->create();
        $service = app(ReputationService::class);

        $service->award($user, 'thread_upvoted');
        $service->revoke($user, 'thread_upvoted');

        $this->assertDatabaseHas('forum_reputation_events', [
            'user_id' => $user->id,
            'reason' => 'thread_upvoted_revoked',
            'points_delta' => -config('forum.reputation.points.thread_upvoted'),
        ]);
    }

    public function test_award_does_nothing_for_ai_users(): void
    {
        $aiUser = User::factory()->create(['is_ai' => true]);
        $service = app(ReputationService::class);

        $service->award($aiUser, 'thread_upvoted');

        $this->assertDatabaseEmpty('user_reputations');
        $this->assertDatabaseEmpty('forum_reputation_events');
    }

    public function test_award_first_upvote_bonus_is_idempotent(): void
    {
        $author = User::factory()->create();
        $thread = ForumThread::factory()->for($author, 'author')->create();
        $service = app(ReputationService::class);

        $service->awardFirstUpvoteBonus($thread);
        $service->awardFirstUpvoteBonus($thread);

        $expectedPoints = config('forum.reputation.points.thread_created');

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $author->id,
            'points' => $expectedPoints,
        ]);

        $count = DB::table('forum_reputation_events')
            ->where('user_id', $author->id)
            ->where('reason', 'thread_created')
            ->count();

        $this->assertSame(1, $count);
    }

    // ──────────────────────────────────────────────
    // Level lookup
    // ──────────────────────────────────────────────

    public function test_level_for_zero_points_returns_newcomer(): void
    {
        $service = app(ReputationService::class);
        $level = $service->levelFor(0);

        $this->assertSame('Newcomer', $level['label']);
    }

    public function test_level_for_points_on_boundary(): void
    {
        $service = app(ReputationService::class);

        $this->assertSame('Contributor', $service->levelFor(50)['label']);
        $this->assertSame('Regular', $service->levelFor(200)['label']);
        $this->assertSame('Respected', $service->levelFor(500)['label']);
        $this->assertSame('Expert', $service->levelFor(1500)['label']);
        $this->assertSame('Legend', $service->levelFor(4000)['label']);
    }

    // ──────────────────────────────────────────────
    // Vote controller integration
    // ──────────────────────────────────────────────

    public function test_upvoting_thread_awards_points_to_author(): void
    {
        $author = User::factory()->create();
        $voter = User::factory()->create();
        $thread = ForumThread::factory()->for($author, 'author')->create();

        $this->actingAs($voter)
            ->post(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]))
            ->assertOk();

        $expectedPoints = config('forum.reputation.points.thread_upvoted')
            + config('forum.reputation.points.thread_created');

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $author->id,
            'points' => $expectedPoints,
        ]);
    }

    public function test_removing_thread_upvote_revokes_points(): void
    {
        $author = User::factory()->create();
        $voter = User::factory()->create();
        $thread = ForumThread::factory()->for($author, 'author')->create();

        // Vote then un-vote
        $this->actingAs($voter)
            ->post(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]));

        $this->actingAs($voter)
            ->post(route('forum.votes.thread', ['locale' => 'en', 'forumThread' => $thread->id]));

        // thread_created bonus is NOT revoked when upvote removed
        $expectedPoints = config('forum.reputation.points.thread_created');

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $author->id,
            'points' => $expectedPoints,
        ]);
    }

    public function test_upvoting_reply_awards_points_to_reply_author(): void
    {
        $author = User::factory()->create();
        $voter = User::factory()->create();
        $thread = ForumThread::factory()->create();
        $reply = ForumReply::factory()->for($thread, 'thread')->for($author, 'author')->create();

        $this->actingAs($voter)
            ->post(route('forum.votes.reply', ['locale' => 'en', 'forumReply' => $reply->id]))
            ->assertOk();

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $author->id,
            'points' => config('forum.reputation.points.reply_upvoted'),
        ]);
    }

    // ──────────────────────────────────────────────
    // Accept reply integration
    // ──────────────────────────────────────────────

    public function test_accepting_reply_awards_reply_accepted_points(): void
    {
        $threadAuthor = User::factory()->create();
        $replyAuthor = User::factory()->create();
        $thread = ForumThread::factory()->for($threadAuthor, 'author')->create();
        $reply = ForumReply::factory()->for($thread, 'thread')->for($replyAuthor, 'author')->create();

        $this->actingAs($threadAuthor)
            ->post(route('forum.replies.accept', [
                'locale' => 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
                'forumReply' => $reply->id,
            ]))
            ->assertRedirect();

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $replyAuthor->id,
            'points' => config('forum.reputation.points.reply_accepted'),
        ]);
    }

    public function test_toggling_off_accepted_reply_revokes_points(): void
    {
        $threadAuthor = User::factory()->create();
        $replyAuthor = User::factory()->create();
        $thread = ForumThread::factory()->for($threadAuthor, 'author')->create();
        $reply = ForumReply::factory()->for($thread, 'thread')->for($replyAuthor, 'author')->create();

        $routeParams = [
            'locale' => 'en',
            'forumCategory' => $thread->category->slug,
            'forumThread' => $thread->slug,
            'forumReply' => $reply->id,
        ];

        // Accept then un-accept
        $this->actingAs($threadAuthor)->post(route('forum.replies.accept', $routeParams));
        $this->actingAs($threadAuthor)->post(route('forum.replies.accept', $routeParams));

        $this->assertDatabaseHas('user_reputations', [
            'user_id' => $replyAuthor->id,
            'points' => 0,
        ]);
    }

    // ──────────────────────────────────────────────
    // User model accessors
    // ──────────────────────────────────────────────

    public function test_user_reputation_points_accessor_returns_zero_with_no_record(): void
    {
        $user = User::factory()->create();

        $this->assertSame(0, $user->reputation_points);
    }

    public function test_user_reputation_level_accessor_returns_newcomer_by_default(): void
    {
        $user = User::factory()->create();

        $this->assertSame('Newcomer', $user->reputation_level['label']);
    }

    public function test_user_reputation_level_updates_with_points(): void
    {
        $user = User::factory()->create();
        UserReputation::create(['user_id' => $user->id, 'points' => 200]);

        $user->load('reputation');

        $this->assertSame('Regular', $user->reputation_level['label']);
    }
}
