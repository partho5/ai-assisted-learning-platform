<?php

namespace Tests\Feature\Forum;

use App\Jobs\GenerateAiReply;
use App\Models\AiMember;
use App\Models\ForumThread;
use App\Models\User;
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
}
