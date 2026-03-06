<?php

namespace Database\Factories;

use App\Models\TestAttempt;
use App\Models\TestQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TestAttemptAnswer>
 */
class TestAttemptAnswerFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'test_attempt_id' => TestAttempt::factory(),
            'test_question_id' => TestQuestion::factory(),
            'answer_value' => fake()->word(),
            'is_correct' => null,
            'points_earned' => null,
            'ai_score' => null,
            'ai_explanation' => null,
            'ai_grading_status' => null,
            'question_started_at' => null,
            'question_answered_at' => null,
        ];
    }

    public function correct(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => true,
            'points_earned' => 1,
        ]);
    }

    public function incorrect(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_correct' => false,
            'points_earned' => 0,
        ]);
    }
}
