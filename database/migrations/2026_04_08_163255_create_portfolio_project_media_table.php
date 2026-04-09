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
        Schema::create('portfolio_project_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('portfolio_projects')->cascadeOnDelete();
            $table->string('type', 10); // 'image' or 'youtube'
            $table->string('url', 500);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_project_media');
    }
};
