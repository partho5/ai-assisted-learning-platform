<?php

namespace App\Http\Controllers;

use App\Contracts\AiProvider;
use App\Enums\UserTier;
use App\Models\TestQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiHelpController extends Controller
{
    public function __construct(private readonly AiProvider $ai) {}

    public function ask(Request $request, TestQuestion $question): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasTierAccess(UserTier::Paid)) {
            return response()->json(['error' => 'AI help requires a paid account.'], 403);
        }

        if (! $question->ai_help_enabled) {
            return response()->json(['error' => 'AI help is not enabled for this question.'], 403);
        }

        $request->validate([
            'answer_draft' => ['nullable', 'string', 'max:5000'],
        ]);

        $hint = $this->ai->hint($question->body, $request->input('answer_draft', ''));

        return response()->json(['hint' => $hint]);
    }
}
