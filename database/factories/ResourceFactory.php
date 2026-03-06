<?php

namespace Database\Factories;

use App\Enums\ResourceType;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Resource>
 */
class ResourceFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement(ResourceType::cases());

        return [
            'module_id' => Module::factory(),
            'title' => fake()->sentence(4, false),
            'type' => $type,
            'url' => in_array($type, [ResourceType::Video, ResourceType::Article, ResourceType::Audio, ResourceType::Image])
                ? fake()->url()
                : null,
            'content' => $type === ResourceType::Text ? fake()->paragraphs(2, true) : null,
            'source' => fake()->optional(0.6)->randomElement(['YouTube', 'Vimeo', 'Medium', 'Dev.to', 'GitHub', 'Official Docs']),
            'estimated_time' => fake()->numberBetween(5, 60),
            'mentor_note' => fake()->optional(0.5)->sentence(),
            'why_this_resource' => fake()->sentence(),
            'is_free' => fake()->boolean(20),
            'order' => fake()->numberBetween(0, 10),
        ];
    }

    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ResourceType::Video,
            'url' => 'https://www.youtube.com/watch?v='.fake()->bothify('???????????'),
            'source' => 'YouTube',
            'content' => null,
        ]);
    }

    public function article(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ResourceType::Article,
            'url' => fake()->url(),
            'source' => fake()->randomElement(['Medium', 'Dev.to', 'Official Docs']),
            'content' => null,
        ]);
    }

    public function text(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ResourceType::Text,
            'url' => null,
            'content' => fake()->paragraphs(3, true),
        ]);
    }

    public function assignment(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ResourceType::Assignment,
            'url' => null,
            'content' => fake()->paragraphs(1, true),
        ]);
    }

    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_free' => true,
        ]);
    }
}
