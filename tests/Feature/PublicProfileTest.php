<?php

namespace Tests\Feature;

use App\Enums\AttemptStatus;
use App\Enums\EnrollmentAccess;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Portfolio;
use App\Models\TestAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProfileTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function portfolioRoute(string $username): string
    {
        return route('portfolio.show', ['locale' => 'en', 'username' => $username]);
    }

    private function showcaseRoute(int $attemptId): string
    {
        return route('portfolio.showcase', ['locale' => 'en', 'attempt' => $attemptId]);
    }

    private function profileRoute(User $user): string
    {
        return route('portfolio.show', ['locale' => 'en', 'username' => $user->username]);
    }

    // ─── Public visibility ────────────────────────────────────────────────────

    public function test_public_portfolio_is_accessible_by_anyone(): void
    {
        $user = User::factory()->create(['portfolio_visibility' => 'public']);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('u/show'));
    }

    public function test_public_portfolio_includes_profile_data(): void
    {
        $user = User::factory()->create([
            'portfolio_visibility' => 'public',
            'headline' => 'Laravel developer',
            'bio' => 'Learning every day.',
        ]);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('u/show')
                ->where('profile.name', $user->name)
                ->where('profile.username', $user->username)
                ->where('profile.headline', 'Laravel developer')
                ->where('profile.bio', 'Learning every day.')
            );
    }

    public function test_unlisted_portfolio_is_accessible_via_direct_link(): void
    {
        $user = User::factory()->create(['portfolio_visibility' => 'unlisted']);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('u/show'));
    }

    public function test_private_portfolio_returns_200_with_private_flag(): void
    {
        $user = User::factory()->create(['portfolio_visibility' => 'private']);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('u/show')
                ->where('isPrivate', true)
            );
    }

    public function test_nonexistent_username_returns_404(): void
    {
        $this->get($this->portfolioRoute('does-not-exist'))->assertNotFound();
    }

    // ─── Portfolio data ───────────────────────────────────────────────────────

    public function test_portfolio_includes_enrolled_courses(): void
    {
        $learner = User::factory()->create(['portfolio_visibility' => 'public']);
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        Enrollment::factory()->create([
            'user_id' => $learner->id,
            'course_id' => $course->id,
            'access_level' => EnrollmentAccess::Full,
        ]);

        $this->get($this->portfolioRoute($learner->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('enrolledCourses', 1)
                ->has('stats')
            );
    }

    public function test_portfolio_stats_reflect_enrolled_count(): void
    {
        $learner = User::factory()->create(['portfolio_visibility' => 'public']);
        $mentor = User::factory()->mentor()->create();
        $courses = Course::factory()->for($mentor, 'mentor')->count(2)->create();

        foreach ($courses as $course) {
            Enrollment::factory()->create([
                'user_id' => $learner->id,
                'course_id' => $course->id,
                'access_level' => EnrollmentAccess::Full,
            ]);
        }

        $this->get($this->portfolioRoute($learner->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.courses_enrolled', 2)
            );
    }

    public function test_portfolio_shows_endorsed_attempts_when_no_showcase_set(): void
    {
        $learner = User::factory()->create(['portfolio_visibility' => 'public', 'showcased_attempt_ids' => null]);
        $attempt = TestAttempt::factory()->create([
            'user_id' => $learner->id,
            'status' => AttemptStatus::Endorsed,
            'endorsed_at' => now(),
        ]);

        $this->get($this->portfolioRoute($learner->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('showcasedAttempts', 1)
                ->where('showcasedAttempts.0.id', $attempt->id)
            );
    }

    public function test_portfolio_shows_only_showcased_attempts_when_set(): void
    {
        $learner = User::factory()->create(['portfolio_visibility' => 'public']);

        $showcased = TestAttempt::factory()->create([
            'user_id' => $learner->id,
            'status' => AttemptStatus::Endorsed,
            'endorsed_at' => now(),
        ]);

        $other = TestAttempt::factory()->create([
            'user_id' => $learner->id,
            'status' => AttemptStatus::Endorsed,
            'endorsed_at' => now(),
        ]);

        $learner->update(['showcased_attempt_ids' => [$showcased->id]]);

        $this->get($this->portfolioRoute($learner->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('showcasedAttempts', 1)
                ->where('showcasedAttempts.0.id', $showcased->id)
            );
    }

    // ─── Showcase toggle ──────────────────────────────────────────────────────

    public function test_learner_can_toggle_showcase_for_endorsed_attempt(): void
    {
        $learner = User::factory()->create();
        $attempt = TestAttempt::factory()->create([
            'user_id' => $learner->id,
            'status' => AttemptStatus::Endorsed,
        ]);

        /**
         * The endpoint is Inertia, not JSON: both UI call sites use
         * router.post() and PortfolioController::toggleShowcase returns back().
         * The persisted state is the contract that matters.
         */
        $this->actingAs($learner)
            ->from($this->profileRoute($learner))
            ->post($this->showcaseRoute($attempt->id))
            ->assertRedirect($this->profileRoute($learner));

        $this->assertContains($attempt->id, $learner->fresh()->showcased_attempt_ids ?? []);
    }

    public function test_learner_can_remove_attempt_from_showcase(): void
    {
        $learner = User::factory()->create(['showcased_attempt_ids' => []]);
        $attempt = TestAttempt::factory()->create([
            'user_id' => $learner->id,
            'status' => AttemptStatus::Endorsed,
        ]);

        $learner->update(['showcased_attempt_ids' => [$attempt->id]]);

        $this->actingAs($learner)
            ->from($this->profileRoute($learner))
            ->post($this->showcaseRoute($attempt->id))
            ->assertRedirect($this->profileRoute($learner));

        $this->assertNotContains($attempt->id, $learner->fresh()->showcased_attempt_ids ?? []);
    }

    public function test_cannot_showcase_non_endorsed_attempt(): void
    {
        $learner = User::factory()->create();
        $attempt = TestAttempt::factory()->create([
            'user_id' => $learner->id,
            'status' => AttemptStatus::Graded,
        ]);

        $this->actingAs($learner)
            ->post($this->showcaseRoute($attempt->id))
            ->assertForbidden();
    }

    public function test_cannot_showcase_another_users_attempt(): void
    {
        $learner = User::factory()->create();
        $other = User::factory()->create();
        $attempt = TestAttempt::factory()->create([
            'user_id' => $other->id,
            'status' => AttemptStatus::Endorsed,
        ]);

        $this->actingAs($learner)
            ->post($this->showcaseRoute($attempt->id))
            ->assertForbidden();
    }

    public function test_guest_cannot_toggle_showcase(): void
    {
        $learner = User::factory()->create();
        $attempt = TestAttempt::factory()->create([
            'user_id' => $learner->id,
            'status' => AttemptStatus::Endorsed,
        ]);

        $this->post($this->showcaseRoute($attempt->id))->assertRedirect(route('login'));
    }

    // ─── Profile settings ─────────────────────────────────────────────────────

    public function test_user_can_update_bio_headline_and_visibility(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => $user->name,
                'email' => $user->email,
                'headline' => 'Test headline',
                'bio' => 'Test bio',
                'portfolio_visibility' => 'unlisted',
            ])
            ->assertRedirect(route('profile.edit'));

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'headline' => 'Test headline',
            'bio' => 'Test bio',
            'portfolio_visibility' => 'unlisted',
        ]);
    }

    public function test_invalid_portfolio_visibility_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => $user->name,
                'email' => $user->email,
                'portfolio_visibility' => 'secret',
            ])
            ->assertSessionHasErrors('portfolio_visibility');
    }

    // ─── SEO props (F1): self-referential per-locale canonical ────────────────

    public function test_profile_exposes_self_referential_canonical_per_locale(): void
    {
        $appUrl = rtrim(config('app.url'), '/');
        $user = User::factory()->create(['portfolio_visibility' => 'public']);

        $this->get(route('portfolio.show', ['locale' => 'en', 'username' => $user->username]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('u/show')
                ->where('appUrl', $appUrl)
                ->where('canonicalUrl', "{$appUrl}/en/u/{$user->username}")
            );

        $this->get(route('portfolio.show', ['locale' => 'bn', 'username' => $user->username]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('canonicalUrl', "{$appUrl}/bn/u/{$user->username}")
            );
    }

    public function test_private_profile_still_emits_canonical(): void
    {
        $appUrl = rtrim(config('app.url'), '/');
        $user = User::factory()->create(['portfolio_visibility' => 'private']);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('isPrivate', true)
                ->where('canonicalUrl', "{$appUrl}/en/u/{$user->username}")
            );
    }

    // ─── F3 schema data: taught published courses surface ─────────────────────

    public function test_profile_exposes_only_published_taught_courses(): void
    {
        $user = User::factory()->create(['portfolio_visibility' => 'public']);
        Course::factory()->published()->create(['user_id' => $user->id]);
        Course::factory()->draft()->create(['user_id' => $user->id]);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('taughtCourses', 1));
    }

    // ─── Cross-link plumbing (F4): hasPortfolio ───────────────────────────────

    public function test_has_portfolio_true_when_published_portfolio_exists(): void
    {
        $user = User::factory()->create(['portfolio_visibility' => 'public']);
        Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('hasPortfolio', true));
    }

    public function test_has_portfolio_false_without_published_portfolio(): void
    {
        $user = User::factory()->create(['portfolio_visibility' => 'public']);
        Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => false]);

        $this->get($this->portfolioRoute($user->username))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('hasPortfolio', false));
    }
}
