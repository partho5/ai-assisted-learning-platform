<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function store(Request $request, Course $course): RedirectResponse
    {
        if (! $course->isPublished()) {
            abort(404);
        }

        $accessLevel = $course->isPaid() ? 'observer' : 'full';

        $enrollment = Enrollment::firstOrCreate(
            ['user_id' => $request->user()->id, 'course_id' => $course->id],
            ['access_level' => $accessLevel],
        );

        // Upgrade observer → full if course is free and they're already enrolled
        if (! $enrollment->wasRecentlyCreated && ! $course->isPaid() && $enrollment->access_level->value === 'observer') {
            $enrollment->update(['access_level' => 'full']);
        }

        return redirect()
            ->route('courses.show', ['locale' => app()->getLocale(), 'course' => $course->slug])
            ->with('success', 'You are now enrolled in this course.');
    }
}
