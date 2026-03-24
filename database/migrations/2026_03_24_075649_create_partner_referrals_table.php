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
        Schema::create('partner_referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('visitor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('visitor_session_id', 100);
            $table->string('referrer_url', 500)->nullable();
            $table->timestamp('clicked_at');
            $table->timestamp('expires_at');
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();

            $table->unique(['partner_id', 'course_id', 'visitor_session_id']);
            $table->index(['course_id', 'visitor_session_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_referrals');
    }
};
