<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use Inertia\Inertia;
use Inertia\Response;

class ChatSessionController extends Controller
{
    public function show(ChatSession $chatSession): Response
    {
        $chatSession->load([
            'user:id,name,username,avatar',
            'messages' => fn ($q) => $q->oldest(),
        ]);

        return Inertia::render('admin/chats/show', [
            'session' => [
                'id' => $chatSession->id,
                'identity' => $chatSession->user
                    ? [
                        'type' => 'user',
                        'name' => $chatSession->user->name,
                        'username' => $chatSession->user->username,
                        'avatar' => $chatSession->user->avatar,
                    ]
                    : ['type' => 'guest', 'name' => 'Guest', 'username' => null, 'avatar' => null],
                'context_type' => $chatSession->context_type,
                'context_key' => $chatSession->context_key,
                'context_url' => $chatSession->context_url,
                'started_at' => $chatSession->created_at->toDayDateTimeString(),
                'messages' => $chatSession->messages->map(fn ($msg) => [
                    'id' => $msg->id,
                    'role' => $msg->role,
                    'content' => $msg->content,
                    'sent_at' => $msg->created_at->format('H:i'),
                ]),
            ],
        ]);
    }
}
