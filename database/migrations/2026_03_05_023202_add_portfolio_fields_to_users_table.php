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
        Schema::table('users', function (Blueprint $table) {
            $table->string('portfolio_visibility')->default('public')->after('bio');
            $table->json('showcased_attempt_ids')->nullable()->after('portfolio_visibility');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['portfolio_visibility', 'showcased_attempt_ids']);
        });
    }
};
