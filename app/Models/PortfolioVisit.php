<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioVisit extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioVisitFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'portfolio_id',
        'project_id',
        'ip_hash',
        'user_agent',
        'referer',
        'visited_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'visited_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Portfolio, $this> */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    /** @return BelongsTo<PortfolioProject, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(PortfolioProject::class, 'project_id');
    }
}
