<?php

namespace Database\Factories;

use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioCategory>
 */
class PortfolioCategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'portfolio_id' => Portfolio::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'sort_order' => 0,
        ];
    }
}
