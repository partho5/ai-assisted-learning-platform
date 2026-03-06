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
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->morphs('testable');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('passing_score')->nullable();
            $table->unsignedSmallInteger('time_limit_minutes')->nullable();
            $table->unsignedSmallInteger('max_attempts')->nullable();
            $table->boolean('ai_help_enabled')->default(false);
            $table->timestamps();

            $table->unique(['testable_type', 'testable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};
