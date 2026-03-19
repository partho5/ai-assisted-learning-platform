<?php

namespace App\Jobs;

use App\Contracts\AiProvider;
use App\Models\AiMember;
use App\Models\ForumReply;
use App\Models\ForumThread;
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
    ) {}

    public function handle(AiProvider $ai): void
    {
        $aiMember = AiMember::with('user')->find($this->aiMemberId);
        $thread = ForumThread::with([
            'category:id,name,slug',
            'author:id,name,username',
            'replies' => fn ($q) => $q->latest()->limit(10)->with('author:id,name,username,is_ai'),
        ])->find($this->threadId);

        if (! $aiMember || ! $thread || $thread->is_locked) {
            return;
        }

        // Don't reply if AI member already replied to this thread
        $alreadyReplied = ForumReply::where('thread_id', $thread->id)
            ->where('user_id', $aiMember->user_id)
            ->exists();

        if ($alreadyReplied) {
            return;
        }

        $systemPrompt = $this->buildSystemPrompt($aiMember, $thread);
        $userMessage = $this->buildUserMessage($thread);

        $replyBody = $ai->complete($systemPrompt, $userMessage);

        if (empty(trim($replyBody))) {
            return;
        }

        $reply = ForumReply::create([
            'thread_id' => $thread->id,
            'user_id' => $aiMember->user_id,
            'body' => $replyBody,
        ]);

        $thread->increment('replies_count');
        $thread->update(['last_activity_at' => now(), 'pending_ai_reply' => false]);
        $thread->category()->update(['last_thread_id' => $thread->id]);
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
}
