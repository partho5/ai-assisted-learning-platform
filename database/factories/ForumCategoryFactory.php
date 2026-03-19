<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ForumCategory>
 */
class ForumCategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'slug' => Str::slug($name),
            'name' => ucfirst($name),
            'description' => fake()->optional()->sentence(),
            'color' => fake()->randomElement(['indigo', 'amber', 'violet', 'emerald', 'sky', 'rose', 'orange', 'gray']),
            'sort_order' => fake()->numberBetween(0, 10),
            'thread_count' => 0,
            'last_thread_id' => null,
        ];
    }
}
