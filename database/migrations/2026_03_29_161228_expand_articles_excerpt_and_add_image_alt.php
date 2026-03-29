<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop generated column first (PostgreSQL won't allow altering a column used by a generated column)
        DB::statement('DROP INDEX IF EXISTS articles_search_vector_gin');
        DB::statement('ALTER TABLE articles DROP COLUMN IF EXISTS search_vector');

        Schema::table('articles', function (Blueprint $table) {
            $table->string('excerpt', 500)->nullable()->change();
            $table->string('featured_image_alt', 255)->nullable()->after('featured_image');
        });

        // Recreate the generated tsvector column
        DB::statement("
            ALTER TABLE articles
            ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (
                to_tsvector('english',
                    coalesce(title, '') || ' ' ||
                    coalesce(excerpt, '') || ' ' ||
                    coalesce(regexp_replace(body, '<[^>]+>', ' ', 'g'), '')
                )
            ) STORED
        ");
        DB::statement('CREATE INDEX articles_search_vector_gin ON articles USING gin(search_vector)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS articles_search_vector_gin');
        DB::statement('ALTER TABLE articles DROP COLUMN IF EXISTS search_vector');

        Schema::table('articles', function (Blueprint $table) {
            $table->string('excerpt', 160)->nullable()->change();
            $table->dropColumn('featured_image_alt');
        });

        DB::statement("
            ALTER TABLE articles
            ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (
                to_tsvector('english',
                    coalesce(title, '') || ' ' ||
                    coalesce(excerpt, '') || ' ' ||
                    coalesce(regexp_replace(body, '<[^>]+>', ' ', 'g'), '')
                )
            ) STORED
        ");
        DB::statement('CREATE INDEX articles_search_vector_gin ON articles USING gin(search_vector)');
    }
};
