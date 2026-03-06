<?php

use App\Enums\CourseDifficulty;
use App\Enums\CourseStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('what_you_will_learn');
            $table->text('prerequisites')->nullable();
            $table->string('difficulty')->default(CourseDifficulty::Beginner->value);
            $table->unsignedInteger('estimated_duration')->nullable()->comment('minutes');
            $table->string('thumbnail')->nullable();
            $table->string('status')->default(CourseStatus::Draft->value);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
