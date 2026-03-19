<?php

namespace Database\Factories;

use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ForumReply>
 */
class ForumReplyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'thread_id' => ForumThread::factory(),
            'user_id' => User::factory()->paid(),
            'body' => '<p>'.fake()->paragraph().'</p>',
            'quoted_reply_id' => null,
            'is_accepted_answer' => false,
            'upvotes_count' => 0,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => ['is_accepted_answer' => true]);
    }
}
