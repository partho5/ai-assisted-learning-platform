<?php

namespace App\Jobs;

use App\Contracts\AiProvider;
use App\Enums\AiGradingStatus;
use App\Enums\AttemptStatus;
use App\Models\TestAttempt;
use App\Models\TestAttemptAnswer;
use App\Services\ForumNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class GradeTestAnswerWithAi implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public readonly TestAttemptAnswer $answer) {}

    public function handle(AiProvider $ai): void
    {
        $question = $this->answer->question;

        $this->answer->update(['ai_grading_status' => AiGradingStatus::Processing]);

        $result = $ai->grade(
            questionBody: $question->body,
            rubric: $question->ai_rubric ?? $question->body,
            answer: $this->answer->answer_value ?? '',
            maxPoints: $question->points,
        );

        $pointsEarned = (int) round(($result['score'] / 100) * $question->points);

        $this->answer->update([
            'ai_score' => $result['score'],
            'ai_explanation' => $result['explanation'],
            'ai_grading_status' => AiGradingStatus::Completed,
            'points_earned' => $pointsEarned,
            'is_correct' => $result['score'] >= 50,
        ]);

        $this->checkAndFinalizeAttempt($this->answer->attempt);
    }

    public function failed(Throwable $exception): void
    {
        $this->answer->update(['ai_grading_status' => AiGradingStatus::Failed]);
    }

    private function checkAndFinalizeAttempt(TestAttempt $attempt): void
    {
        $pendingAiAnswers = $attempt->answers()
            ->whereIn('ai_grading_status', [AiGradingStatus::Pending->value, AiGradingStatus::Processing->value])
            ->exists();

        if (! $pendingAiAnswers) {
            $totalPoints = $attempt->test->questions()->sum('points');
            $earnedPoints = $attempt->answers()->sum('points_earned');
            $score = $totalPoints > 0 ? (int) round(($earnedPoints / $totalPoints) * 100) : 0;

            $attempt->update([
                'status' => AttemptStatus::Graded,
                'score' => $score,
                'score_detail' => [
                    'total_points' => $totalPoints,
                    'earned_points' => $earnedPoints,
                    'per_question' => $attempt->answers()->get(['test_question_id', 'points_earned'])
                        ->map(fn ($a) => ['question_id' => $a->test_question_id, 'earned' => $a->points_earned])
                        ->toArray(),
                ],
            ]);

            $attempt->loadMissing(['user', 'test']);
            app(ForumNotificationService::class)->notifyTestGraded(
                $attempt->user,
                $attempt->test->title ?? 'Your test',
                $score,
            );
        }
    }
}
