<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioSkillTag extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioSkillTagFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'portfolio_id',
        'name',
        'sort_order',
    ];

    /** @return BelongsTo<Portfolio, $this> */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }
}
