<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Partner;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PartnerCommission>
 */
class PartnerCommissionFactory extends Factory
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
            'payment_id' => Payment::factory(),
            'course_id' => Course::factory(),
            'purchaser_user_id' => User::factory(),
            'commission_rate' => 10.00,
            'base_amount' => 29.99,
            'commission_amount' => 3.00,
            'status' => 'pending',
        ];
    }

    public function revoked(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'revoked',
        ]);
    }
}
