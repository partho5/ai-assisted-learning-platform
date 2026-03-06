<?php

namespace App\Models;

use App\Enums\AttemptStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestAttempt extends Model
{
    /** @use HasFactory<\Database\Factories\TestAttemptFactory> */
    use HasFactory;
    /** @var list<string> */
    protected $fillable = [
        'test_id',
        'user_id',
        'attempt_number',
        'status',
        'score',
        'score_detail',
        'mentor_feedback',
        'endorsed_by',
        'endorsed_at',
        'started_at',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AttemptStatus::class,
            'score_detail' => 'array',
            'endorsed_at' => 'datetime',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Test, $this> */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function endorsedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'endorsed_by');
    }

    /** @return HasMany<TestAttemptAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(TestAttemptAnswer::class);
    }

    public function isSubmitted(): bool
    {
        return $this->status !== AttemptStatus::InProgress;
    }

    public function isEndorsed(): bool
    {
        return $this->status === AttemptStatus::Endorsed;
    }

    public function needsAiGrading(): bool
    {
        return $this->status === AttemptStatus::Grading;
    }
}
