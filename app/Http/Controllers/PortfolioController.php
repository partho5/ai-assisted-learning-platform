<?php

namespace App\Http\Controllers;

use App\Enums\AttemptStatus;
use App\Models\TestAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    /**
     * Toggle whether an endorsed attempt is showcased on the learner's public portfolio.
     */
    public function toggleShowcase(Request $request, TestAttempt $attempt): JsonResponse
    {
        $user = $request->user();

        if ($attempt->user_id !== $user->id || $attempt->status !== AttemptStatus::Endorsed) {
            abort(403);
        }

        $showcased = $user->showcased_attempt_ids ?? [];
        $id = $attempt->id;

        if (in_array($id, $showcased)) {
            $showcased = array_values(array_filter($showcased, fn ($v) => $v !== $id));
        } else {
            if (count($showcased) >= 5) {
                return response()->json(['message' => 'You can feature at most 5 assignments.'], 422);
            }
            $showcased[] = $id;
        }

        $user->showcased_attempt_ids = $showcased;
        $user->save();

        return response()->json(['showcased' => in_array($id, $showcased)]);
    }
}
