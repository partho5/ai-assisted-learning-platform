<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PortfolioProject extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'portfolio_id',
        'category_id',
        'title',
        'slug',
        'description',
        'featured_image',
        'external_url',
        'tech_tags',
        'meta_description',
        'sort_order',
        'is_published',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'tech_tags' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** @return BelongsTo<Portfolio, $this> */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    /** @return BelongsTo<PortfolioCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(PortfolioCategory::class, 'category_id');
    }

    /** @return HasMany<PortfolioProjectMedia, $this> */
    public function media(): HasMany
    {
        return $this->hasMany(PortfolioProjectMedia::class, 'project_id')->orderBy('sort_order');
    }

    /**
     * Plain-text excerpt from description HTML (~150 chars).
     */
    public function excerpt(int $length = 150): string
    {
        $plain = strip_tags($this->description ?? '');

        return mb_strlen($plain) > $length
            ? mb_substr($plain, 0, $length).'...'
            : $plain;
    }
}
