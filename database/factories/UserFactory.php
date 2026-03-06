<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Enums\UserTier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->name();

        return [
            'name' => $name,
            'username' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::Learner,
            'tier' => UserTier::Free,
            'avatar' => null,
            'headline' => null,
            'bio' => null,
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Admin,
            'tier' => UserTier::Paid,
        ]);
    }

    public function mentor(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Mentor,
            'tier' => UserTier::Paid,
        ]);
    }

    public function learner(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Learner,
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'tier' => UserTier::Paid,
        ]);
    }

    public function observer(): static
    {
        return $this->state(fn (array $attributes) => [
            'tier' => UserTier::Observer,
        ]);
    }
}
