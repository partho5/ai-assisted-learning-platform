<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_users_index(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->learner()->count(3)->create();

        $response = $this->actingAs($admin)->get(route('admin.users.index', ['locale' => 'en']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('admin/users')
            ->has('users')
            ->has('filters')
        );
    }

    public function test_learner_cannot_access_users_index(): void
    {
        $learner = User::factory()->learner()->create();

        $this->actingAs($learner)
            ->get(route('admin.users.index', ['locale' => 'en']))
            ->assertForbidden();
    }

    public function test_guest_cannot_access_users_index(): void
    {
        $this->get(route('admin.users.index', ['locale' => 'en']))
            ->assertRedirect();
    }

    public function test_users_index_filters_by_role(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->mentor()->count(2)->create();
        User::factory()->learner()->count(3)->create();

        $response = $this->actingAs($admin)
            ->get(route('admin.users.index', ['locale' => 'en', 'role' => 'mentor']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('admin/users')
            ->where('filters.role', 'mentor')
        );
    }

    public function test_users_index_excludes_ai_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['is_ai' => true]);

        $response = $this->actingAs($admin)
            ->get(route('admin.users.index', ['locale' => 'en']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('admin/users')
            ->where('users.total', 1) // only the admin
        );
    }
}
