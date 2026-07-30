<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * This is a Bengali-first platform: the bare root points at /bn, and the
     * redirect is permanent because it is the primary signal to search engines
     * that Bengali owns the site root.
     */
    public function test_root_permanently_redirects_to_bengali(): void
    {
        $this->get('/')
            ->assertStatus(301)
            ->assertRedirect('/bn');
    }

    public function test_default_locale_is_bengali(): void
    {
        $this->assertSame('bn', config('app.locale'));
    }

    /**
     * Translation strings still fall back to English, which is the more
     * complete of the two message catalogues.
     */
    public function test_fallback_locale_remains_english(): void
    {
        $this->assertSame('en', config('app.fallback_locale'));
    }

    public function test_bengali_is_listed_first_among_supported_locales(): void
    {
        $this->assertSame('bn', config('app.supported_locales')[0]);
    }

    public function test_english_home_renders(): void
    {
        $this->get('/en')->assertOk();
    }

    public function test_bengali_home_renders(): void
    {
        $this->get('/bn')->assertOk();
    }

    public function test_html_lang_attribute_follows_the_url_locale(): void
    {
        $this->get('/bn')->assertSee('<html lang="bn"', false);
        $this->get('/en')->assertSee('<html lang="en"', false);
    }

    public function test_og_locale_is_emitted_server_side_for_crawlers(): void
    {
        $this->get('/bn')->assertSee('property="og:locale" content="bn_BD"', false);
        $this->get('/en')->assertSee('property="og:locale" content="en_US"', false);
    }

    /**
     * With separate content pools per locale there is no true translation pair,
     * so asserting hreflang alternates would be a lie.
     */
    public function test_no_hreflang_alternates_are_emitted(): void
    {
        $this->get('/bn')->assertDontSee('hreflang', false);
        $this->get('/en')->assertDontSee('hreflang', false);
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
        $this->get('/en/courses')->assertInertia(fn ($page) => $page->where('locale', 'en'));
        $this->get('/bn/courses')->assertInertia(fn ($page) => $page->where('locale', 'bn'));
    }

    public function test_ui_translations_are_shared_in_inertia_props(): void
    {
        $this->get('/en/courses')
            ->assertInertia(fn ($page) => $page
                ->has('ui.nav.dashboard')
                ->has('ui.locale')
            );
    }

    /**
     * Back-office screens are authenticated tooling with no indexable content,
     * so they sit outside the /{locale} prefix entirely.
     */
    public function test_back_office_urls_have_no_locale_prefix(): void
    {
        $this->assertSame('/dashboard', route('dashboard', absolute: false));
        $this->assertSame('/admin/dashboard', route('admin.dashboard', absolute: false));
        $this->assertSame('/mentor/dashboard', route('mentor.dashboard', absolute: false));
    }

    public function test_locale_prefixed_back_office_urls_are_not_routable(): void
    {
        foreach (['/bn/dashboard', '/en/dashboard', '/bn/admin/dashboard', '/en/admin/dashboard'] as $url) {
            $this->get($url)->assertNotFound();
        }
    }

    public function test_dashboard_requires_auth(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
    }

    /**
     * A hand-typed or legacy public URL missing its locale should land on the
     * default locale rather than 404 (or 405, where a POST shares the path).
     */
    public function test_unprefixed_public_paths_redirect_to_the_default_locale(): void
    {
        $locale = config('app.locale');

        foreach (['courses', 'resources', 'forum', 'portfolio-builder', 'about-us', 'contact', 'terms', 'privacy-policy', 'refund-policy'] as $path) {
            $this->get("/{$path}")
                ->assertStatus(301)
                ->assertRedirect("/{$locale}/{$path}");
        }
    }

    /**
     * Back-office copy must not change wording when the public default locale
     * changes, so those screens are pinned to the fallback locale.
     */
    public function test_back_office_uses_a_stable_interface_locale(): void
    {
        $user = User::factory()->learner()->create();

        $this->actingAs($user)->get('/dashboard')->assertOk();

        $this->assertSame(config('app.fallback_locale'), app()->getLocale());
    }

    /**
     * Without a URL default, every route() call on a /{locale} route must pass
     * the parameter or throw UrlGenerationException — a footgun that only shows
     * up at runtime.
     */
    public function test_route_generation_does_not_require_an_explicit_locale(): void
    {
        $this->assertStringEndsWith('/bn/courses', route('courses.index', absolute: false));
        $this->assertStringEndsWith('/bn/resources', route('articles.index', absolute: false));
        $this->assertStringEndsWith('/bn/forum', route('forum.index', absolute: false));
    }

    public function test_route_generation_follows_the_locale_being_browsed(): void
    {
        $this->get('/en');

        $this->assertStringEndsWith('/en/courses', route('courses.index', absolute: false));

        $this->get('/bn');

        $this->assertStringEndsWith('/bn/courses', route('courses.index', absolute: false));
    }

    public function test_an_explicit_locale_still_overrides_the_default(): void
    {
        $this->get('/bn');

        $this->assertStringEndsWith(
            '/en/courses',
            route('courses.index', ['locale' => 'en'], absolute: false)
        );
    }
}
