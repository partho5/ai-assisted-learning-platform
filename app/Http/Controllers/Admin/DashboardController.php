<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CourseStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $totalLearners = User::query()->where('role', UserRole::Learner->value)->count();
        $totalMentors = User::query()->where('role', UserRole::Mentor->value)->count();
        $publishedCourses = Course::query()->where('status', CourseStatus::Published->value)->count();
        $draftCourses = Course::query()->where('status', CourseStatus::Draft->value)->count();
        $totalEnrollments = Enrollment::query()->count();
        $newUsersThisWeek = User::query()->where('created_at', '>=', now()->subWeek())->count();

        $recentUsers = User::query()
            ->select('id', 'name', 'username', 'email', 'role', 'tier', 'avatar', 'created_at')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role->value,
                'tier' => $user->tier->value,
                'avatar' => $user->avatar,
                'joined_at' => $user->created_at->toDateString(),
            ]);

        $recentCourses = Course::query()
            ->with('mentor:id,name,username')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'status' => $course->status->value,
                'mentor' => [
                    'name' => $course->mentor->name,
                    'username' => $course->mentor->username,
                ],
                'created_at' => $course->created_at->toDateString(),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_learners' => $totalLearners,
                'total_mentors' => $totalMentors,
                'published_courses' => $publishedCourses,
                'draft_courses' => $draftCourses,
                'total_enrollments' => $totalEnrollments,
                'new_users_this_week' => $newUsersThisWeek,
            ],
            'recentUsers' => $recentUsers,
            'recentCourses' => $recentCourses,
        ]);
    }
}
