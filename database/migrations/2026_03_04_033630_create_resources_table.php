<?php

use App\Enums\ResourceType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type')->default(ResourceType::Video->value);
            $table->text('url')->nullable();
            $table->longText('content')->nullable();
            $table->string('source')->nullable()->comment('e.g. YouTube, Medium, Google Docs');
            $table->unsignedInteger('estimated_time')->nullable()->comment('minutes');
            $table->text('mentor_note')->nullable();
            $table->text('why_this_resource');
            $table->boolean('is_free')->default(false);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
