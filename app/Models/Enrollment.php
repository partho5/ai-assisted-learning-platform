<?php

namespace App\Models;

use App\Enums\EnrollmentAccess;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    /** @use HasFactory<\Database\Factories\EnrollmentFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'access_level',
        'purchased_at',
        'expires_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'access_level' => EnrollmentAccess::class,
            'purchased_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function isFull(): bool
    {
        return $this->access_level === EnrollmentAccess::Full;
    }

    public function isObserver(): bool
    {
        return $this->access_level === EnrollmentAccess::Observer;
    }

    /** Subscription enrollments expire; one-time purchases never do. */
    public function hasExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /** Full access that hasn't expired. */
    public function isActiveFullAccess(): bool
    {
        return $this->isFull() && ! $this->hasExpired();
    }

    /** @return HasMany<ResourceCompletion, $this> */
    public function completions(): HasMany
    {
        return $this->hasMany(ResourceCompletion::class);
    }

    public function completionPercentage(int $totalResources): int
    {
        if ($totalResources === 0) {
            return 0;
        }

        $endorsed = $this->completions()->where('status', 'endorsed')->count();

        return (int) round(($endorsed / $totalResources) * 100);
    }
}
