<?php

namespace App\Models;

use App\Enums\EvaluationMethod;
use App\Enums\QuestionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestQuestion extends Model
{
    /** @use HasFactory<\Database\Factories\TestQuestionFactory> */
    use HasFactory;
    /** @var list<string> */
    protected $fillable = [
        'test_id',
        'order',
        'question_type',
        'body',
        'hint',
        'points',
        'evaluation_method',
        'numeric_operator',
        'correct_answer',
        'ai_rubric',
        'ai_help_enabled',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'question_type' => QuestionType::class,
            'evaluation_method' => EvaluationMethod::class,
            'ai_help_enabled' => 'boolean',
            'is_required' => 'boolean',
        ];
    }

    /** @return BelongsTo<Test, $this> */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /** @return HasMany<TestQuestionOption, $this> */
    public function options(): HasMany
    {
        return $this->hasMany(TestQuestionOption::class)->orderBy('order');
    }

    /** @return HasMany<TestAttemptAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(TestAttemptAnswer::class);
    }

    public function hasOptions(): bool
    {
        return $this->question_type->hasOptions();
    }

    public function isAiGraded(): bool
    {
        return $this->evaluation_method === EvaluationMethod::AiGraded;
    }
}
