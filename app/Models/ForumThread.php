<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ForumThread extends Model
{
    /** @use HasFactory<\Database\Factories\ForumThreadFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category_id',
        'slug',
        'title',
        'body',
        'is_pinned',
        'is_locked',
        'is_resolved',
        'pending_ai_reply',
        'upvotes_count',
        'replies_count',
        'last_activity_at',
        'resource_id',
        'course_id',
        'tags',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'is_locked' => 'boolean',
            'is_resolved' => 'boolean',
            'pending_ai_reply' => 'boolean',
            'upvotes_count' => 'integer',
            'replies_count' => 'integer',
            'last_activity_at' => 'datetime',
            'tags' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<ForumCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ForumCategory::class, 'category_id');
    }

    /**
     * Alias for implicit child route binding: /{forumCategory}/{forumThread}.
     *
     * @return BelongsTo<ForumCategory, $this>
     */
    public function forumCategory(): BelongsTo
    {
        return $this->belongsTo(ForumCategory::class, 'category_id');
    }

    /** @return BelongsTo<resource, $this> */
    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return HasMany<ForumReply, $this> */
    public function replies(): HasMany
    {
        return $this->hasMany(ForumReply::class, 'thread_id');
    }

    /**
     * Alias for implicit child route binding: /{forumThread}/replies/{forumReply}.
     *
     * @return HasMany<ForumReply, $this>
     */
    public function forumReplies(): HasMany
    {
        return $this->hasMany(ForumReply::class, 'thread_id')->withTrashed();
    }

    /** @return HasMany<ForumReply, $this> */
    public function acceptedAnswer(): HasMany
    {
        return $this->hasMany(ForumReply::class, 'thread_id')->where('is_accepted_answer', true);
    }

    /** @return MorphMany<ForumVote, $this> */
    public function votes(): MorphMany
    {
        return $this->morphMany(ForumVote::class, 'votable');
    }

    /** @return MorphMany<ForumReport, $this> */
    public function reports(): MorphMany
    {
        return $this->morphMany(ForumReport::class, 'reportable');
    }

    /** @return HasMany<ForumBookmark, $this> */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(ForumBookmark::class, 'thread_id');
    }

    /** @return HasMany<ForumThreadFollow, $this> */
    public function follows(): HasMany
    {
        return $this->hasMany(ForumThreadFollow::class, 'thread_id');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** @param Builder<ForumThread> $query */
    public function scopeRecent(Builder $query): void
    {
        $query->orderByDesc('last_activity_at');
    }

    /** @param Builder<ForumThread> $query */
    public function scopePinned(Builder $query): void
    {
        $query->where('is_pinned', true);
    }

    /** @param Builder<ForumThread> $query */
    public function scopeUnanswered(Builder $query): void
    {
        $query->where('replies_count', 0);
    }

    /** @param Builder<ForumThread> $query */
    public function scopeResolved(Builder $query): void
    {
        $query->where('is_resolved', true);
    }

    /** @param Builder<ForumThread> $query */
    public function scopeTrending(Builder $query): void
    {
        $days = config('forum.trending_days', 7);
        $query->where('last_activity_at', '>=', now()->subDays($days))
            ->orderByDesc('upvotes_count')
            ->orderByDesc('replies_count');
    }

    /** Generate a unique slug from the title. */
    public static function generateSlug(string $title): string
    {
        $base = \Illuminate\Support\Str::slug($title);
        $slug = $base;
        $i = 1;

        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.\Illuminate\Support\Str::random(4);
            $i++;
        }

        return $slug;
    }

    /** Plain-text excerpt of the body, HTML stripped. */
    public function excerpt(int $length = 160): string
    {
        return \Illuminate\Support\Str::limit(strip_tags($this->body), $length);
    }
}
