<?php

namespace Database\Factories;

use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioVisit>
 */
class PortfolioVisitFactory extends Factory
{
    public function definition(): array
    {
        return [
            'portfolio_id' => Portfolio::factory(),
            'project_id' => null,
            'ip_hash' => hash('sha256', fake()->ipv4()),
            'user_agent' => fake()->userAgent(),
            'referer' => fake()->optional(0.5)->url(),
            'visited_at' => now()->subMinutes(fake()->numberBetween(1, 43200)),
        ];
    }
}
