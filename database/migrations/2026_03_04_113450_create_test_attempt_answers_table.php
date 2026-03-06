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
        Schema::create('test_attempt_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('test_question_id')->constrained()->cascadeOnDelete();
            $table->text('answer_value')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->unsignedSmallInteger('points_earned')->nullable();
            $table->unsignedSmallInteger('ai_score')->nullable();
            $table->text('ai_explanation')->nullable();
            $table->string('ai_grading_status', 20)->nullable();
            $table->timestamp('question_started_at')->nullable();
            $table->timestamp('question_answered_at')->nullable();
            $table->timestamps();

            $table->unique(['test_attempt_id', 'test_question_id']);
            $table->index('test_attempt_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_attempt_answers');
    }
};
