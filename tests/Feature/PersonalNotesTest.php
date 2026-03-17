<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PersonalNotesTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_notes_page(): void
    {
        $this->actingAs(User::factory()->learner()->create())
            ->get(route('notes.edit', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('notes/edit'));
    }

    public function test_mentor_can_view_notes_page(): void
    {
        $this->actingAs(User::factory()->mentor()->create())
            ->get(route('notes.edit', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('notes/edit'));
    }

    public function test_admin_can_view_notes_page(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('notes.edit', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('notes/edit'));
    }

    public function test_guest_cannot_view_notes_page(): void
    {
        $this->get(route('notes.edit', ['locale' => 'en']))
            ->assertRedirect();
    }

    public function test_user_can_save_notes(): void
    {
        $user = User::factory()->learner()->create();

        $this->actingAs($user)
            ->patch(route('notes.update', ['locale' => 'en']), [
                'personal_notes' => '<p>My private notes.</p>',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'personal_notes' => '<p>My private notes.</p>',
        ]);
    }

    public function test_user_can_clear_notes(): void
    {
        $user = User::factory()->learner()->create(['personal_notes' => '<p>Old content.</p>']);

        $this->actingAs($user)
            ->patch(route('notes.update', ['locale' => 'en']), [
                'personal_notes' => null,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'personal_notes' => null,
        ]);
    }

    public function test_notes_page_serves_existing_notes(): void
    {
        $user = User::factory()->learner()->create(['personal_notes' => '<p>Saved content.</p>']);

        $this->actingAs($user)
            ->get(route('notes.edit', ['locale' => 'en']))
            ->assertInertia(fn ($page) => $page
                ->component('notes/edit')
                ->where('personal_notes', '<p>Saved content.</p>')
            );
    }

    public function test_notes_are_not_shared_between_users(): void
    {
        $userA = User::factory()->learner()->create(['personal_notes' => '<p>User A notes.</p>']);
        $userB = User::factory()->learner()->create(['personal_notes' => '<p>User B notes.</p>']);

        $this->actingAs($userA)
            ->get(route('notes.edit', ['locale' => 'en']))
            ->assertInertia(fn ($page) => $page
                ->where('personal_notes', '<p>User A notes.</p>')
            );

        $this->actingAs($userB)
            ->get(route('notes.edit', ['locale' => 'en']))
            ->assertInertia(fn ($page) => $page
                ->where('personal_notes', '<p>User B notes.</p>')
            );
    }

    public function test_personal_notes_not_exposed_on_public_profile(): void
    {
        $user = User::factory()->learner()->create([
            'personal_notes' => '<p>Secret stuff.</p>',
            'portfolio_visibility' => 'public',
        ]);

        $response = $this->get(route('portfolio.show', ['locale' => 'en', 'username' => $user->username]));

        $response->assertOk();
        $this->assertStringNotContainsString('Secret stuff', $response->content());
    }
}
