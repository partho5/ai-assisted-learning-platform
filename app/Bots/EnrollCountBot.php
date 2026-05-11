<?php

namespace App\Bots;

use App\Models\Course;
use Illuminate\Support\Facades\Log;
use Throwable;

class EnrollCountBot
{
    /**
     * For each published course, roll 1-in-3 odds to increment enrolled_count by 1.
     * Simulates organic enrolment growth between real enrolments.
     *
     * @return array{incremented: int, errors: int}
     */
    public function run(): array
    {
        $incremented = 0;
        $errors = 0;

        Course::query()
            ->published()
            ->each(function (Course $course) use (&$incremented, &$errors): void {
                try {
                    if ($this->roll()) {
                        $this->incrementCourse($course);
                        $incremented++;
                    }
                } catch (Throwable $e) {
                    $errors++;
                    Log::error('EnrollCountBot: failed to increment course', [
                        'course_id' => $course->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });

        Log::info('EnrollCountBot finished', compact('incremented', 'errors'));

        return compact('incremented', 'errors');
    }

    protected function incrementCourse(Course $course): void
    {
        $course->increment('enrolled_count');
    }

    protected function roll(): bool
    {
        return rand(1, 3) === 1;
    }
}
