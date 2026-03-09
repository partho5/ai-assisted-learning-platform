<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('coupon_code_id')->nullable()->constrained('coupon_codes')->nullOnDelete();
            // For one-time payments
            $table->string('paypal_order_id', 100)->nullable()->unique();
            // For subscriptions
            $table->string('paypal_subscription_id', 100)->nullable()->unique();
            // pending | captured | active | cancelled | failed | refunded
            $table->string('status', 20)->default('pending');
            $table->string('billing_type', 20)->default('one_time');
            $table->decimal('original_amount', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('final_amount', 10, 2);
            $table->char('currency', 3)->default('USD');
            $table->timestamps();

            $table->index(['user_id', 'course_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
