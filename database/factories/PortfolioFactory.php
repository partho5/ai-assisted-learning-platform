<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Portfolio>
 */
class PortfolioFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'bio' => fake()->optional(0.8)->paragraph(),
            'secondary_bio' => fake()->optional(0.4)->paragraph(),
            'services' => fake()->optional(0.6)->randomElements(
                ['Web Development', 'Mobile Apps', 'UI/UX Design', 'API Development', 'Consulting'],
                fake()->numberBetween(1, 3)
            ),
            'is_published' => true,
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }
}
