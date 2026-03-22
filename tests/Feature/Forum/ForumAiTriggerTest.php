<?php

namespace Tests\Feature\Forum;

use App\Contracts\AiProvider;
use App\Jobs\GenerateAiReply;
use App\Models\AiMember;
use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\User;
use App\Services\ForumNotificationService;
use App\Services\TriggerEvaluator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ForumAiTriggerTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // TriggerEvaluator::onNewThread
    // ──────────────────────────────────────────────

    public function test_new_thread_dispatches_job_for_active_ai_member(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->create(); // active, no constraints
        $thread = ForumThread::factory()->create();

        app(TriggerEvaluator::class)->onNewThread($thread);

        Queue::assertPushed(GenerateAiReply::class, function (GenerateAiReply $job) use ($ai, $thread) {
            return $job->aiMemberId === $ai->id
                && $job->threadId === $thread->id
                && $job->trigger === 'new_thread';
        });
    }

    public function test_new_thread_does_not_dispatch_for_inactive_ai_member(): void
    {
        Queue::fake();

        AiMember::factory()->inactive()->create();
        $thread = ForumThread::factory()->create();

        app(TriggerEvaluator::class)->onNewThread($thread);

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_new_thread_respects_trigger_on_constraint(): void
    {
        Queue::fake();

        // Only responds to 'mention', not 'new_thread'
        AiMember::factory()->withTriggers(['mention'])->create();
        $thread = ForumThread::factory()->create();

        app(TriggerEvaluator::class)->onNewThread($thread);

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_new_thread_respects_category_constraint(): void
    {
        Queue::fake();

        $thread = ForumThread::factory()->create();

        // AI restricted to a different category
        AiMember::factory()->inCategories(['some-other-category'])->create();

        app(TriggerEvaluator::class)->onNewThread($thread);

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_new_thread_respects_keyword_constraint(): void
    {
        Queue::fake();

        AiMember::factory()->withKeywords(['urgent', 'help'])->create();

        // Thread title/body does NOT contain keywords
        $thread = ForumThread::factory()->create([
            'title' => 'A random topic',
            'body' => '<p>Nothing special here.</p>',
        ]);

        app(TriggerEvaluator::class)->onNewThread($thread);

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_new_thread_dispatches_when_keyword_matches(): void
    {
        Queue::fake();

        AiMember::factory()->withKeywords(['help', 'stuck'])->create();

        $thread = ForumThread::factory()->create([
            'title' => 'I am stuck on this problem',
            'body' => '<p>Please help me.</p>',
        ]);

        app(TriggerEvaluator::class)->onNewThread($thread);

        Queue::assertPushed(GenerateAiReply::class);
    }

    // ──────────────────────────────────────────────
    // TriggerEvaluator::onMention
    // ──────────────────────────────────────────────

    public function test_mention_dispatches_job_for_mentioned_ai_member(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->create();
        $username = $ai->user->username;
        $thread = ForumThread::factory()->create();

        app(TriggerEvaluator::class)->onMention($thread, "<p>Hey @{$username}, what do you think?</p>");

        Queue::assertPushed(GenerateAiReply::class, function (GenerateAiReply $job) use ($ai, $thread) {
            return $job->aiMemberId === $ai->id
                && $job->threadId === $thread->id
                && $job->trigger === 'mention';
        });
    }

    public function test_mention_does_not_dispatch_when_no_at_mention(): void
    {
        Queue::fake();

        AiMember::factory()->create();
        $thread = ForumThread::factory()->create();

        app(TriggerEvaluator::class)->onMention($thread, '<p>Just a regular reply.</p>');

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_mention_does_not_dispatch_for_non_matching_username(): void
    {
        Queue::fake();

        AiMember::factory()->create(); // has its own username
        $thread = ForumThread::factory()->create();

        app(TriggerEvaluator::class)->onMention($thread, '<p>@someone-else are you there?</p>');

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_mention_respects_trigger_on_constraint(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->withTriggers(['new_thread'])->create(); // only new_thread, not mention
        $username = $ai->user->username;
        $thread = ForumThread::factory()->create();

        app(TriggerEvaluator::class)->onMention($thread, "@{$username} please help");

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    // ──────────────────────────────────────────────
    // TriggerEvaluator::onUnanswered
    // ──────────────────────────────────────────────

    public function test_unanswered_dispatches_for_old_thread_with_no_replies(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->withTriggers(['unanswered_after_hours'])->create();

        $thread = ForumThread::factory()->create([
            'replies_count' => 0,
            'last_activity_at' => now()->subHours(3),
        ]);

        app(TriggerEvaluator::class)->onUnanswered();

        Queue::assertPushed(GenerateAiReply::class, function (GenerateAiReply $job) use ($ai, $thread) {
            return $job->aiMemberId === $ai->id && $job->threadId === $thread->id;
        });
    }

    public function test_unanswered_does_not_dispatch_for_recent_thread(): void
    {
        Queue::fake();

        AiMember::factory()->withTriggers(['unanswered_after_hours'])->create();

        ForumThread::factory()->create([
            'replies_count' => 0,
            'last_activity_at' => now()->subMinutes(10), // too recent (threshold is 30 min)
        ]);

        app(TriggerEvaluator::class)->onUnanswered();

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_unanswered_does_not_dispatch_for_thread_with_replies(): void
    {
        Queue::fake();

        AiMember::factory()->withTriggers(['unanswered_after_hours'])->create();

        ForumThread::factory()->create([
            'replies_count' => 1,
            'last_activity_at' => now()->subHours(5),
        ]);

        app(TriggerEvaluator::class)->onUnanswered();

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    // ──────────────────────────────────────────────
    // Controller integration — new thread triggers AI
    // ──────────────────────────────────────────────

    public function test_creating_thread_dispatches_ai_job_for_active_ai(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->create();
        $user = User::factory()->create();

        $category = $ai->user->load('aiMember'); // ensure category is accessible
        $thread = ForumThread::factory()->create(); // prime the category factory
        $category = $thread->category;

        $this->actingAs($user)
            ->post(route('forum.threads.store', ['locale' => 'en']), [
                'category_id' => $category->id,
                'title' => 'Test thread for AI trigger',
                'body' => '<p>Hello world</p>',
                'tags' => [],
            ])
            ->assertRedirect();

        Queue::assertPushed(GenerateAiReply::class);
    }

    // ──────────────────────────────────────────────
    // TriggerEvaluator::onReplyToAi
    // ──────────────────────────────────────────────

    public function test_reply_to_ai_dispatches_for_correct_ai_member(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->create();
        $thread = ForumThread::factory()->create();

        $aiReply = ForumReply::factory()->for($thread, 'thread')->create([
            'user_id' => $ai->user_id,
        ]);

        $humanReply = ForumReply::factory()->for($thread, 'thread')->create([
            'parent_id' => $aiReply->id,
            'depth' => 1,
        ]);

        app(TriggerEvaluator::class)->onReplyToAi($thread, $humanReply, $aiReply);

        Queue::assertPushed(GenerateAiReply::class, function (GenerateAiReply $job) use ($ai, $thread, $humanReply) {
            return $job->aiMemberId === $ai->id
                && $job->threadId === $thread->id
                && $job->trigger === 'reply_to_ai'
                && $job->triggeringReplyId === $humanReply->id;
        });
    }

    public function test_reply_to_ai_respects_per_thread_limit(): void
    {
        Queue::fake();
        config(['forum.max_ai_replies_per_thread' => 2]);

        $ai = AiMember::factory()->create();
        $thread = ForumThread::factory()->create();

        // AI already at limit
        ForumReply::factory()->count(2)->for($thread, 'thread')->create([
            'user_id' => $ai->user_id,
        ]);

        $aiReply = ForumReply::where('user_id', $ai->user_id)->first();
        $humanReply = ForumReply::factory()->for($thread, 'thread')->create([
            'parent_id' => $aiReply->id,
            'depth' => 1,
        ]);

        app(TriggerEvaluator::class)->onReplyToAi($thread, $humanReply, $aiReply);

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    public function test_reply_to_inactive_ai_does_not_dispatch(): void
    {
        Queue::fake();

        $ai = AiMember::factory()->inactive()->create();
        $thread = ForumThread::factory()->create();

        $aiReply = ForumReply::factory()->for($thread, 'thread')->create([
            'user_id' => $ai->user_id,
        ]);

        $humanReply = ForumReply::factory()->for($thread, 'thread')->create([
            'parent_id' => $aiReply->id,
            'depth' => 1,
        ]);

        app(TriggerEvaluator::class)->onReplyToAi($thread, $humanReply, $aiReply);

        Queue::assertNotPushed(GenerateAiReply::class);
    }

    // ──────────────────────────────────────────────
    // GenerateAiReply job — conversational reply
    // ──────────────────────────────────────────────

    private function bindMockAiProvider(string $response): void
    {
        $this->app->bind(AiProvider::class, function () use ($response) {
            return new class($response) implements AiProvider
            {
                public function __construct(private readonly string $reply) {}

                public function grade(string $questionBody, string $rubric, string $answer, int $maxPoints): array
                {
                    return ['score' => 100, 'explanation' => 'Mock'];
                }

                public function hint(string $questionBody, string $answerDraft): string
                {
                    return 'Mock hint';
                }

                public function streamChat(string $systemPrompt, array $history, callable $onChunk, string $model = 'gpt-4o-mini'): void {}

                public function complete(string $systemPrompt, string $userMessage, string $model = 'gpt-4o-mini'): string
                {
                    return $this->reply;
                }

                public function embed(string $text): array
                {
                    return array_fill(0, 512, 0.0);
                }
            };
        });
    }

    public function test_ai_reply_sets_correct_parent_id_and_depth(): void
    {
        $this->bindMockAiProvider('<p>AI follow-up response</p>');

        $ai = AiMember::factory()->create();
        $thread = ForumThread::factory()->create();

        $humanReply = ForumReply::factory()->for($thread, 'thread')->create([
            'depth' => 1,
        ]);

        $job = new GenerateAiReply($ai->id, $thread->id, 'reply_to_ai', $humanReply->id);
        $job->handle(app(AiProvider::class));

        $aiReply = ForumReply::where('user_id', $ai->user_id)->first();

        $this->assertNotNull($aiReply);
        $this->assertEquals($humanReply->id, $aiReply->parent_id);
        $this->assertEquals(2, $aiReply->depth);
        $this->assertStringContainsString('AI follow-up response', $aiReply->body);
    }

    public function test_ai_job_respects_per_thread_limit(): void
    {
        config(['forum.max_ai_replies_per_thread' => 1]);
        $this->bindMockAiProvider('<p>Should not be created</p>');

        $ai = AiMember::factory()->create();
        $thread = ForumThread::factory()->create();

        // AI already has 1 reply
        ForumReply::factory()->for($thread, 'thread')->create([
            'user_id' => $ai->user_id,
        ]);

        $humanReply = ForumReply::factory()->for($thread, 'thread')->create(['depth' => 1]);

        $job = new GenerateAiReply($ai->id, $thread->id, 'reply_to_ai', $humanReply->id);
        $job->handle(app(AiProvider::class));

        // Should still only have 1 AI reply
        $this->assertEquals(1, ForumReply::where('user_id', $ai->user_id)->count());
    }

    public function test_ai_job_without_triggering_reply_creates_root_reply(): void
    {
        $this->bindMockAiProvider('<p>Root-level AI reply</p>');

        $ai = AiMember::factory()->create();
        $thread = ForumThread::factory()->create();

        $job = new GenerateAiReply($ai->id, $thread->id, 'new_thread');
        $job->handle(app(AiProvider::class));

        $aiReply = ForumReply::where('user_id', $ai->user_id)->first();

        $this->assertNotNull($aiReply);
        $this->assertNull($aiReply->parent_id);
        $this->assertEquals(0, $aiReply->depth);
    }

    public function test_ai_reply_notifies_thread_author(): void
    {
        $this->bindMockAiProvider('<p>AI answer</p>');

        $mockNotifications = $this->mock(ForumNotificationService::class);
        $mockNotifications->shouldReceive('notifyThreadReply')->once();

        $ai = AiMember::factory()->create();
        $threadAuthor = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($threadAuthor, 'author')->create();

        $job = new GenerateAiReply($ai->id, $thread->id, 'new_thread');
        $job->handle(app(AiProvider::class));
    }

    public function test_ai_conversational_reply_notifies_thread_author(): void
    {
        $this->bindMockAiProvider('<p>AI follow-up</p>');

        $mockNotifications = $this->mock(ForumNotificationService::class);
        $mockNotifications->shouldReceive('notifyThreadReply')->once();

        $ai = AiMember::factory()->create();
        $threadAuthor = User::factory()->paid()->create();
        $thread = ForumThread::factory()->for($threadAuthor, 'author')->create();

        $humanReply = ForumReply::factory()->for($thread, 'thread')->create([
            'user_id' => $threadAuthor->id,
            'depth' => 1,
        ]);

        $job = new GenerateAiReply($ai->id, $thread->id, 'reply_to_ai', $humanReply->id);
        $job->handle(app(AiProvider::class));
    }
}
