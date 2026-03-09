<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ChatSession>
 */
class ChatSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'guest_user_id' => fake()->uuid().'.'.fake()->uuid(),
            'context_type' => fake()->randomElement(['platform', 'course', 'resource']),
            'context_key' => 'platform',
            'context_url' => fake()->url(),
        ];
    }

    public function forUser(\App\Models\User $user): static
    {
        return $this->state([
            'user_id' => $user->id,
            'guest_user_id' => null,
        ]);
    }
}
