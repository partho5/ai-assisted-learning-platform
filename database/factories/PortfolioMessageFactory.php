<?php

namespace Database\Factories;

use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioMessage>
 */
class PortfolioMessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'portfolio_id' => Portfolio::factory(),
            'sender_name' => fake()->name(),
            'sender_email' => fake()->safeEmail(),
            'subject' => fake()->optional(0.7)->sentence(4),
            'body' => fake()->paragraph(),
            'is_read' => false,
        ];
    }

    public function read(): static
    {
        return $this->state(fn () => ['is_read' => true]);
    }
}
