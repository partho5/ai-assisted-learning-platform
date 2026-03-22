<?php

namespace App\Services;

use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ForumNotificationService
{
    private string $appId;

    private string $apiKey;

    private string $endpoint = 'https://onesignal.com/api/v1/notifications';

    public function __construct()
    {
        $this->appId = (string) config('services.onesignal.app_id', '');
        $this->apiKey = (string) config('services.onesignal.rest_api_key', '');
    }

    /** Notify thread author that a new reply was posted. */
    public function notifyThreadReply(ForumThread $thread, ForumReply $reply): void
    {
        $author = $thread->author ?? $thread->load('author')->author;

        if (! $this->shouldNotify($author)) {
            return;
        }

        // Don't notify if the reply is from the thread author themselves
        if ($author->id === $reply->user_id) {
            return;
        }

        $replier = $reply->author ?? $reply->load('author')->author;
        $name = $replier?->name ?? 'Someone';

        $this->send(
            $author,
            "{$name} replied to your thread",
            "\"{$thread->title}\"",
            $this->threadUrl($thread, $reply),
        );
    }

    /** Notify reply author that their reply received a nested reply (quote). */
    public function notifyReplyQuoted(ForumReply $quotedReply, ForumReply $newReply): void
    {
        $quotedAuthor = $quotedReply->author ?? $quotedReply->load('author')->author;

        if (! $this->shouldNotify($quotedAuthor)) {
            return;
        }

        if ($quotedAuthor->id === $newReply->user_id) {
            return;
        }

        $replier = $newReply->author ?? $newReply->load('author')->author;
        $name = $replier?->name ?? 'Someone';

        $thread = $quotedReply->thread ?? $quotedReply->load('thread.category')->thread;

        $this->send(
            $quotedAuthor,
            "{$name} replied to your reply",
            strip_tags((string) $quotedReply->body, limit: 80),
            $thread ? $this->threadUrl($thread, $newReply) : null,
        );
    }

    /** Notify a user that they were @mentioned. */
    public function notifyMention(User $mentionedUser, ForumThread $thread, ForumReply $reply): void
    {
        if (! $this->shouldNotify($mentionedUser)) {
            return;
        }

        if ($mentionedUser->id === $reply->user_id) {
            return;
        }

        $replier = $reply->author ?? $reply->load('author')->author;
        $name = $replier?->name ?? 'Someone';

        $this->send(
            $mentionedUser,
            "{$name} mentioned you in a thread",
            "\"{$thread->title}\"",
            $this->threadUrl($thread, $reply),
        );
    }

    /** Notify parent reply author that someone replied to their reply. */
    public function notifyParentReply(ForumReply $parentReply, ForumReply $childReply, ForumThread $thread): void
    {
        $parentAuthor = $parentReply->author ?? $parentReply->load('author')->author;

        if (! $this->shouldNotify($parentAuthor)) {
            return;
        }

        if ($parentAuthor->id === $childReply->user_id) {
            return;
        }

        $replier = $childReply->author ?? $childReply->load('author')->author;
        $name = $replier?->name ?? 'Someone';

        $this->send(
            $parentAuthor,
            "{$name} replied to your comment",
            "\"{$thread->title}\"",
            $this->threadUrl($thread, $childReply),
        );
    }

    /** Notify reply author that their reply was accepted as the answer. */
    public function notifyAcceptedAnswer(ForumReply $reply, ForumThread $thread): void
    {
        $replyAuthor = $reply->author ?? $reply->load('author')->author;

        if (! $this->shouldNotify($replyAuthor)) {
            return;
        }

        $this->send(
            $replyAuthor,
            'Your reply was accepted as the answer!',
            "\"{$thread->title}\"",
            $this->threadUrl($thread, $reply),
        );
    }

    /** Notify a learner that their test attempt has been graded. */
    public function notifyTestGraded(User $learner, string $testTitle, int $score): void
    {
        if (! $this->shouldNotify($learner)) {
            return;
        }

        $this->send(
            $learner,
            'Your submission has been graded',
            "{$testTitle} — Score: {$score}%",
        );
    }

    /** Notify a learner that their submission was endorsed by a mentor. */
    public function notifyEndorsed(User $learner, string $testTitle): void
    {
        if (! $this->shouldNotify($learner)) {
            return;
        }

        $this->send(
            $learner,
            'Your submission was endorsed!',
            $testTitle,
        );
    }

    /** Notify a mentor that a learner enrolled in their course. */
    public function notifyNewEnrollment(User $mentor, string $courseName, string $learnerName): void
    {
        if (! $this->shouldNotify($mentor)) {
            return;
        }

        $this->send(
            $mentor,
            "{$learnerName} enrolled in your course",
            $courseName,
        );
    }

    /** Notify a mentor that a learner submitted an assignment needing review. */
    public function notifySubmissionPendingReview(User $mentor, string $learnerName, string $testTitle): void
    {
        if (! $this->shouldNotify($mentor)) {
            return;
        }

        $this->send(
            $mentor,
            "{$learnerName} submitted an assignment",
            "{$testTitle} — needs your review",
        );
    }

    /**
     * Register a OneSignal player ID for the given user.
     * Called from the frontend after the push subscription is granted.
     */
    public function registerPlayerId(User $user, string $playerId): void
    {
        $user->update(['onesignal_player_id' => $playerId]);
    }

    /** Whether a user should receive push notifications. */
    private function shouldNotify(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if (empty($this->appId) || empty($this->apiKey)) {
            return false;
        }

        // Refresh from DB so partial selects never hide onesignal_player_id or is_ai
        $fresh = User::query()
            ->where('id', $user->id)
            ->select('id', 'is_ai', 'onesignal_player_id')
            ->first();

        if (! $fresh || $fresh->is_ai || empty($fresh->onesignal_player_id)) {
            return false;
        }

        // Populate the field on the original model so send() can use it
        $user->onesignal_player_id = $fresh->onesignal_player_id;

        return true;
    }

    /** Send a push notification to a single user via OneSignal REST API. */
    private function send(User $user, string $heading, string $content, ?string $url = null): void
    {
        $payload = [
            'app_id' => $this->appId,
            'include_player_ids' => [$user->onesignal_player_id],
            'headings' => ['en' => $heading],
            'contents' => ['en' => $content],
        ];

        if ($url) {
            $payload['url'] = $url;
        }

        try {
            Http::withHeaders(['Authorization' => 'Key '.$this->apiKey])
                ->timeout(10)
                ->post($this->endpoint, $payload);
        } catch (\Throwable $e) {
            Log::warning('OneSignal notification failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /** Build the absolute URL to a forum thread, optionally anchored to a reply. */
    private function threadUrl(ForumThread $thread, ?ForumReply $reply = null): ?string
    {
        try {
            $thread->loadMissing('category');

            if (! $thread->category) {
                return null;
            }

            $url = route('forum.threads.show', [
                'locale' => app()->getLocale() ?: 'en',
                'forumCategory' => $thread->category->slug,
                'forumThread' => $thread->slug,
            ]);

            if ($reply) {
                $url .= "#reply-{$reply->id}";
            }

            return $url;
        } catch (\Throwable) {
            return null;
        }
    }
}
