<?php

namespace Database\Factories;

use App\Models\ForumReply;
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
            'parent_id' => null,
            'depth' => 0,
            'is_accepted_answer' => false,
            'upvotes_count' => 0,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => ['is_accepted_answer' => true]);
    }

    public function childOf(ForumReply $parent): static
    {
        return $this->state(fn () => [
            'parent_id' => $parent->id,
            'thread_id' => $parent->thread_id,
            'depth' => $parent->depth + 1,
        ]);
    }
}
