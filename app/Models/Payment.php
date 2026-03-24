<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'coupon_code_id',
        'referred_by_partner_id',
        'paypal_order_id',
        'paypal_subscription_id',
        'status',
        'billing_type',
        'original_amount',
        'discount_amount',
        'final_amount',
        'currency',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'original_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_amount' => 'decimal:2',
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this> */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Course, $this> */
    public function course(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<CouponCode, $this> */
    public function couponCode(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(CouponCode::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Partner, $this> */
    public function referredByPartner(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Partner::class, 'referred_by_partner_id');
    }

    public function isCaptured(): bool
    {
        return $this->status === 'captured';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
