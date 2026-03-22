<?php

namespace App\Jobs;

use App\Contracts\AiProvider;
use App\Models\AiMember;
use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Services\ForumNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class GenerateAiReply implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        public readonly int $aiMemberId,
        public readonly int $threadId,
        public readonly string $trigger,
        public readonly ?int $triggeringReplyId = null,
    ) {}

    public function handle(AiProvider $ai): void
    {
        $aiMember = AiMember::with('user')->find($this->aiMemberId);
        $thread = ForumThread::with([
            'category:id,name,slug',
            'author:id,name,username,onesignal_player_id',
            'replies' => fn ($q) => $q->latest()->limit(10)->with('author:id,name,username,is_ai'),
        ])->find($this->threadId);

        if (! $aiMember || ! $thread || $thread->is_locked) {
            return;
        }

        // Enforce per-thread reply limit (replaces the old one-shot guard)
        $aiReplyCount = ForumReply::where('thread_id', $thread->id)
            ->where('user_id', $aiMember->user_id)
            ->count();

        if ($aiReplyCount >= config('forum.max_ai_replies_per_thread', 5)) {
            $thread->update(['pending_ai_reply' => false]);

            return;
        }

        $systemPrompt = $this->buildSystemPrompt($aiMember, $thread);

        // Build context-aware message based on trigger type
        $userMessage = $this->buildUserMessage($thread);
        $triggeringReply = null;

        if ($this->trigger === 'reply_to_ai' && $this->triggeringReplyId) {
            $triggeringReply = ForumReply::with('author:id,name,username,is_ai')->find($this->triggeringReplyId);
            if ($triggeringReply) {
                $userMessage = $this->buildConversationMessage($thread, $triggeringReply);
            }
        }

        $replyBody = $ai->complete($systemPrompt, $userMessage);

        if (empty(trim($replyBody))) {
            return;
        }

        // Determine nesting (parent_id + depth) for the AI reply
        $parentId = null;
        $depth = 0;

        if ($triggeringReply && $triggeringReply->depth < config('forum.max_reply_depth', 10)) {
            $parentId = $triggeringReply->id;
            $depth = $triggeringReply->depth + 1;
        }

        $reply = ForumReply::create([
            'thread_id' => $thread->id,
            'user_id' => $aiMember->user_id,
            'body' => $replyBody,
            'parent_id' => $parentId,
            'depth' => $depth,
        ]);

        $thread->increment('replies_count');
        $thread->update(['last_activity_at' => now(), 'pending_ai_reply' => false]);
        $thread->category()->update(['last_thread_id' => $thread->id]);

        // Notify the thread author (OP) about the AI reply
        $notifications = app(ForumNotificationService::class);
        $notifications->notifyThreadReply($thread, $reply);

        // Notify the user whose reply triggered this AI response
        if ($triggeringReply && $triggeringReply->user_id !== $thread->user_id) {
            $notifications->notifyParentReply($triggeringReply, $reply, $thread);
        }
    }

    public function failed(Throwable $exception): void
    {
        ForumThread::where('id', $this->threadId)->update(['pending_ai_reply' => false]);
    }

    private function buildSystemPrompt(AiMember $aiMember, ForumThread $thread): string
    {
        $categoryName = $thread->category?->name ?? 'General';
        $persona = $aiMember->persona_prompt ?? 'You are a helpful forum member.';

        return <<<PROMPT
{$persona}

You are participating in the "{$categoryName}" category of a learning forum.
Your goal is to write a helpful, concise forum reply in plain HTML (use <p>, <strong>, <ul>, <li>, <code> etc. where appropriate).
Do not introduce yourself or mention that you are an AI.
Keep your reply focused, practical, and appropriately short for a forum post.
Do not repeat the question back to the user.
PROMPT;
    }

    private function buildUserMessage(ForumThread $thread): string
    {
        $recentReplies = $thread->replies
            ->sortByDesc('created_at')
            ->take(5)
            ->reverse()
            ->values();

        $context = '';
        if ($recentReplies->isNotEmpty()) {
            $context = "\n\nRecent replies in this thread:\n";
            foreach ($recentReplies as $reply) {
                $name = $reply->author?->name ?? 'Unknown';
                $body = strip_tags($reply->body ?? '');
                $context .= "- {$name}: {$body}\n";
            }
        }

        $threadBody = strip_tags($thread->body ?? '');

        return <<<MSG
Thread title: {$thread->title}

Original post:
{$threadBody}{$context}

Please write a helpful reply to this thread.
MSG;
    }

    /**
     * Build a context-aware message using the full conversation chain
     * when the AI is responding to a specific reply directed at them.
     */
    private function buildConversationMessage(ForumThread $thread, ForumReply $triggeringReply): string
    {
        // Walk up the parent chain to get the full conversation path
        $chain = $triggeringReply->ancestorChain();
        $chain->push($triggeringReply);

        $conversation = '';
        foreach ($chain as $reply) {
            $name = $reply->author?->name ?? 'Unknown';
            $role = $reply->author?->is_ai ? '(AI Mentor)' : '(Student)';
            $body = strip_tags($reply->body ?? '');
            $conversation .= "{$name} {$role}: {$body}\n\n";
        }

        $threadBody = strip_tags($thread->body ?? '');

        return <<<MSG
Thread title: {$thread->title}

Original post:
{$threadBody}

Conversation chain (chronological):
{$conversation}
The student has replied to your previous message. Please continue the conversation helpfully.
Focus on their specific question or follow-up. Be concise and practical.
MSG;
    }
}
