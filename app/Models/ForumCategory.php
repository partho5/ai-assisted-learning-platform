<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForumCategory extends Model
{
    /** @use HasFactory<\Database\Factories\ForumCategoryFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'description',
        'color',
        'sort_order',
        'thread_count',
        'last_thread_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'thread_count' => 'integer',
        ];
    }

    /** @return HasMany<ForumThread, $this> */
    public function threads(): HasMany
    {
        return $this->hasMany(ForumThread::class, 'category_id');
    }

    /**
     * Alias for implicit child route binding: /{forumCategory}/{forumThread}.
     *
     * @return HasMany<ForumThread, $this>
     */
    public function forumThreads(): HasMany
    {
        return $this->hasMany(ForumThread::class, 'category_id');
    }

    /** @return BelongsTo<ForumThread, $this> */
    public function lastThread(): BelongsTo
    {
        return $this->belongsTo(ForumThread::class, 'last_thread_id');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
