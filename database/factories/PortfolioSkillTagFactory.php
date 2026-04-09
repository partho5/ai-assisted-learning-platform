<?php

namespace Database\Factories;

use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioSkillTag>
 */
class PortfolioSkillTagFactory extends Factory
{
    public function definition(): array
    {
        return [
            'portfolio_id' => Portfolio::factory(),
            'name' => fake()->randomElement(['PHP', 'Laravel', 'React', 'TypeScript', 'Python', 'Docker', 'AWS']),
            'sort_order' => 0,
        ];
    }
}
