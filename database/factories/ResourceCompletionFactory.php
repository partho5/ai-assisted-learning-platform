<?php

namespace Database\Factories;

use App\Enums\ResourceCompletionStatus;
use App\Models\Enrollment;
use App\Models\Resource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ResourceCompletion>
 */
class ResourceCompletionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'enrollment_id' => Enrollment::factory()->full(),
            'resource_id' => Resource::factory(),
            'status' => ResourceCompletionStatus::Incomplete,
            'test_attempt_id' => null,
            'completed_at' => null,
        ];
    }

    public function endorsed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ResourceCompletionStatus::Endorsed,
            'completed_at' => now(),
        ]);
    }
}
