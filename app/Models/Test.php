<?php

namespace App\Models;

use App\Enums\ResourceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Test extends Model
{
    /** @use HasFactory<\Database\Factories\TestFactory> */
    use HasFactory;
    /** @var list<string> */
    protected $fillable = [
        'testable_type',
        'testable_id',
        'title',
        'description',
        'passing_score',
        'time_limit_minutes',
        'max_attempts',
        'ai_help_enabled',
    ];

    protected function casts(): array
    {
        return [
            'ai_help_enabled' => 'boolean',
        ];
    }

    /** @return MorphTo<Model, $this> */
    public function testable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return HasMany<TestQuestion, $this> */
    public function questions(): HasMany
    {
        return $this->hasMany(TestQuestion::class)->orderBy('order');
    }

    /** @return HasMany<TestAttempt, $this> */
    public function attempts(): HasMany
    {
        return $this->hasMany(TestAttempt::class);
    }

    public function isFormative(): bool
    {
        $testable = $this->testable;

        return $testable instanceof Resource && $testable->type !== ResourceType::Assignment;
    }

    public function totalPoints(): int
    {
        return $this->questions()->sum('points');
    }
}
