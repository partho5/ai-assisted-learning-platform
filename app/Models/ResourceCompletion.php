<?php

namespace App\Models;

use App\Enums\ResourceCompletionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceCompletion extends Model
{
    /** @use HasFactory<\Database\Factories\ResourceCompletionFactory> */
    use HasFactory;
    /** @var list<string> */
    protected $fillable = [
        'enrollment_id',
        'resource_id',
        'status',
        'test_attempt_id',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ResourceCompletionStatus::class,
            'completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Enrollment, $this> */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /** @return BelongsTo<Resource, $this> */
    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    /** @return BelongsTo<TestAttempt, $this> */
    public function testAttempt(): BelongsTo
    {
        return $this->belongsTo(TestAttempt::class, 'test_attempt_id');
    }

    public function isComplete(): bool
    {
        return $this->status === ResourceCompletionStatus::Endorsed;
    }
}
