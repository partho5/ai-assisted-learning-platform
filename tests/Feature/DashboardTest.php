<?php

namespace Tests\Feature;

use App\Enums\EnrollmentAccess;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function dashboardRoute(): string
    {
        return route('dashboard', ['locale' => 'en']);
    }

    private function mentorDashboardRoute(): string
    {
        return route('mentor.dashboard', ['locale' => 'en']);
    }

    private function adminDashboardRoute(): string
    {
        return route('admin.dashboard', ['locale' => 'en']);
    }

    // ─── Guest access ─────────────────────────────────────────────────────────

    public function test_guests_are_redirected_to_login_from_learner_dashboard(): void
    {
        $this->get($this->dashboardRoute())->assertRedirect(route('login'));
    }

    public function test_guests_are_redirected_to_login_from_mentor_dashboard(): void
    {
        $this->get($this->mentorDashboardRoute())->assertRedirect(route('login'));
    }

    public function test_guests_are_redirected_to_login_from_admin_dashboard(): void
    {
        $this->get($this->adminDashboardRoute())->assertRedirect(route('login'));
    }

    // ─── Learner dashboard ────────────────────────────────────────────────────

    public function test_learner_can_access_their_dashboard(): void
    {
        $learner = User::factory()->create();

        $this->actingAs($learner)
            ->get($this->dashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('dashboard'));
    }

    public function test_learner_dashboard_includes_enrolled_courses(): void
    {
        $learner = User::factory()->create();
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        Enrollment::factory()->create([
            'user_id' => $learner->id,
            'course_id' => $course->id,
            'access_level' => EnrollmentAccess::Full,
        ]);

        $this->actingAs($learner)
            ->get($this->dashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->has('enrolledCourses', 1)
                ->has('stats')
            );
    }

    public function test_mentor_visiting_learner_dashboard_is_redirected(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get($this->dashboardRoute())
            ->assertRedirect($this->mentorDashboardRoute());
    }

    public function test_admin_visiting_learner_dashboard_is_redirected(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get($this->dashboardRoute())
            ->assertRedirect($this->adminDashboardRoute());
    }

    // ─── Mentor dashboard ─────────────────────────────────────────────────────

    public function test_mentor_can_access_mentor_dashboard(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get($this->mentorDashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('mentor/dashboard'));
    }

    public function test_admin_can_access_mentor_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get($this->mentorDashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('mentor/dashboard'));
    }

    public function test_learner_cannot_access_mentor_dashboard(): void
    {
        $learner = User::factory()->create();

        $this->actingAs($learner)
            ->get($this->mentorDashboardRoute())
            ->assertForbidden();
    }

    public function test_mentor_dashboard_includes_course_stats(): void
    {
        $mentor = User::factory()->mentor()->create();
        Course::factory()->for($mentor, 'mentor')->count(2)->create();

        $this->actingAs($mentor)
            ->get($this->mentorDashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('mentor/dashboard')
                ->has('stats')
                ->has('courses', 2)
            );
    }

    // ─── Admin dashboard ──────────────────────────────────────────────────────

    public function test_admin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get($this->adminDashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/dashboard'));
    }

    public function test_mentor_cannot_access_admin_dashboard(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get($this->adminDashboardRoute())
            ->assertForbidden();
    }

    public function test_learner_cannot_access_admin_dashboard(): void
    {
        $learner = User::factory()->create();

        $this->actingAs($learner)
            ->get($this->adminDashboardRoute())
            ->assertForbidden();
    }

    public function test_admin_dashboard_includes_platform_stats(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->create();
        User::factory()->mentor()->count(2)->create();

        $this->actingAs($admin)
            ->get($this->adminDashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/dashboard')
                ->has('stats')
                ->has('recentUsers')
                ->has('recentCourses')
                ->has('recentChatSessions')
                ->where('stats.total_chat_sessions', 0)
                ->where('stats.chat_messages_today', 0)
            );
    }

    public function test_admin_dashboard_includes_chat_session_data(): void
    {
        $admin = User::factory()->admin()->create();
        $learner = User::factory()->create();

        $session = ChatSession::factory()->forUser($learner)->create(['context_type' => 'platform', 'context_key' => 'platform', 'created_at' => now()->subMinutes(5)]);
        ChatMessage::factory()->create(['chat_session_id' => $session->id, 'role' => 'user', 'content' => 'What courses are available?']);
        ChatMessage::factory()->create(['chat_session_id' => $session->id, 'role' => 'assistant', 'content' => 'We have many great courses!']);

        $guestSession = ChatSession::factory()->create(['context_type' => 'course', 'context_key' => 'course:1', 'created_at' => now()]);
        ChatMessage::factory()->create(['chat_session_id' => $guestSession->id, 'role' => 'user', 'content' => 'Tell me about this course.']);

        $this->actingAs($admin)
            ->get($this->adminDashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/dashboard')
                ->has('recentChatSessions', 2)
                ->where('stats.total_chat_sessions', 2)
                ->where('recentChatSessions.0.identity.type', 'guest')
                ->where('recentChatSessions.1.identity.type', 'user')
                ->where('recentChatSessions.1.identity.name', $learner->name)
                ->where('recentChatSessions.1.messages_count', 2)
                ->where('recentChatSessions.1.first_question', 'What courses are available?')
            );
    }

    public function test_admin_dashboard_chat_messages_today_counts_only_user_messages_from_today(): void
    {
        $admin = User::factory()->admin()->create();
        $session = ChatSession::factory()->create();

        ChatMessage::factory()->create(['chat_session_id' => $session->id, 'role' => 'user']);
        ChatMessage::factory()->create(['chat_session_id' => $session->id, 'role' => 'assistant']);
        // Old message — should not count
        ChatMessage::factory()->create(['chat_session_id' => $session->id, 'role' => 'user', 'created_at' => now()->subDays(2)]);

        $this->actingAs($admin)
            ->get($this->adminDashboardRoute())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.chat_messages_today', 1)
            );
    }
}
