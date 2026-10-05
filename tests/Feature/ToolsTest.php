<?php

namespace Tests\Feature;

use App\Services\Tools\ToolRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ToolsTest extends TestCase
{
    use RefreshDatabase;

    private const SLUG = 'bold-text-generator-editor';

    public function test_guest_can_view_tools_index(): void
    {
        $this->get('/en/tools')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('tools/index')
                ->has('tools', 1)
                ->where('tools.0.slug', self::SLUG)
                ->has('tools.0.name')
                ->has('tools.0.description')
                ->has('meta.title')
                ->has('meta.description'));
    }

    public function test_guest_can_view_bold_text_tool(): void
    {
        $this->get('/en/tools/'.self::SLUG)
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('tools/bold-text-generator-editor')
                ->has('meta.title')
                ->has('meta.description')
                ->where('meta.url', url('/en/tools/'.self::SLUG)));
    }

    public function test_unknown_tool_returns_not_found(): void
    {
        $this->get('/en/tools/unknown')->assertNotFound();
    }

    public function test_bengali_tools_routes_return_not_found(): void
    {
        $this->get('/bn/tools')->assertNotFound();
        $this->get('/bn/tools/'.self::SLUG)->assertNotFound();
    }

    public function test_bare_tools_paths_redirect_permanently_to_english(): void
    {
        $this->get('/tools')->assertRedirect('/en/tools')->assertStatus(301);

        $this->get('/tools/'.self::SLUG)
            ->assertRedirect('/en/tools/'.self::SLUG)
            ->assertStatus(301);
    }

    public function test_sitemap_lists_english_tool_urls_only(): void
    {
        $response = $this->get('/sitemap.xml')->assertOk();

        $response->assertSee('/en/tools</loc>', false);
        $response->assertSee('/en/tools/'.self::SLUG.'</loc>', false);
        $response->assertDontSee('/bn/tools', false);
    }

    public function test_registry_finds_known_tool_and_returns_null_for_unknown(): void
    {
        $registry = app(ToolRegistry::class);

        $this->assertSame(self::SLUG, $registry->find(self::SLUG)?->slug());
        $this->assertNull($registry->find('unknown'));
    }
}
