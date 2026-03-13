<?php

namespace App\Http\Controllers;

use App\Enums\AttemptStatus;
use App\Models\Course;
use App\Models\TestAttempt;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class PublicProfileController extends Controller
{
    public function show(string $username): Response
    {
        $user = User::where('username', $username)->firstOrFail();

        if ($user->portfolio_visibility === 'private') {
            return Inertia::render('u/show', [
                'profile' => [
                    'name' => $user->name,
                    'username' => $user->username,
                    'avatar' => null,
                    'headline' => null,
                    'bio' => null,
                    'portfolio_visibility' => 'private',
                    'joined_at' => null,
                ],
                'isPrivate' => true,
                'stats' => null,
                'taughtCourses' => [],
                'enrolledCourses' => [],
                'showcasedAttempts' => [],
            ]);
        }

        // Enrolled courses with per-course progress
        $enrollments = $user->enrollments()
            ->with([
                'course' => fn ($q) => $q
                    ->with(['category:id,name,slug', 'mentor:id,name,username'])
                    ->withCount('resources'),
            ])
            ->get()
            ->map(function ($enrollment) {
                $totalResources = $enrollment->course->resources_count ?? 0;
                $endorsedCount = $enrollment->completions()->where('status', 'endorsed')->count();
                $progressPercent = $totalResources > 0 ? (int) round(($endorsedCount / $totalResources) * 100) : 0;

                return [
                    'course' => [
                        'id' => $enrollment->course->id,
                        'title' => $enrollment->course->title,
                        'slug' => $enrollment->course->slug,
                        'thumbnail' => $enrollment->course->thumbnail,
                        'category' => $enrollment->course->category,
                        'mentor' => $enrollment->course->mentor,
                    ],
                    'progress_percent' => $progressPercent,
                    'completed' => $progressPercent === 100,
                    'enrolled_at' => $enrollment->created_at?->toDateString(),
                ];
            });

        // Showcased (featured) assignment attempts
        $showcasedIds = $user->showcased_attempt_ids ?? [];

        if (! empty($showcasedIds)) {
            $showcasedAttempts = TestAttempt::whereIn('id', $showcasedIds)
                ->where('user_id', $user->id)
                ->where('status', AttemptStatus::Endorsed)
                ->with(['test.testable.module.course:id,title,slug'])
                ->get();
        } else {
            $showcasedAttempts = TestAttempt::where('user_id', $user->id)
                ->where('status', AttemptStatus::Endorsed)
                ->with(['test.testable.module.course:id,title,slug'])
                ->latest('endorsed_at')
                ->limit(5)
                ->get();
        }

        $mentorData = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar,
            'headline' => $user->headline,
        ];

        // Courses authored by this user (mentor/admin)
        $taughtCourses = Course::query()
            ->where('user_id', $user->id)
            ->published()
            ->with(['category:id,name,slug'])
            ->withCount(['modules', 'resources'])
            ->latest()
            ->get()
            ->map(fn ($course) => [
                'id' => $course->id,
                'user_id' => $course->user_id,
                'category_id' => $course->category_id,
                'title' => $course->title,
                'slug' => $course->slug,
                'description' => $course->description,
                'what_you_will_learn' => $course->what_you_will_learn,
                'prerequisites' => $course->prerequisites,
                'difficulty' => $course->difficulty,
                'estimated_duration' => $course->estimated_duration,
                'thumbnail' => $course->thumbnail,
                'status' => $course->status,
                'is_featured' => $course->is_featured,
                'price' => $course->price,
                'currency' => $course->currency,
                'billing_type' => $course->billing_type,
                'subscription_duration_months' => $course->subscription_duration_months,
                'category' => $course->category,
                'mentor' => $mentorData,
                'modules' => [],
                'modules_count' => $course->modules_count,
                'resources_count' => $course->resources_count,
            ]);

        $endorsedTotal = TestAttempt::where('user_id', $user->id)
            ->where('status', AttemptStatus::Endorsed)
            ->count();

        $stats = [
            'courses_enrolled' => $enrollments->count(),
            'courses_completed' => $enrollments->where('completed', true)->count(),
            'assignments_endorsed' => $endorsedTotal,
        ];

        return Inertia::render('u/show', [
            'profile' => [
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'headline' => $user->headline,
                'bio' => $user->bio,
                'portfolio_visibility' => $user->portfolio_visibility,
                'joined_at' => $user->created_at?->toDateString(),
            ],
            'stats' => $stats,
            'taughtCourses' => $taughtCourses->values(),
            'enrolledCourses' => $enrollments->values(),
            'showcasedAttempts' => $showcasedAttempts->map(fn ($attempt) => [
                'id' => $attempt->id,
                'test_title' => $attempt->test?->title,
                'course_title' => $attempt->test?->testable?->module?->course?->title,
                'course_slug' => $attempt->test?->testable?->module?->course?->slug,
                'score' => $attempt->score,
                'mentor_feedback' => $attempt->mentor_feedback,
                'endorsed_at' => $attempt->endorsed_at?->toDateString(),
            ])->values(),
        ]);
    }
}
