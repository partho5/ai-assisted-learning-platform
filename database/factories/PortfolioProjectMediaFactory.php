<?php

namespace Database\Factories;

use App\Models\PortfolioProject;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PortfolioProjectMedia>
 */
class PortfolioProjectMediaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => PortfolioProject::factory(),
            'type' => 'image',
            'url' => 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
            'sort_order' => 0,
        ];
    }

    public function youtube(): static
    {
        return $this->state(fn () => [
            'type' => 'youtube',
            'url' => 'https://www.youtube.com/embed/'.Str::random(11),
        ]);
    }
}
