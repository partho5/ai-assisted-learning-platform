<?php

namespace App\Services;

use App\Jobs\GenerateAiReply;
use App\Models\AiMember;
use App\Models\ForumThread;

class TriggerEvaluator
{
    /**
     * Evaluate and dispatch AI replies for a new thread (trigger: new_thread).
     */
    public function onNewThread(ForumThread $thread): void
    {
        $this->dispatchForTrigger($thread, 'new_thread');
    }

    /**
     * Evaluate and dispatch AI replies triggered by a new human reply (trigger: mention).
     * Parses @mentions in the reply body and dispatches for each matched active AI member.
     */
    public function onMention(ForumThread $thread, string $replyBody): void
    {
        preg_match_all('/@([\w\-]+)/', $replyBody, $matches);
        $mentionedUsernames = $matches[1] ?? [];

        if (empty($mentionedUsernames)) {
            return;
        }

        $aiMembers = AiMember::query()
            ->where('is_active', true)
            ->with('user:id,username,is_ai')
            ->get()
            ->filter(fn (AiMember $ai) => in_array($ai->user?->username, $mentionedUsernames, true))
            ->filter(fn (AiMember $ai) => $this->categoryAllowed($ai, $thread))
            ->filter(fn (AiMember $ai) => $this->triggerAllowed($ai, 'mention'));

        $thread->update(['pending_ai_reply' => true]);

        foreach ($aiMembers as $aiMember) {
            GenerateAiReply::dispatch($aiMember->id, $thread->id, 'mention')->delay(now()->addSeconds(5));
        }
    }

    /**
     * Evaluate all active AI members against threads with no human reply after N hours.
     * Called from the scheduled Artisan command.
     */
    public function onUnanswered(): void
    {
        $aiMembers = AiMember::query()
            ->where('is_active', true)
            ->with('user:id,username,is_ai')
            ->get()
            ->filter(fn (AiMember $ai) => $this->triggerAllowed($ai, 'unanswered_after_hours'));

        foreach ($aiMembers as $aiMember) {
            $minutes = $this->unansweredMinutes($aiMember);

            $threads = ForumThread::query()
                ->where('replies_count', 0)
                ->where('is_locked', false)
                ->where('last_activity_at', '<=', now()->subMinutes($minutes))
                ->get();

            foreach ($threads as $thread) {
                if (! $this->categoryAllowed($aiMember, $thread)) {
                    continue;
                }

                if (! $this->keywordsMatch($aiMember, $thread)) {
                    continue;
                }

                $thread->update(['pending_ai_reply' => true]);
                $randomAi = $aiMembers->random();
                GenerateAiReply::dispatch($randomAi->id, $thread->id, 'unanswered_after_hours');
            }
        }
    }

    /**
     * Dispatch AI replies for all active AI members matching the given trigger on a thread.
     */
    private function dispatchForTrigger(ForumThread $thread, string $trigger): void
    {
        $aiMembers = AiMember::query()
            ->where('is_active', true)
            ->with('user:id,username,is_ai')
            ->get()
            ->filter(fn (AiMember $ai) => $this->triggerAllowed($ai, $trigger))
            ->filter(fn (AiMember $ai) => $this->categoryAllowed($ai, $thread))
            ->filter(fn (AiMember $ai) => $this->keywordsMatch($ai, $thread));

        if ($aiMembers->isEmpty()) {
            return;
        }

        $thread->update(['pending_ai_reply' => true]);

        $aiMember = $aiMembers->random();
        GenerateAiReply::dispatch($aiMember->id, $thread->id, $trigger)->delay(now()->addSeconds(10));
    }

    /**
     * Check whether the AI member's trigger_constraints allow this trigger type.
     * Default (no config) = all triggers allowed.
     */
    private function triggerAllowed(AiMember $aiMember, string $trigger): bool
    {
        $constraints = $aiMember->trigger_constraints ?? [];
        $allowed = $constraints['trigger_on'] ?? null;

        if ($allowed === null) {
            return true;
        }

        return in_array($trigger, (array) $allowed, true);
    }

    /**
     * Check whether the AI member is configured for the thread's category.
     */
    private function categoryAllowed(AiMember $aiMember, ForumThread $thread): bool
    {
        $thread->loadMissing('category:id,slug');

        return $aiMember->isActiveInCategory($thread->category?->slug ?? '');
    }

    /**
     * Check keyword constraints — null = no filter (all threads match).
     */
    private function keywordsMatch(AiMember $aiMember, ForumThread $thread): bool
    {
        $constraints = $aiMember->trigger_constraints ?? [];
        $keywords = $constraints['keywords'] ?? null;

        if ($keywords === null) {
            return true;
        }

        $haystack = strtolower($thread->title.' '.$thread->body);

        foreach ((array) $keywords as $keyword) {
            if (str_contains($haystack, strtolower((string) $keyword))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the unanswered minutes threshold for an AI member.
     * Falls back to the global config value.
     */
    private function unansweredMinutes(AiMember $aiMember): int
    {
        $constraints = $aiMember->trigger_constraints ?? [];
        // Support both the new 'unanswered_after_minutes' key and legacy 'unanswered_after_hours' key
        $minutes = $constraints['unanswered_after_minutes']
            ?? (isset($constraints['unanswered_after_hours']) ? $constraints['unanswered_after_hours'] * 60 : null);

        return (int) ($minutes ?? config('forum.unanswered_ai_trigger_minutes', 30));
    }
}
