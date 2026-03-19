<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiMember extends Model
{
    /** @use HasFactory<\Database\Factories\AiMemberFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'persona_prompt',
        'description',
        'is_active',
        'is_moderator',
        'trigger_constraints',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_moderator' => 'boolean',
            'trigger_constraints' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check whether this AI member is active in a given category slug.
     */
    public function isActiveInCategory(string $categorySlug): bool
    {
        $constraints = $this->trigger_constraints ?? [];
        $allowed = $constraints['categories'] ?? null;

        if ($allowed === null) {
            return true;
        }

        return in_array($categorySlug, $allowed, true);
    }
}
