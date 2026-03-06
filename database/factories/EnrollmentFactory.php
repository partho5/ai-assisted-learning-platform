<?php

namespace Database\Factories;

use App\Enums\EnrollmentAccess;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Enrollment>
 */
class EnrollmentFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->learner(),
            'course_id' => Course::factory()->published(),
            'access_level' => EnrollmentAccess::Observer,
            'purchased_at' => null,
        ];
    }

    public function full(): static
    {
        return $this->state(fn (array $attributes) => [
            'access_level' => EnrollmentAccess::Full,
            'purchased_at' => now(),
        ]);
    }
}
