<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserTier;
use App\Services\ReputationService;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * Computed attributes to include in serialization.
     *
     * @var list<string>
     */
    protected $appends = ['reputation_points', 'reputation_level'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'tier',
        'avatar',
        'headline',
        'bio',
        'personal_notes',
        'portfolio_visibility',
        'showcased_attempt_ids',
        'is_ai',
        'onesignal_player_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
        'personal_notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'tier' => UserTier::class,
            'showcased_attempt_ids' => 'array',
            'is_ai' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isMentor(): bool
    {
        return $this->role === UserRole::Mentor;
    }

    public function isLearner(): bool
    {
        return $this->role === UserRole::Learner;
    }

    public function hasTierAccess(UserTier $required): bool
    {
        return $this->tier->value >= $required->value;
    }

    /** @return HasMany<Course, $this> */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /** Courses this user is an author of (via course_authors pivot). */
    /** @return BelongsToMany<Course, $this> */
    public function authoredCourses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_authors')
            ->withPivot('role', 'added_by')
            ->withTimestamps();
    }

    /** @return HasMany<Enrollment, $this> */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /** @return HasMany<ChatSession, $this> */
    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class);
    }

    /** @return HasMany<ForumThread, $this> */
    public function forumThreads(): HasMany
    {
        return $this->hasMany(ForumThread::class);
    }

    /** @return HasMany<ForumReply, $this> */
    public function forumReplies(): HasMany
    {
        return $this->hasMany(ForumReply::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasOne<UserReputation, $this> */
    public function reputation(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserReputation::class);
    }

    /** @return \Illuminate\Database\Eloquent\Relations\HasOne<AiMember, $this> */
    public function aiMember(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(AiMember::class);
    }

    /**
     * Computed reputation points total (0 if no record exists yet).
     *
     * @return Attribute<int, never>
     */
    protected function reputationPoints(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->reputation?->points ?? 0,
        );
    }

    /**
     * Computed reputation level derived from points.
     *
     * @return Attribute<array{min: int, max: int|null, label: string, color: string}, never>
     */
    protected function reputationLevel(): Attribute
    {
        return Attribute::make(
            get: fn () => app(ReputationService::class)->levelFor($this->reputation_points),
        );
    }
}
