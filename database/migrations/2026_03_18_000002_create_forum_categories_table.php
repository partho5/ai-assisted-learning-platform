<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forum_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color')->default('indigo');
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('thread_count')->default(0);
            // last_thread_id FK added after forum_threads table exists
            $table->unsignedBigInteger('last_thread_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forum_categories');
    }
};
