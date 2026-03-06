<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Enums\UserTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_learner_can_register(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test Learner',
            'email' => 'learner@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'learner',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', ['locale' => 'en'], false));

        $user = User::where('email', 'learner@example.com')->firstOrFail();
        $this->assertSame(UserRole::Learner, $user->role);
        $this->assertSame(UserTier::Free, $user->tier);
        $this->assertNotEmpty($user->username);
    }

    public function test_new_mentor_can_register(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test Mentor',
            'email' => 'mentor@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'mentor',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', ['locale' => 'en'], false));

        $user = User::where('email', 'mentor@example.com')->firstOrFail();
        $this->assertSame(UserRole::Mentor, $user->role);
    }

    public function test_registration_fails_without_role(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('role');
        $this->assertGuest();
    }

    public function test_registration_rejects_admin_role(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Attacker',
            'email' => 'attacker@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $response->assertSessionHasErrors('role');
        $this->assertGuest();
    }

    public function test_username_is_auto_generated_and_unique(): void
    {
        $this->post(route('register.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane1@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'learner',
        ]);

        auth()->logout();

        $this->post(route('register.store'), [
            'name' => 'Jane Doe',
            'email' => 'jane2@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'learner',
        ]);

        $usernames = User::pluck('username')->toArray();
        $this->assertCount(count($usernames), array_unique($usernames), 'Usernames must be unique');
    }
}
