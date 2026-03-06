<?php

namespace Database\Factories;

use App\Models\Resource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Test>
 */
class TestFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $resource = Resource::factory()->assignment()->create();

        return [
            'testable_type' => Resource::class,
            'testable_id' => $resource->id,
            'title' => fake()->sentence(4, false),
            'description' => fake()->optional(0.6)->sentence(),
            'passing_score' => fake()->optional(0.6)->numberBetween(50, 80),
            'time_limit_minutes' => fake()->optional(0.4)->numberBetween(10, 60),
            'max_attempts' => fake()->optional(0.4)->numberBetween(1, 5),
            'ai_help_enabled' => false,
        ];
    }

    public function forResource(Resource $resource): static
    {
        return $this->state(fn (array $attributes) => [
            'testable_type' => Resource::class,
            'testable_id' => $resource->id,
        ]);
    }

    public function formative(): static
    {
        return $this->state(fn (array $attributes) => [
            'testable_type' => Resource::class,
        ]);
    }
}
