<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Partner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PartnerReferral>
 */
class PartnerReferralFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'course_id' => Course::factory(),
            'visitor_user_id' => null,
            'visitor_session_id' => fake()->uuid(),
            'clicked_at' => now(),
            'expires_at' => now()->addDays(30),
            'converted_at' => null,
        ];
    }
}
