<?php

namespace App\Listeners;

use App\Models\ChatSession;
use Illuminate\Auth\Events\Registered;

class MergeGuestChatHistory
{
    /**
     * Merge any guest chat sessions into the newly registered user's account.
     *
     * The guest_user_id is submitted with the registration form. CreateNewUser::create()
     * stores it in the session so it remains accessible here after Fortify clears the input.
     */
    public function handle(Registered $event): void
    {
        $guestUserId = session()->pull('merge_guest_chat_id');

        if (! $guestUserId) {
            return;
        }

        ChatSession::query()
            ->where('guest_user_id', $guestUserId)
            ->whereNull('user_id')
            ->update([
                'user_id' => $event->user->id,
                'guest_user_id' => null,
            ]);

        session()->flash('chat_merged', true);
    }
}
