<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PortfolioCategory extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioCategoryFactory> */
    use HasFactory;

    protected $fillable = [
        'portfolio_id',
        'name',
        'slug',
        'sort_order',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** @return BelongsTo<Portfolio, $this> */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    /** @return HasMany<PortfolioProject, $this> */
    public function projects(): HasMany
    {
        return $this->hasMany(PortfolioProject::class, 'category_id');
    }
}
