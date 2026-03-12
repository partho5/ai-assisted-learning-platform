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
        Schema::create('ai_token_logs', function (Blueprint $table) {
            $table->id();
            $table->string('model'); // gpt-4o-mini, text-embedding-3-small, etc
            $table->string('method'); // grade, hint, chat, embed
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->nullable(); // null for embeddings
            $table->unsignedInteger('cost_cents')->default(0); // precalculated cost in cents
            $table->timestamps();
            $table->index(['model', 'method']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_token_logs');
    }
};
