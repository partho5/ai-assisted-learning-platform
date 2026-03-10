<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CourseStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\ChatSession;
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

        $totalChatSessions = ChatSession::query()->count();
        $chatMessagesToday = ChatMessage::query()
            ->where('role', 'user')
            ->whereDate('created_at', today())
            ->count();

        $recentChatSessions = ChatSession::query()
            ->with([
                'user:id,name,username',
                'messages' => fn ($q) => $q->where('role', 'user')->oldest()->limit(1),
            ])
            ->withCount('messages')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (ChatSession $session) => [
                'id' => $session->id,
                'identity' => $session->user
                    ? ['type' => 'user', 'name' => $session->user->name, 'username' => $session->user->username]
                    : ['type' => 'guest', 'name' => 'Guest', 'username' => null],
                'context_type' => $session->context_type,
                'context_key' => $session->context_key,
                'context_url' => $session->context_url,
                'messages_count' => $session->messages_count,
                'first_question' => $session->messages->first()?->content,
                'last_activity' => $session->updated_at->diffForHumans(),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_learners' => $totalLearners,
                'total_mentors' => $totalMentors,
                'published_courses' => $publishedCourses,
                'draft_courses' => $draftCourses,
                'total_enrollments' => $totalEnrollments,
                'new_users_this_week' => $newUsersThisWeek,
                'total_chat_sessions' => $totalChatSessions,
                'chat_messages_today' => $chatMessagesToday,
            ],
            'recentUsers' => $recentUsers,
            'recentCourses' => $recentCourses,
            'recentChatSessions' => $recentChatSessions,
        ]);
    }
}
