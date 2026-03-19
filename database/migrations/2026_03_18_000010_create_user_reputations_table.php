<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_reputations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('points')->default(0);
            $table->timestamps();
        });

        Schema::create('forum_reputation_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('points_delta');
            $table->string('reason'); // thread_upvoted, reply_upvoted, reply_accepted, thread_created, mention_ai_responded
            $table->nullableMorphs('reference'); // reference_type, reference_id
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_reputation_events');
        Schema::dropIfExists('user_reputations');
    }
};
