<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumReply;
use App\Models\ForumThread;
use App\Models\ForumVote;
use App\Services\ReputationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumVoteController extends Controller
{
    public function __construct(private ReputationService $reputation) {}

    /** Toggle upvote on a thread. */
    public function thread(Request $request, ForumThread $forumThread): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $existing = ForumVote::where('user_id', $user->id)
            ->where('votable_type', ForumThread::class)
            ->where('votable_id', $forumThread->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $forumThread->decrement('upvotes_count');
            $voted = false;

            // Revoke points from thread author
            if ($forumThread->author) {
                $this->reputation->revoke($forumThread->author, 'thread_upvoted', ForumThread::class, $forumThread->id);
            }
        } else {
            ForumVote::create([
                'user_id' => $user->id,
                'votable_type' => ForumThread::class,
                'votable_id' => $forumThread->id,
            ]);
            $forumThread->increment('upvotes_count');
            $voted = true;

            // Award points to thread author; also one-time thread_created bonus on first upvote
            if ($forumThread->author) {
                $this->reputation->award($forumThread->author, 'thread_upvoted', ForumThread::class, $forumThread->id);
                $forumThread->loadMissing('author');
                $this->reputation->awardFirstUpvoteBonus($forumThread);
            }
        }

        $forumThread->refresh();

        return response()->json([
            'voted' => $voted,
            'upvotes_count' => $forumThread->upvotes_count,
        ]);
    }

    /** Toggle upvote on a reply. */
    public function reply(Request $request, ForumReply $forumReply): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $existing = ForumVote::where('user_id', $user->id)
            ->where('votable_type', ForumReply::class)
            ->where('votable_id', $forumReply->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $forumReply->decrement('upvotes_count');
            $voted = false;

            if ($forumReply->author) {
                $this->reputation->revoke($forumReply->author, 'reply_upvoted', ForumReply::class, $forumReply->id);
            }
        } else {
            ForumVote::create([
                'user_id' => $user->id,
                'votable_type' => ForumReply::class,
                'votable_id' => $forumReply->id,
            ]);
            $forumReply->increment('upvotes_count');
            $voted = true;

            if ($forumReply->author) {
                $this->reputation->award($forumReply->author, 'reply_upvoted', ForumReply::class, $forumReply->id);
            }
        }

        $forumReply->refresh();

        return response()->json([
            'voted' => $voted,
            'upvotes_count' => $forumReply->upvotes_count,
        ]);
    }
}
