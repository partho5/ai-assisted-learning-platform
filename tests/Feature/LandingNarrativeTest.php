<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The landing and about pages carry the platform's positioning: conventional
 * education rewards memorisation, Jovoc measures real-life output, and two
 * years beats twenty. Crawlers read the server-rendered `meta` prop before any
 * JavaScript runs, so that copy has to be locale-correct at the server.
 */
class LandingNarrativeTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_serves_the_bengali_narrative_to_crawlers(): void
    {
        $this->get('/bn')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('meta.description', trans('meta.home.description', locale: 'bn'))
            )
            ->assertSee('মুখস্থের কোনো মূল্য নেই', false);
    }

    public function test_home_serves_the_english_narrative_to_crawlers(): void
    {
        $this->get('/en')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('meta.description', trans('meta.home.description', locale: 'en'))
            )
            ->assertSee('Real Skills in 2', false);
    }

    public function test_about_page_serves_the_bengali_narrative_to_crawlers(): void
    {
        $this->get('/bn/about-us')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('meta.title', trans('meta.about.title', locale: 'bn'))
                ->where('meta.description', trans('meta.about.description', locale: 'bn'))
            );
    }

    public function test_about_page_serves_the_english_narrative_to_crawlers(): void
    {
        $this->get('/en/about-us')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('meta.description', trans('meta.about.description', locale: 'en'))
            );
    }

    /**
     * Previously the about page shipped no `meta` prop at all, so app.blade.php
     * emitted an empty og:description for the page that explains the platform.
     */
    public function test_about_page_emits_a_non_empty_og_description(): void
    {
        foreach (['bn', 'en'] as $locale) {
            $this->get("/{$locale}/about-us")
                ->assertDontSee('<meta property="og:description" content="">', false);
        }
    }

    public function test_home_meta_no_longer_carries_the_retired_positioning(): void
    {
        foreach (['bn', 'en'] as $locale) {
            $this->get("/{$locale}")
                ->assertDontSee('Learn, Prove, Get Hired', false);
        }
    }

    /**
     * "Jovoc" is an acronym for "Journey of Vocation & Contentment". The
     * expansion is the brand's name, so it stays in Latin script in every
     * locale rather than being translated per locale.
     */
    public function test_the_brand_acronym_is_spelled_out_identically_in_both_locales(): void
    {
        foreach (['bn', 'en'] as $locale) {
            $this->assertSame('Jovoc', trans('meta.brand.name', locale: $locale));
            $this->assertSame('Journey of Vocation & Contentment', trans('meta.brand.expansion', locale: $locale));
        }
    }

    public function test_home_and_about_titles_carry_the_expanded_acronym(): void
    {
        foreach (['bn', 'en'] as $locale) {
            foreach (['meta.home.title', 'meta.about.title'] as $key) {
                $this->assertStringContainsString(
                    'Journey of Vocation & Contentment',
                    trans($key, locale: $locale),
                    "{$key} in {$locale} should spell out the acronym",
                );
            }
        }
    }

    /**
     * The landing nav is anchor-only, so a renamed section id silently produces
     * a dead link rather than a 404. Every anchor must resolve to a real id.
     */
    public function test_every_landing_nav_anchor_targets_a_section_that_exists(): void
    {
        $page = file_get_contents(resource_path('js/pages/welcome.tsx'));
        $layout = file_get_contents(resource_path('js/layouts/public-layout.tsx'));

        preg_match_all("/href: '#([a-z-]+)'/", $layout, $anchors);

        $this->assertNotEmpty($anchors[1], 'Expected the landing nav to contain in-page anchors.');

        foreach ($anchors[1] as $anchor) {
            $this->assertStringContainsString(
                "id=\"{$anchor}\"",
                $page,
                "The landing nav links to #{$anchor} but welcome.tsx has no section with that id.",
            );
        }
    }

    /**
     * The narrative is written per locale rather than translated, so the two
     * descriptions must never collapse onto the same string.
     */
    public function test_each_locale_has_its_own_narrative(): void
    {
        $this->assertNotSame(
            trans('meta.home.description', locale: 'bn'),
            trans('meta.home.description', locale: 'en'),
        );

        $this->assertNotSame(
            trans('meta.about.description', locale: 'bn'),
            trans('meta.about.description', locale: 'en'),
        );
    }
}
