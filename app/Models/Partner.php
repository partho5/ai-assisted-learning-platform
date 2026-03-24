<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Partner extends Model
{
    /** @use HasFactory<\Database\Factories\PartnerFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'code',
        'effective_days',
        'is_active',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'effective_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Partner $partner) {
            if (! $partner->code) {
                $partner->code = static::generateUniqueCode($partner->user);
            }
        });
    }

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<User, $this> */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasMany<PartnerCommission, $this> */
    public function commissions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PartnerCommission::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasMany<PartnerReferral, $this> */
    public function referrals(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PartnerReferral::class);
    }

    /** @param Builder<Partner> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /** Generate a unique partner code: first 4 alpha chars of name + 3 random digits. */
    public static function generateUniqueCode(?User $user): string
    {
        $prefix = 'PART';
        if ($user) {
            $alpha = preg_replace('/[^A-Z]/', '', strtoupper($user->name));
            $prefix = Str::substr($alpha ?: 'PART', 0, 4);
            $prefix = str_pad($prefix, 4, 'X');
        }

        for ($i = 0; $i < 20; $i++) {
            $code = $prefix.random_int(100, 999);
            if (! static::where('code', $code)->exists()) {
                return $code;
            }
        }

        return strtoupper(Str::random(7));
    }
}
