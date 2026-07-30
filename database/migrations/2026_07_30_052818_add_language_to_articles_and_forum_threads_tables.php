<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the content-language marker to the two content types that have public,
 * indexable URLs but no language of their own yet.
 *
 * Mirrors the existing `courses.language` column so every content type behaves
 * alike under the locale-mismatch guard and in the sitemap.
 *
 * The column is added nullable, backfilled to 'en' (all pre-existing content is
 * English), and only then locked to NOT NULL with a 'bn' default — so existing
 * rows keep their true language while new records default to Bengali.
 */
return new class extends Migration
{
    /**
     * @var array<int, string>
     */
    private array $tables = ['articles', 'forum_threads'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->string('language', 5)->nullable()->after('slug');
            });

            DB::table($table)->whereNull('language')->update(['language' => 'en']);

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->string('language', 5)->default('bn')->nullable(false)->change();
            });

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->index('language');
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropIndex($table.'_language_index');
                $blueprint->dropColumn('language');
            });
        }
    }
};
