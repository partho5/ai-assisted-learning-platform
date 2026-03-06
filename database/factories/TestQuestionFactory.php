<?php

namespace Database\Factories;

use App\Enums\EvaluationMethod;
use App\Enums\QuestionType;
use App\Models\Test;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TestQuestion>
 */
class TestQuestionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'test_id' => Test::factory(),
            'order' => fake()->numberBetween(0, 10),
            'question_type' => QuestionType::ShortText,
            'body' => fake()->sentence().'?',
            'hint' => fake()->optional(0.3)->sentence(),
            'points' => fake()->numberBetween(1, 5),
            'evaluation_method' => EvaluationMethod::ExactMatch,
            'numeric_operator' => null,
            'correct_answer' => fake()->word(),
            'ai_rubric' => null,
            'ai_help_enabled' => false,
            'is_required' => true,
        ];
    }

    public function aiGraded(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => QuestionType::Paragraph,
            'evaluation_method' => EvaluationMethod::AiGraded,
            'correct_answer' => null,
            'ai_rubric' => fake()->paragraph(),
        ]);
    }

    public function multipleChoice(): static
    {
        return $this->state(fn (array $attributes) => [
            'question_type' => QuestionType::MultipleChoice,
            'evaluation_method' => EvaluationMethod::ExactMatch,
            'correct_answer' => null,
        ]);
    }
}
