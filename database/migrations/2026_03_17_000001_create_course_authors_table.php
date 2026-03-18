<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_authors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['lead', 'co_author'])->default('co_author');
            $table->foreignId('added_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['course_id', 'user_id']);
        });

        // Backfill: insert every existing course's owner as the lead author
        $courses = DB::table('courses')->select('id', 'user_id')->get();
        foreach ($courses as $course) {
            DB::table('course_authors')->insert([
                'course_id'  => $course->id,
                'user_id'    => $course->user_id,
                'role'       => 'lead',
                'added_by'   => $course->user_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('course_authors');
    }
};
