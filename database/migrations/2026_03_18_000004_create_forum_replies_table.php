<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('forum_threads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('body');
            $table->foreignId('quoted_reply_id')->nullable()->constrained('forum_replies')->nullOnDelete();
            $table->boolean('is_accepted_answer')->default(false);
            $table->unsignedInteger('upvotes_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('thread_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_replies');
    }
};
