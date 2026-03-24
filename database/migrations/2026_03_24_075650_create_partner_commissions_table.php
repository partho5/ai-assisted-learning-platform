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
        Schema::create('partner_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchaser_user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('base_amount', 10, 2);
            $table->decimal('commission_amount', 10, 2);
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index('partner_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_commissions');
    }
};
