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
        Schema::create('chat_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_user_id', 120)->nullable()->index();
            $table->string('context_type', 20); // platform | course | resource
            $table->string('context_key', 100);  // e.g. "platform", "course:42", "resource:77"
            $table->text('context_url');
            $table->timestamps();

            $table->index(['user_id', 'context_key']);
            $table->index(['guest_user_id', 'context_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_sessions');
    }
};
