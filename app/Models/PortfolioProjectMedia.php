<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioProjectMedia extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioProjectMediaFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'type',
        'url',
        'sort_order',
    ];

    /** @return BelongsTo<PortfolioProject, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(PortfolioProject::class, 'project_id');
    }
}
