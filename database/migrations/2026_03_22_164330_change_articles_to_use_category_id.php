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
        Schema::table('articles', function (Blueprint $table) {
            try {
                $table->dropForeign('articles_article_category_id_foreign');
            } catch (\Exception) {
                // Ignore if constraint doesn't exist
            }
            $table->renameColumn('article_category_id', 'category_id');
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            try {
                $table->dropForeign('articles_category_id_foreign');
            } catch (\Exception) {
                // Ignore if constraint doesn't exist
            }
            $table->renameColumn('category_id', 'article_category_id');
            $table->foreign('article_category_id')->references('id')->on('article_categories')->nullOnDelete();
        });
    }
};
