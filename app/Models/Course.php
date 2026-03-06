<?php

namespace App\Models;

use App\Enums\CourseDifficulty;
use App\Enums\CourseStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Course extends Model
{
    /** @use HasFactory<\Database\Factories\CourseFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'slug',
        'description',
        'what_you_will_learn',
        'prerequisites',
        'difficulty',
        'estimated_duration',
        'thumbnail',
        'status',
        'is_featured',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'difficulty' => CourseDifficulty::class,
            'status' => CourseStatus::class,
            'is_featured' => 'boolean',
            'is_free' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<Module, $this> */
    public function modules(): HasMany
    {
        return $this->hasMany(Module::class)->orderBy('order');
    }

    /** @return HasManyThrough<Resource, Module, $this> */
    public function resources(): HasManyThrough
    {
        return $this->hasManyThrough(Resource::class, Module::class);
    }

    /** @return HasMany<Enrollment, $this> */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function resolveRouteBinding($value, $field = null): ?Model
    {
        $field = $field ?? $this->getRouteKeyName();
        // Try binding by the specified field first
        $model = $this->where($field, $value)->first();
        // If not found and value looks like an ID, try binding by ID
        if (! $model && is_numeric($value)) {
            $model = $this->where('id', $value)->first();
        }
        return $model ? $model : abort(404);
    }

    public function isPublished(): bool
    {
        return $this->status === CourseStatus::Published;
    }

    public function isDraft(): bool
    {
        return $this->status === CourseStatus::Draft;
    }

    /** @param Builder<Course> $query */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', CourseStatus::Published->value);
    }

    /** @param Builder<Course> $query */
    public function scopeDraft(Builder $query): void
    {
        $query->where('status', CourseStatus::Draft->value);
    }
}
