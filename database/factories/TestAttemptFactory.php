<?php

namespace Database\Factories;

use App\Enums\AttemptStatus;
use App\Models\Test;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TestAttempt>
 */
class TestAttemptFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'test_id' => Test::factory(),
            'user_id' => User::factory()->learner(),
            'attempt_number' => 1,
            'status' => AttemptStatus::InProgress,
            'score' => null,
            'score_detail' => null,
            'mentor_feedback' => null,
            'endorsed_by' => null,
            'endorsed_at' => null,
            'started_at' => now(),
            'submitted_at' => null,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AttemptStatus::InProgress,
            'submitted_at' => null,
        ]);
    }

    public function graded(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AttemptStatus::Graded,
            'score' => fake()->numberBetween(0, 100),
            'submitted_at' => now()->subMinutes(5),
        ]);
    }

    public function endorsed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AttemptStatus::Endorsed,
            'score' => fake()->numberBetween(50, 100),
            'submitted_at' => now()->subMinutes(10),
            'endorsed_at' => now(),
        ]);
    }
}
