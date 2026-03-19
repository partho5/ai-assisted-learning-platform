<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('forum_categories')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('title');
            $table->longText('body');
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->boolean('is_resolved')->default(false);
            $table->unsignedInteger('upvotes_count')->default(0);
            $table->unsignedInteger('replies_count')->default(0);
            $table->timestamp('last_activity_at')->nullable();
            $table->foreignId('resource_id')->nullable()->constrained('resources')->nullOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category_id', 'last_activity_at']);
            $table->index(['is_pinned', 'last_activity_at']);
            $table->index('resource_id');
            $table->index('course_id');
        });

        // Now add the FK from forum_categories to forum_threads
        Schema::table('forum_categories', function (Blueprint $table) {
            $table->foreign('last_thread_id')->references('id')->on('forum_threads')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('forum_categories', function (Blueprint $table) {
            $table->dropForeign(['last_thread_id']);
        });

        Schema::dropIfExists('forum_threads');
    }
};
