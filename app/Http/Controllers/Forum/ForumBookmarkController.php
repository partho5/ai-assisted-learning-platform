<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumBookmark;
use App\Models\ForumThread;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumBookmarkController extends Controller
{
    /** Toggle bookmark on a thread. */
    public function toggle(Request $request, ForumThread $forumThread): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $existing = ForumBookmark::where('user_id', $user->id)
            ->where('thread_id', $forumThread->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $bookmarked = false;
        } else {
            ForumBookmark::create([
                'user_id' => $user->id,
                'thread_id' => $forumThread->id,
            ]);
            $bookmarked = true;
        }

        return response()->json(['bookmarked' => $bookmarked]);
    }
}
