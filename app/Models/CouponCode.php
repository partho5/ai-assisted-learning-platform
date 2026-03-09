<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CouponCode extends Model
{
    /** @use HasFactory<\Database\Factories\CouponCodeFactory> */
    use HasFactory;

    protected $fillable = [
        'created_by',
        'course_id',
        'code',
        'discount_percent',
        'usage_limit',
        'used_count',
        'expires_at',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
            'used_count' => 'integer',
            'usage_limit' => 'integer',
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this> */
    public function creator(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Course, $this> */
    public function course(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasMany<Payment, $this> */
    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isFullDiscount(): bool
    {
        return $this->discount_percent >= 100;
    }

    public function isUsable(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /** Calculate the final price after applying this coupon to an original price. */
    public function applyTo(float $originalPrice): float
    {
        $discount = $originalPrice * ($this->discount_percent / 100);

        return max(0, round($originalPrice - $discount, 2));
    }
}
