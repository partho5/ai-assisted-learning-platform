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
        Schema::table('courses', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->nullable()->after('is_featured');
            $table->char('currency', 3)->default('USD')->after('price');
            // one_time = pay once own forever; subscription = monthly for N months
            $table->string('billing_type', 20)->default('one_time')->after('currency');
            $table->unsignedTinyInteger('subscription_duration_months')->nullable()->after('billing_type');
            // Cached PayPal billing-plan ID reused per subscription course
            $table->string('paypal_plan_id', 100)->nullable()->after('subscription_duration_months');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['price', 'currency', 'billing_type', 'subscription_duration_months', 'paypal_plan_id']);
        });
    }
};
