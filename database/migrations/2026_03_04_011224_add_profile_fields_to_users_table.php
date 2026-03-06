<?php

use App\Enums\UserRole;
use App\Enums\UserTier;
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
            $table->string('username')->unique()->after('name');
            $table->string('role')->default(UserRole::Learner->value)->after('username');
            $table->tinyInteger('tier')->unsigned()->default(UserTier::Free->value)->after('role');
            $table->string('avatar')->nullable()->after('tier');
            $table->string('headline')->nullable()->after('avatar');
            $table->text('bio')->nullable()->after('headline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'role', 'tier', 'avatar', 'headline', 'bio']);
        });
    }
};
