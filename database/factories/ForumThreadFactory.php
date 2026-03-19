<?php

namespace Database\Factories;

use App\Models\ForumCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ForumThread>
 */
class ForumThreadFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->sentence(6, false);

        return [
            'user_id' => User::factory()->paid(),
            'category_id' => ForumCategory::factory(),
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'title' => $title,
            'body' => '<p>'.implode('</p><p>', fake()->paragraphs(2)).'</p>',
            'is_pinned' => false,
            'is_locked' => false,
            'is_resolved' => false,
            'upvotes_count' => 0,
            'replies_count' => 0,
            'last_activity_at' => now(),
            'resource_id' => null,
            'course_id' => null,
            'tags' => [],
        ];
    }

    public function pinned(): static
    {
        return $this->state(fn (array $attributes) => ['is_pinned' => true]);
    }

    public function locked(): static
    {
        return $this->state(fn (array $attributes) => ['is_locked' => true]);
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => ['is_resolved' => true]);
    }
}
