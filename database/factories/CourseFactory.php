<?php

namespace Database\Factories;

use App\Enums\CourseDifficulty;
use App\Enums\CourseLanguage;
use App\Enums\CourseStatus;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(4, false);

        return [
            'user_id' => User::factory()->mentor(),
            'category_id' => Category::factory(),
            'language' => CourseLanguage::En,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'description' => fake()->paragraphs(2, true),
            'what_you_will_learn' => fake()->paragraphs(1, true),
            'prerequisites' => fake()->optional(0.6)->sentence(),
            'difficulty' => fake()->randomElement(CourseDifficulty::cases()),
            'estimated_duration' => fake()->numberBetween(60, 600),
            'thumbnail' => null,
            'status' => CourseStatus::Draft,
            'is_featured' => false,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CourseStatus::Published,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CourseStatus::Draft,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CourseStatus::Published,
            'is_featured' => true,
        ]);
    }
}
