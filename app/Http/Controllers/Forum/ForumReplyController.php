<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreForumReplyRequest;
use App\Http\Requests\UpdateForumReplyRequest;
use App\Jobs\AutoFlagWithAi;
use App\Jobs\SanitizeContentLinks;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Services\ForumNotificationService;
use App\Services\ReputationService;
use App\Services\TriggerEvaluator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ForumReplyController extends Controller
{
    public function __construct(
        private ReputationService $reputation,
        private TriggerEvaluator $triggerEvaluator,
        private ForumNotificationService $notifications,
    ) {}

    public function store(StoreForumReplyRequest $request, ForumCategory $forumCategory, ForumThread $forumThread): RedirectResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);
        abort_if($forumThread->is_locked, 403, 'This thread is locked.');

        /** @var \App\Models\User $user */
        $user = $request->user();

        // Resolve parent reply for nesting
        $parentReply = null;
        $depth = 0;

        if ($request->input('parent_id')) {
            $parentReply = ForumReply::findOrFail($request->input('parent_id'));
            abort_if($parentReply->thread_id !== $forumThread->id, 422, 'Parent reply does not belong to this thread.');
            abort_if($parentReply->depth >= config('forum.max_reply_depth', 10), 422, 'Maximum reply depth reached.');
            $depth = $parentReply->depth + 1;
        }

        $reply = ForumReply::create([
            'thread_id' => $forumThread->id,
            'user_id' => $user->id,
            'body' => $request->input('body'),
            'quoted_reply_id' => $request->input('quoted_reply_id'),
            'parent_id' => $parentReply?->id,
            'depth' => $depth,
        ]);

        SanitizeContentLinks::dispatch(ForumReply::class, $reply->id);

        $forumThread->increment('replies_count');
        $forumThread->update(['last_activity_at' => now()]);
        $forumThread->category()->update(['last_thread_id' => $forumThread->id]);

        if (! $user->is_ai) {
            // Dispatch AI replies for @mention triggers
            $this->triggerEvaluator->onMention($forumThread, $reply->body);

            // Trigger AI conversational reply when replying to an AI member's reply
            if ($parentReply) {
                $parentReply->loadMissing('author');
                if ($parentReply->author?->is_ai) {
                    $this->triggerEvaluator->onReplyToAi($forumThread, $reply, $parentReply);
                }
            }

            // Dispatch AI moderation check
            AutoFlagWithAi::dispatch(ForumReply::class, $reply->id);
        }

        // Push notifications
        $this->notifications->notifyThreadReply($forumThread, $reply);

        // Notify parent reply author
        if ($parentReply && $parentReply->user_id !== $user->id) {
            $this->notifications->notifyParentReply($parentReply, $reply, $forumThread);
        }

        if ($reply->quoted_reply_id) {
            $quotedReply = ForumReply::withTrashed()->find($reply->quoted_reply_id);
            if ($quotedReply) {
                $this->notifications->notifyReplyQuoted($quotedReply, $reply);
            }
        }

        // @mention notifications (resolve mentioned users)
        if (! $user->is_ai) {
            preg_match_all('/@([\w\-]+)/', $reply->body, $matches);
            foreach ($matches[1] ?? [] as $username) {
                $mentioned = \App\Models\User::where('username', $username)->first();
                if ($mentioned) {
                    $this->notifications->notifyMention($mentioned, $forumThread, $reply);
                }
            }
        }

        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.threads.show', [
            'locale' => $locale,
            'forumCategory' => $forumCategory->slug,
            'forumThread' => $forumThread->slug,
        ])->withFragment("reply-{$reply->id}");
    }

    public function update(UpdateForumReplyRequest $request, ForumCategory $forumCategory, ForumThread $forumThread, ForumReply $forumReply): RedirectResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);
        abort_unless(
            $request->user()?->id === $forumReply->user_id || $request->user()?->isAdmin(),
            403
        );

        $forumReply->update([
            'body' => $request->input('body'),
        ]);

        SanitizeContentLinks::dispatch(ForumReply::class, $forumReply->id);

        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.threads.show', [
            'locale' => $locale,
            'forumCategory' => $forumCategory->slug,
            'forumThread' => $forumThread->slug,
        ])->withFragment("reply-{$forumReply->id}");
    }

    public function destroy(Request $request, ForumCategory $forumCategory, ForumThread $forumThread, ForumReply $forumReply): RedirectResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);
        abort_unless(
            $request->user()?->id === $forumReply->user_id || $request->user()?->isAdmin() || $request->user()?->isMentor(),
            403
        );

        $forumReply->delete();

        // Decrement replies count (don't go below 0)
        $forumThread->decrement('replies_count');

        // If deleted reply was accepted answer, unmark thread as resolved
        if ($forumReply->is_accepted_answer) {
            $forumThread->update(['is_resolved' => false]);
        }

        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.threads.show', [
            'locale' => $locale,
            'forumCategory' => $forumCategory->slug,
            'forumThread' => $forumThread->slug,
        ]);
    }

    /** Mark/unmark a reply as the accepted answer (thread author or moderator). */
    public function accept(Request $request, ForumCategory $forumCategory, ForumThread $forumThread, ForumReply $forumReply): RedirectResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);
        abort_unless(
            $request->user()?->id === $forumThread->user_id || $request->user()?->isAdmin() || $request->user()?->isMentor(),
            403
        );

        $isNowAccepted = ! $forumReply->is_accepted_answer;

        // Revoke prior accepted-answer rep if another reply was accepted
        $previouslyAccepted = ForumReply::where('thread_id', $forumThread->id)
            ->where('is_accepted_answer', true)
            ->first();

        if ($previouslyAccepted && $previouslyAccepted->author) {
            $this->reputation->revoke($previouslyAccepted->author, 'reply_accepted', ForumReply::class, $previouslyAccepted->id);
        }

        // Unmark any existing accepted answers
        ForumReply::where('thread_id', $forumThread->id)
            ->where('is_accepted_answer', true)
            ->update(['is_accepted_answer' => false]);

        if ($isNowAccepted) {
            $forumReply->update(['is_accepted_answer' => true]);
            $forumThread->update(['is_resolved' => true]);

            // Award reply author + push notification
            $forumReply->loadMissing('author');
            if ($forumReply->author) {
                $this->reputation->award($forumReply->author, 'reply_accepted', ForumReply::class, $forumReply->id);
                $this->notifications->notifyAcceptedAnswer($forumReply, $forumThread);
            }
        } else {
            // Toggled off — unresolve thread if no other accepted answers exist
            $forumThread->update(['is_resolved' => false]);
        }

        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.threads.show', [
            'locale' => $locale,
            'forumCategory' => $forumCategory->slug,
            'forumThread' => $forumThread->slug,
        ])->withFragment("reply-{$forumReply->id}");
    }
}
