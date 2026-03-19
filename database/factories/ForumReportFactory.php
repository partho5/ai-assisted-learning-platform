<?php

namespace Database\Factories;

use App\Enums\ForumReportReason;
use App\Models\ForumThread;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ForumReport>
 */
class ForumReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'reportable_type' => ForumThread::class,
            'reportable_id' => ForumThread::factory(),
            'reason' => fake()->randomElement(ForumReportReason::cases())->value,
            'resolved_at' => null,
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => ['resolved_at' => now()]);
    }
}
