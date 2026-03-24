<?php

namespace App\Models;

use App\Enums\ResourceType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Resource extends Model
{
    /** @use HasFactory<\Database\Factories\ResourceFactory> */
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'type',
        'url',
        'content',
        'caption',
        'estimated_time',
        'mentor_note',
        'why_this_resource',
        'is_free',
        'order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => ResourceType::class,
            'is_free' => 'boolean',
        ];
    }

    /** @return BelongsTo<Module, $this> */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /** @return HasOne<Test, $this> */
    public function test(): HasOne
    {
        return $this->hasOne(Test::class, 'testable_id')
            ->where('testable_type', self::class);
    }

    public function hasTest(): bool
    {
        return $this->relationLoaded('test') ? $this->test !== null : Test::where('testable_type', self::class)->where('testable_id', $this->id)->exists();
    }
}
