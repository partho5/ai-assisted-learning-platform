<?php

namespace Database\Factories;

use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioProject>
 */
class PortfolioProjectFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3, false);

        return [
            'portfolio_id' => Portfolio::factory(),
            'category_id' => null,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'description' => '<p>'.implode('</p><p>', fake()->paragraphs(3)).'</p>',
            'featured_image' => null,
            'external_url' => fake()->optional(0.5)->url(),
            'tech_tags' => fake()->optional(0.7)->randomElements(['Laravel', 'React', 'Vue', 'Node.js', 'PostgreSQL', 'Docker'], 3),
            'meta_description' => fake()->optional(0.5)->text(160),
            'sort_order' => 0,
            'is_published' => true,
        ];
    }

    public function withCategory(): static
    {
        return $this->state(fn () => [
            'category_id' => \App\Models\PortfolioCategory::factory(),
        ]);
    }

    public function unpublished(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }
}
