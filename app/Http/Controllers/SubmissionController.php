<?php

namespace App\Http\Controllers;

use App\Enums\AttemptStatus;
use App\Models\Course;
use App\Models\TestAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    public function index(Request $request, Course $course): Response
    {
        $user = $request->user();

        if (! $user->isMentor() && ! $user->isAdmin()) {
            abort(403);
        }

        $submissions = TestAttempt::query()
            ->whereHas('test.testable', function ($q) use ($course) {
                $q->whereHas('module', function ($q) use ($course) {
                    $q->where('course_id', $course->id);
                });
            })
            ->where('status', '!=', AttemptStatus::InProgress->value)
            ->with([
                'user:id,name,username,avatar',
                'test.testable:id,title,type',
            ])
            ->when($request->filled('resource_id'), fn ($q) => $q->whereHas('test', fn ($q) => $q->where('testable_id', $request->integer('resource_id'))))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderByDesc('submitted_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('mentor/courses/submissions', [
            'course' => $course,
            'submissions' => $submissions,
            'filters' => $request->only(['resource_id', 'status']),
        ]);
    }
}
