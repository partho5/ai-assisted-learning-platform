<?php

namespace Database\Factories;

use App\Enums\CourseDifficulty;
use App\Enums\CourseLanguage;
use App\Enums\CourseStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Register the owning user as the course's lead author.
     *
     * Course authorization reads the `course_authors` pivot
     * ({@see Course::isAuthor()}), not `user_id`, and real creation always
     * attaches the creator as lead in CourseController::store. A course with no
     * lead author is not a reachable domain state, so the factory must not
     * produce one — otherwise every "mentor acts on own course" test 403s.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Course $course) {
            if ($course->user_id === null) {
                return;
            }

            $course->authors()->syncWithoutDetaching([
                $course->user_id => ['role' => 'lead', 'added_by' => $course->user_id],
            ]);
        });
    }

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

    public function bengali(): static
    {
        return $this->state(fn (array $attributes) => [
            'language' => CourseLanguage::Bn,
        ]);
    }

    public function english(): static
    {
        return $this->state(fn (array $attributes) => [
            'language' => CourseLanguage::En,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CourseStatus::Draft,
        ]);
    }

    public function pendingReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CourseStatus::PendingReview,
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
