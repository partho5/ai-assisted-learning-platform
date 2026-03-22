<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
    }
};
