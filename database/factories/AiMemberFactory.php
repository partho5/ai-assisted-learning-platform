<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AiMember>
 */
class AiMemberFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['is_ai' => true]),
            'persona_prompt' => 'You are a helpful and knowledgeable forum assistant.',
            'description' => fake()->sentence(),
            'is_active' => true,
            'is_moderator' => false,
            'trigger_constraints' => null,
        ];
    }

    /** AI member that is inactive. */
    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    /** AI member restricted to specific trigger events. */
    public function withTriggers(array $triggers): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_constraints' => array_merge(
                $attributes['trigger_constraints'] ?? [],
                ['trigger_on' => $triggers]
            ),
        ]);
    }

    /** AI member restricted to specific category slugs. */
    public function inCategories(array $slugs): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_constraints' => array_merge(
                $attributes['trigger_constraints'] ?? [],
                ['categories' => $slugs]
            ),
        ]);
    }

    /** AI member with keyword filter. */
    public function withKeywords(array $keywords): static
    {
        return $this->state(fn (array $attributes) => [
            'trigger_constraints' => array_merge(
                $attributes['trigger_constraints'] ?? [],
                ['keywords' => $keywords]
            ),
        ]);
    }
}
