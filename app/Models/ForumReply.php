<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ForumReply extends Model
{
    /** @use HasFactory<\Database\Factories\ForumReplyFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'thread_id',
        'user_id',
        'body',
        'quoted_reply_id',
        'is_accepted_answer',
        'upvotes_count',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_accepted_answer' => 'boolean',
            'upvotes_count' => 'integer',
        ];
    }

    /** @return BelongsTo<ForumThread, $this> */
    public function thread(): BelongsTo
    {
        return $this->belongsTo(ForumThread::class, 'thread_id');
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<ForumReply, $this> */
    public function quotedReply(): BelongsTo
    {
        return $this->belongsTo(ForumReply::class, 'quoted_reply_id')->withTrashed();
    }

    /** @return HasMany<ForumReply, $this> */
    public function quotingReplies(): HasMany
    {
        return $this->hasMany(ForumReply::class, 'quoted_reply_id');
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
}
