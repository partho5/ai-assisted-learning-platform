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
        Schema::create('test_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('order')->default(0);
            $table->string('question_type');
            $table->text('body');
            $table->text('hint')->nullable();
            $table->unsignedSmallInteger('points')->default(1);
            $table->string('evaluation_method')->default('exact_match');
            $table->string('numeric_operator', 10)->nullable();
            $table->text('correct_answer')->nullable();
            $table->text('ai_rubric')->nullable();
            $table->boolean('ai_help_enabled')->default(false);
            $table->boolean('is_required')->default(true);
            $table->timestamps();

            $table->index(['test_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_questions');
    }
};
