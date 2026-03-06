<?php

namespace App\Models;

use App\Enums\AiGradingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestAttemptAnswer extends Model
{
    /** @use HasFactory<\Database\Factories\TestAttemptAnswerFactory> */
    use HasFactory;
    /** @var list<string> */
    protected $fillable = [
        'test_attempt_id',
        'test_question_id',
        'answer_value',
        'is_correct',
        'points_earned',
        'ai_score',
        'ai_explanation',
        'ai_grading_status',
        'question_started_at',
        'question_answered_at',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'ai_grading_status' => AiGradingStatus::class,
            'question_started_at' => 'datetime',
            'question_answered_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<TestAttempt, $this> */
    public function attempt(): BelongsTo
    {
        return $this->belongsTo(TestAttempt::class, 'test_attempt_id');
    }

    /** @return BelongsTo<TestQuestion, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(TestQuestion::class, 'test_question_id');
    }
}
