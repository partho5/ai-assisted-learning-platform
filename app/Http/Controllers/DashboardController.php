<?php

namespace App\Http\Controllers;

use App\Enums\ResourceCompletionStatus;
use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $locale = app()->getLocale();

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard', ['locale' => $locale]);
        }

        if ($user->isMentor()) {
            return redirect()->route('mentor.dashboard', ['locale' => $locale]);
        }

        $enrollments = Enrollment::query()
            ->where('user_id', $user->id)
            ->with([
                'course:id,title,slug,thumbnail',
                'course.modules:id,course_id',
                'course.modules.resources:id,module_id',
                'completions',
            ])
            ->latest()
            ->get();

        $enrolledCourses = $enrollments->map(function (Enrollment $enrollment) {
            $totalResources = $enrollment->course->resources->count();
            $endorsedCount = $enrollment->completions
                ->where('status', ResourceCompletionStatus::Endorsed)
                ->count();
            $pendingCount = $enrollment->completions
                ->whereIn('status', [
                    ResourceCompletionStatus::Submitted->value,
                    ResourceCompletionStatus::InProgress->value,
                ])
                ->count();

            return [
                'id' => $enrollment->id,
                'course' => [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'slug' => $enrollment->course->slug,
                    'thumbnail' => $enrollment->course->thumbnail,
                ],
                'access_level' => $enrollment->access_level->value,
                'total_resources' => $totalResources,
                'endorsed_count' => $endorsedCount,
                'pending_endorsement_count' => $pendingCount,
                'progress_percent' => $enrollment->completionPercentage($totalResources),
                'enrolled_at' => $enrollment->created_at->toDateString(),
            ];
        });

        $payments = Payment::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['captured', 'active', 'refunded', 'cancelled'])
            ->with('course:id,title,slug,billing_type,subscription_duration_months')
            ->latest()
            ->get()
            ->map(fn (Payment $p) => [
                'id' => $p->id,
                'course_title' => $p->course?->title,
                'course_slug' => $p->course?->slug,
                'billing_type' => $p->billing_type,
                'status' => $p->status,
                'final_amount' => (float) $p->final_amount,
                'original_amount' => (float) $p->original_amount,
                'discount_amount' => (float) $p->discount_amount,
                'currency' => $p->currency,
                'created_at' => $p->created_at->toDateString(),
                'expires_at' => $enrollments
                    ->firstWhere('course_id', $p->course_id)?->expires_at?->toDateString(),
            ]);

        return Inertia::render('dashboard', [
            'enrolledCourses' => $enrolledCourses,
            'payments' => $payments,
            'stats' => [
                'total_enrolled' => $enrollments->count(),
                'pending_endorsements' => $enrolledCourses->sum('pending_endorsement_count'),
                'completed_courses' => $enrolledCourses->where('progress_percent', 100)->count(),
            ],
        ]);
    }
}
