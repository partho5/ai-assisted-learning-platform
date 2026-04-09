<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Portfolio extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bio',
        'secondary_bio',
        'services',
        'is_published',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'services' => 'array',
            'is_published' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<PortfolioCategory, $this> */
    public function categories(): HasMany
    {
        return $this->hasMany(PortfolioCategory::class)->orderBy('sort_order');
    }

    /** @return HasMany<PortfolioSkillTag, $this> */
    public function skillTags(): HasMany
    {
        return $this->hasMany(PortfolioSkillTag::class)->orderBy('sort_order');
    }

    /** @return HasMany<PortfolioProject, $this> */
    public function projects(): HasMany
    {
        return $this->hasMany(PortfolioProject::class)->orderBy('sort_order');
    }

    /** @return HasMany<PortfolioMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(PortfolioMessage::class);
    }

    /** @return HasMany<PortfolioVisit, $this> */
    public function visits(): HasMany
    {
        return $this->hasMany(PortfolioVisit::class);
    }
}
