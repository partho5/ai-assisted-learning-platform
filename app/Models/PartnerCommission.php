<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerCommission extends Model
{
    /** @use HasFactory<\Database\Factories\PartnerCommissionFactory> */
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'payment_id',
        'course_id',
        'purchaser_user_id',
        'commission_rate',
        'base_amount',
        'commission_amount',
        'status',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'base_amount' => 'decimal:2',
            'commission_amount' => 'decimal:2',
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Partner, $this> */
    public function partner(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Payment, $this> */
    public function payment(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Course, $this> */
    public function course(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this> */
    public function purchaser(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'purchaser_user_id');
    }

    /** @param Builder<PartnerCommission> $query */
    public function scopePending(Builder $query): void
    {
        $query->where('status', 'pending');
    }

    /** @param Builder<PartnerCommission> $query */
    public function scopeConfirmed(Builder $query): void
    {
        $query->where('status', 'confirmed');
    }

    /** @param Builder<PartnerCommission> $query */
    public function scopeRevoked(Builder $query): void
    {
        $query->where('status', 'revoked');
    }
}
