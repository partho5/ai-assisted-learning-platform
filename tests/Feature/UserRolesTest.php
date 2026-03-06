<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class UserRolesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['web', 'auth', 'role:admin'])->get('/test-admin-only', fn () => 'ok');
        Route::middleware(['web', 'auth', 'role:mentor'])->get('/test-mentor-only', fn () => 'ok');
        Route::middleware(['web', 'auth', 'role:admin,mentor'])->get('/test-admin-or-mentor', fn () => 'ok');
    }

    public function test_user_role_helpers(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = User::factory()->mentor()->create();
        $learner = User::factory()->learner()->create();

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isMentor());
        $this->assertFalse($admin->isLearner());

        $this->assertTrue($mentor->isMentor());
        $this->assertFalse($mentor->isAdmin());
        $this->assertFalse($mentor->isLearner());

        $this->assertTrue($learner->isLearner());
        $this->assertFalse($learner->isAdmin());
        $this->assertFalse($learner->isMentor());
    }

    public function test_tier_access_check(): void
    {
        $freeUser = User::factory()->learner()->create();
        $observerUser = User::factory()->learner()->observer()->create();
        $paidUser = User::factory()->learner()->paid()->create();

        $this->assertTrue($freeUser->hasTierAccess(UserTier::Free));
        $this->assertFalse($freeUser->hasTierAccess(UserTier::Observer));
        $this->assertFalse($freeUser->hasTierAccess(UserTier::Paid));

        $this->assertTrue($observerUser->hasTierAccess(UserTier::Free));
        $this->assertTrue($observerUser->hasTierAccess(UserTier::Observer));
        $this->assertFalse($observerUser->hasTierAccess(UserTier::Paid));

        $this->assertTrue($paidUser->hasTierAccess(UserTier::Free));
        $this->assertTrue($paidUser->hasTierAccess(UserTier::Observer));
        $this->assertTrue($paidUser->hasTierAccess(UserTier::Paid));
    }

    public function test_ensure_role_middleware_allows_correct_role(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get('/test-admin-only')
            ->assertOk();
    }

    public function test_ensure_role_middleware_blocks_wrong_role(): void
    {
        $learner = User::factory()->learner()->create();

        $this->actingAs($learner)
            ->get('/test-admin-only')
            ->assertForbidden();
    }

    public function test_ensure_role_middleware_allows_multiple_roles(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get('/test-admin-or-mentor')
            ->assertOk();
    }

    public function test_ensure_role_middleware_redirects_unauthenticated_to_login(): void
    {
        $this->get('/test-admin-only')
            ->assertRedirect(route('login'));
    }

    public function test_user_has_unique_username(): void
    {
        $user1 = User::factory()->create(['username' => 'john-doe']);
        $user2 = User::factory()->create(['username' => 'john-doe-1']);

        $this->assertNotSame($user1->username, $user2->username);
    }

    public function test_user_role_and_tier_are_cast_to_enums(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Mentor,
            'tier' => UserTier::Paid,
        ]);

        $fresh = $user->fresh();

        $this->assertInstanceOf(UserRole::class, $fresh->role);
        $this->assertInstanceOf(UserTier::class, $fresh->tier);
        $this->assertSame(UserRole::Mentor, $fresh->role);
        $this->assertSame(UserTier::Paid, $fresh->tier);
    }
}
