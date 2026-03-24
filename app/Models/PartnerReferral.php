<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerReferral extends Model
{
    /** @use HasFactory<\Database\Factories\PartnerReferralFactory> */
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'course_id',
        'visitor_user_id',
        'visitor_session_id',
        'referrer_url',
        'clicked_at',
        'expires_at',
        'converted_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'clicked_at' => 'datetime',
            'expires_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Partner, $this> */
    public function partner(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Course, $this> */
    public function course(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this> */
    public function visitor(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'visitor_user_id');
    }

    /** @param Builder<PartnerReferral> $query */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('converted_at')->where('expires_at', '>', now());
    }
}
