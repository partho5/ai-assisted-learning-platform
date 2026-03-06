<?php

namespace App\Http\Controllers;

use App\Enums\AiGradingStatus;
use App\Enums\AttemptStatus;
use App\Enums\EvaluationMethod;
use App\Enums\NumericOperator;
use App\Enums\ResourceCompletionStatus;
use App\Jobs\GradeTestAnswerWithAi;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Resource;
use App\Models\ResourceCompletion;
use App\Models\TestAttempt;
use App\Models\TestAttemptAnswer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestAttemptController extends Controller
{
    public function store(Request $request, Course $course, Resource $resource): RedirectResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->firstOrFail();

        if ($enrollment->isObserver() && ! $resource->is_free) {
            abort(403);
        }

        $test = $resource->test;

        if (! $test) {
            abort(404);
        }

        // Enforce max attempts
        if ($test->max_attempts !== null) {
            $attemptCount = TestAttempt::where('test_id', $test->id)
                ->where('user_id', $user->id)
                ->where('status', '!=', 'in_progress')
                ->count();

            if ($attemptCount >= $test->max_attempts) {
                return back()->with('error', 'Maximum attempts reached.');
            }
        }

        // Reuse existing in_progress attempt or create new
        $attempt = TestAttempt::firstOrCreate(
            ['test_id' => $test->id, 'user_id' => $user->id, 'status' => 'in_progress'],
            [
                'attempt_number' => TestAttempt::where('test_id', $test->id)->where('user_id', $user->id)->count() + 1,
                'started_at' => now(),
            ]
        );

        return redirect()->route('learn.show', [
            'locale' => app()->getLocale(),
            'course' => $course->slug,
            'resource' => $resource->id,
        ]);
    }

    public function saveAnswers(Request $request, TestAttempt $attempt): JsonResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($attempt->isSubmitted()) {
            return response()->json(['error' => 'Attempt already submitted.'], 422);
        }

        $request->validate([
            'answers' => ['required', 'array'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.value' => ['nullable', 'string'],
            'answers.*.started_at' => ['nullable', 'date'],
            'answers.*.answered_at' => ['nullable', 'date'],
        ]);

        foreach ($request->input('answers') as $answerData) {
            TestAttemptAnswer::updateOrCreate(
                ['test_attempt_id' => $attempt->id, 'test_question_id' => $answerData['question_id']],
                [
                    'answer_value' => $answerData['value'],
                    'question_started_at' => $answerData['started_at'] ?? null,
                    'question_answered_at' => $answerData['answered_at'] ?? null,
                ]
            );
        }

        return response()->json(['saved' => true]);
    }

    public function submit(Request $request, TestAttempt $attempt): RedirectResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($attempt->isSubmitted()) {
            return back()->with('error', 'Already submitted.');
        }

        $attempt->update(['submitted_at' => now()]);

        $test = $attempt->test->load('questions');
        $hasAiQuestions = false;
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($test->questions as $question) {
            $answer = TestAttemptAnswer::firstOrCreate(
                ['test_attempt_id' => $attempt->id, 'test_question_id' => $question->id],
                ['answer_value' => null]
            );

            $totalPoints += $question->points;

            if ($question->isAiGraded()) {
                $hasAiQuestions = true;
                $answer->update(['ai_grading_status' => AiGradingStatus::Pending]);
                GradeTestAnswerWithAi::dispatch($answer);
            } else {
                [$isCorrect, $points] = $this->gradeAnswer($question, $answer->answer_value);
                $answer->update(['is_correct' => $isCorrect, 'points_earned' => $points]);
                $earnedPoints += $points;
            }
        }

        if ($hasAiQuestions) {
            $attempt->update(['status' => AttemptStatus::Grading]);
        } else {
            $score = $totalPoints > 0 ? (int) round(($earnedPoints / $totalPoints) * 100) : 0;
            $attempt->update([
                'status' => AttemptStatus::Graded,
                'score' => $score,
                'score_detail' => [
                    'total_points' => $totalPoints,
                    'earned_points' => $earnedPoints,
                ],
            ]);

            // Auto-endorse formative tests
            if ($attempt->test->isFormative()) {
                $this->autoEndorse($attempt);
            }
        }

        return redirect()->route('learn.attempts.result', [
            'locale' => app()->getLocale(),
            'attempt' => $attempt->id,
        ]);
    }

    public function result(TestAttempt $attempt): Response
    {
        $user = auth()->user();

        if ($attempt->user_id !== $user->id) {
            abort(403);
        }

        $attempt->load(['test.questions.options', 'answers']);

        $isShowcased = in_array($attempt->id, $user->showcased_attempt_ids ?? []);

        return Inertia::render('courses/attempt-result', [
            'attempt' => $attempt,
            'isShowcased' => $isShowcased,
        ]);
    }

    public function show(TestAttempt $attempt): Response
    {
        $user = auth()->user();

        // Must be a mentor/admin; optionally enforce they own the course
        if (! $user->isMentor() && ! $user->isAdmin()) {
            abort(403);
        }

        $attempt->load(['test.questions.options', 'answers', 'user:id,name,username,avatar']);

        return Inertia::render('mentor/courses/attempt-review', [
            'attempt' => $attempt,
        ]);
    }

    public function endorse(Request $request, TestAttempt $attempt): RedirectResponse
    {
        $user = $request->user();

        if (! $user->isMentor() && ! $user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'mentor_feedback' => ['nullable', 'string'],
            'score_overrides' => ['nullable', 'array'],
            'score_overrides.*.answer_id' => ['integer'],
            'score_overrides.*.points' => ['integer', 'min:0'],
        ]);

        // Apply score overrides
        if ($request->filled('score_overrides')) {
            foreach ($request->input('score_overrides') as $override) {
                TestAttemptAnswer::where('id', $override['answer_id'])
                    ->where('test_attempt_id', $attempt->id)
                    ->update(['points_earned' => $override['points']]);
            }

            // Recalculate score
            $totalPoints = $attempt->test->questions()->sum('points');
            $earnedPoints = $attempt->answers()->sum('points_earned');
            $score = $totalPoints > 0 ? (int) round(($earnedPoints / $totalPoints) * 100) : 0;
            $attempt->update(['score' => $score]);
        }

        $attempt->update([
            'status' => AttemptStatus::Endorsed,
            'mentor_feedback' => $request->input('mentor_feedback'),
            'endorsed_by' => $user->id,
            'endorsed_at' => now(),
        ]);

        // Update resource completion
        $completion = ResourceCompletion::where('test_attempt_id', $attempt->id)->first();

        if ($completion) {
            $completion->update([
                'status' => ResourceCompletionStatus::Endorsed,
                'completed_at' => now(),
            ]);
        }

        return back()->with('success', 'Submission endorsed.');
    }

    /**
     * Grade a single answer against its question.
     *
     * @return array{bool, int}
     */
    private function gradeAnswer(\App\Models\TestQuestion $question, ?string $answerValue): array
    {
        if ($answerValue === null || $answerValue === '') {
            return [false, 0];
        }

        $correct = $question->correct_answer;

        if ($correct === null) {
            return [false, 0];
        }

        $isCorrect = match ($question->evaluation_method) {
            EvaluationMethod::ExactMatch => $this->gradeExactMatch($question, $answerValue, $correct),
            EvaluationMethod::NumericComparison => $this->gradeNumericComparison($question, $answerValue, $correct),
            default => false,
        };

        return [$isCorrect, $isCorrect ? $question->points : 0];
    }

    private function gradeExactMatch(\App\Models\TestQuestion $question, string $answer, string $correct): bool
    {
        if ($question->question_type->hasOptions()) {
            // For checkboxes: sort both arrays and compare
            if ($question->question_type->value === 'checkboxes') {
                $answerIds = json_decode($answer, true) ?? [];
                $correctIds = json_decode($correct, true) ?? [];
                sort($answerIds);
                sort($correctIds);

                return $answerIds === $correctIds;
            }

            // multiple_choice or dropdown: simple string comparison
            return trim($answer) === trim($correct);
        }

        // Text comparison: case-insensitive trim
        return mb_strtolower(trim($answer)) === mb_strtolower(trim($correct));
    }

    private function gradeNumericComparison(\App\Models\TestQuestion $question, string $answer, string $correct): bool
    {
        $answerNum = (float) $answer;
        $correctNum = (float) $correct;

        return match (NumericOperator::tryFrom($question->numeric_operator ?? '')) {
            NumericOperator::Eq => $answerNum == $correctNum,
            NumericOperator::Gt => $answerNum > $correctNum,
            NumericOperator::Gte => $answerNum >= $correctNum,
            NumericOperator::Lt => $answerNum < $correctNum,
            NumericOperator::Lte => $answerNum <= $correctNum,
            default => false,
        };
    }

    private function autoEndorse(TestAttempt $attempt): void
    {
        // Find the resource from the test
        $test = $attempt->test;
        $resource = $test->testable;

        if (! $resource instanceof Resource) {
            return;
        }

        // Find the enrollment via resource → module → course
        $course = $resource->module->course;
        $enrollment = Enrollment::where('user_id', $attempt->user_id)
            ->where('course_id', $course->id)
            ->first();

        if (! $enrollment) {
            return;
        }

        $completion = ResourceCompletion::firstOrCreate(
            ['enrollment_id' => $enrollment->id, 'resource_id' => $resource->id],
            ['status' => ResourceCompletionStatus::Incomplete]
        );

        $completion->update([
            'status' => ResourceCompletionStatus::Endorsed,
            'test_attempt_id' => $attempt->id,
            'completed_at' => now(),
        ]);
    }
}
