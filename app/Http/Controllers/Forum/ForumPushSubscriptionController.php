<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Services\ForumNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumPushSubscriptionController extends Controller
{
    /** Store the OneSignal player ID for the authenticated user. */
    public function store(Request $request, ForumNotificationService $notifications): JsonResponse
    {
        $request->validate([
            'player_id' => ['required', 'string', 'max:255'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $notifications->registerPlayerId($user, $request->input('player_id'));

        return response()->json(['registered' => true]);
    }
}
