<?php

namespace App\Http\Controllers\Mentor;

use App\Enums\AttemptStatus;
use App\Enums\ResourceCompletionStatus;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\TestAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $courses = Course::query()
            ->where('user_id', $user->id)
            ->withCount('enrollments')
            ->with([
                'modules:id,course_id',
                'modules.resources:id,module_id',
            ])
            ->latest()
            ->get();

        $courseIds = $courses->pluck('id');

        $pendingSubmissionsCount = TestAttempt::query()
            ->whereIn('status', [AttemptStatus::Submitted->value, AttemptStatus::Graded->value])
            ->whereHas('test.testable.module', fn ($q) => $q->whereIn('course_id', $courseIds))
            ->count();

        $activeLearnersThisWeek = \App\Models\Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->where('updated_at', '>=', now()->subWeek())
            ->distinct('user_id')
            ->count('user_id');

        $courseStats = $courses->map(function (Course $course) {
            $totalResources = $course->resources->count();
            $enrollmentCount = $course->enrollments_count;

            return [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'status' => $course->status->value,
                'total_resources' => $totalResources,
                'enrollments_count' => $enrollmentCount,
                'created_at' => $course->created_at->toDateString(),
            ];
        });

        return Inertia::render('mentor/dashboard', [
            'stats' => [
                'total_courses' => $courses->count(),
                'total_enrollments' => $courses->sum('enrollments_count'),
                'pending_submissions' => $pendingSubmissionsCount,
                'active_learners_this_week' => $activeLearnersThisWeek,
            ],
            'courses' => $courseStats,
        ]);
    }
}
