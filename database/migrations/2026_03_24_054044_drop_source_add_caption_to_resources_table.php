<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn('source');
            $table->text('caption')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn('caption');
            $table->string('source', 255)->nullable()->comment('e.g. YouTube, Medium, Google Docs')->after('content');
        });
    }
};
