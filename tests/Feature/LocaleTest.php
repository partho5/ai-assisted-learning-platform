<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_redirects_to_default_locale(): void
    {
        $this->get('/')->assertRedirect('/en');
    }

    public function test_english_home_renders(): void
    {
        $this->get('/en')->assertOk();
    }

    public function test_bengali_home_renders(): void
    {
        $this->get('/bn')->assertOk();
    }

    public function test_invalid_locale_returns_404(): void
    {
        $this->get('/fr')->assertNotFound();
        $this->get('/de/dashboard')->assertNotFound();
    }

    public function test_locale_is_set_from_url_segment(): void
    {
        $this->get('/en')->assertOk();

        $this->assertSame('en', app()->getLocale());

        $this->get('/bn')->assertOk();

        $this->assertSame('bn', app()->getLocale());
    }

    public function test_locale_is_shared_in_inertia_props(): void
    {
        $user = User::factory()->learner()->create();

        $this->actingAs($user)
            ->get('/en/dashboard')
            ->assertInertia(fn ($page) => $page->where('locale', 'en'));

        $this->actingAs($user)
            ->get('/bn/dashboard')
            ->assertInertia(fn ($page) => $page->where('locale', 'bn'));
    }

    public function test_ui_translations_are_shared_in_inertia_props(): void
    {
        $user = User::factory()->learner()->create();

        $this->actingAs($user)
            ->get('/en/dashboard')
            ->assertInertia(fn ($page) => $page
                ->has('ui.nav.dashboard')
                ->has('ui.locale')
            );
    }

    public function test_dashboard_requires_auth_with_locale_prefix(): void
    {
        $this->get('/en/dashboard')->assertRedirect(route('login'));
    }
}
