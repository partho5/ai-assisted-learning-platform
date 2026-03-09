<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatHistoryController extends Controller
{
    private const int PAGE_SIZE = 20;

    /**
     * Return paginated chat history for a given context key.
     *
     * GET /{locale}/chat/history?context_key=platform&before_id=123&guest_user_id=...
     *
     * Returns messages oldest-first within the page so the UI can prepend naturally.
     * has_more=true means there are older messages available.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'context_key' => ['required', 'string', 'max:100'],
            'before_id' => ['nullable', 'integer', 'min:1'],
            'guest_user_id' => ['nullable', 'string', 'max:120'],
        ]);

        $session = $this->resolveSession($request);

        if (! $session) {
            return response()->json(['messages' => [], 'has_more' => false]);
        }

        $query = $session->messages()
            ->orderByDesc('id');

        if ($beforeId = $request->integer('before_id')) {
            $query->where('id', '<', $beforeId);
        }

        $messages = $query->limit(self::PAGE_SIZE + 1)->get();

        $hasMore = $messages->count() > self::PAGE_SIZE;
        $messages = $messages->take(self::PAGE_SIZE)->reverse()->values();

        return response()->json([
            'messages' => $messages->map(fn ($m) => [
                'id' => $m->id,
                'role' => $m->role,
                'content' => $m->content,
                'created_at' => $m->created_at->toISOString(),
            ]),
            'has_more' => $hasMore,
        ]);
    }

    /**
     * Delete all messages in the session for a given context key.
     *
     * DELETE /{locale}/chat/history?context_key=platform&guest_user_id=...
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'context_key' => ['required', 'string', 'max:100'],
            'guest_user_id' => ['nullable', 'string', 'max:120'],
        ]);

        $session = $this->resolveSession($request);
        $session?->messages()->delete();

        return response()->json(['ok' => true]);
    }

    private function resolveSession(Request $request): ?ChatSession
    {
        $userId = $request->user()?->id;
        $guestUserId = $request->input('guest_user_id');
        $contextKey = $request->input('context_key');

        if (! $userId && ! $guestUserId) {
            return null;
        }

        $query = ChatSession::query()->where('context_key', $contextKey);

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->whereNull('user_id')->where('guest_user_id', $guestUserId);
        }

        return $query->first();
    }
}
