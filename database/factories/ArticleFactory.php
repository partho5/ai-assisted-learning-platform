<?php

namespace Database\Factories;

use App\Enums\ArticleStatus;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Article>
 */
class ArticleFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(5, false);
        $body = '<p>'.implode('</p><p>', fake()->paragraphs(4)).'</p>';

        return [
            'author_id' => User::factory()->mentor(),
            'category_id' => Category::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'excerpt' => fake()->optional(0.8)->text(155),
            'body' => $body,
            'featured_image' => null,
            'tags' => fake()->optional(0.7)->randomElements(['guide', 'how-to', 'tips', 'career', 'learning', 'skills'], 3),
            'status' => ArticleStatus::Published,
            'read_time_minutes' => fake()->numberBetween(1, 15),
            'published_at' => now(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ArticleStatus::Published,
            'published_at' => now(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ArticleStatus::Draft,
            'published_at' => null,
        ]);
    }
}
