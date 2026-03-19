<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserReputation extends Model
{
    /** @use HasFactory<\Database\Factories\UserReputationFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'points',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'points' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the reputation level info for this points total.
     *
     * @return array{min: int, max: int|null, label: string, color: string}
     */
    public function level(): array
    {
        $levels = config('forum.reputation.levels');

        foreach (array_reverse($levels) as $level) {
            if ($this->points >= $level['min']) {
                return $level;
            }
        }

        return $levels[0];
    }
}
