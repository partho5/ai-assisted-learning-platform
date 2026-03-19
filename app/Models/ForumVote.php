<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ForumVote extends Model
{
    /** @use HasFactory<\Database\Factories\ForumVoteFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'votable_type',
        'votable_id',
    ];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return MorphTo<Model, $this> */
    public function votable(): MorphTo
    {
        return $this->morphTo();
    }
}
