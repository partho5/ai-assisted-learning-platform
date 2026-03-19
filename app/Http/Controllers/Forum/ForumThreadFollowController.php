<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumThread;
use App\Models\ForumThreadFollow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumThreadFollowController extends Controller
{
    /** Toggle follow on a thread. */
    public function toggle(Request $request, ForumThread $forumThread): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $existing = ForumThreadFollow::where('user_id', $user->id)
            ->where('thread_id', $forumThread->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $following = false;
        } else {
            ForumThreadFollow::create([
                'user_id' => $user->id,
                'thread_id' => $forumThread->id,
            ]);
            $following = true;
        }

        return response()->json(['following' => $following]);
    }
}
