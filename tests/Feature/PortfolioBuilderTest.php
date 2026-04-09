<?php

namespace Tests\Feature;

use App\Models\Portfolio;
use App\Models\PortfolioCategory;
use App\Models\PortfolioMessage;
use App\Models\PortfolioProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortfolioBuilderTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────────────────────────────────
    // Dashboard overview
    // ──────────────────────────────────────────────────────────────────────────

    public function test_dashboard_requires_auth(): void
    {
        $this->get(route('portfolio-builder.index', ['locale' => 'en']))
            ->assertRedirect();
    }

    public function test_dashboard_creates_portfolio_on_first_visit(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('portfolio-builder.index', ['locale' => 'en']))
            ->assertOk();

        $this->assertDatabaseHas('portfolios', ['user_id' => $user->id]);
    }

    public function test_dashboard_shows_stats(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        PortfolioProject::factory()->count(3)->create(['portfolio_id' => $portfolio->id]);
        PortfolioMessage::factory()->count(2)->create(['portfolio_id' => $portfolio->id, 'is_read' => false]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('dashboard/portfolio-builder/index')
                ->where('stats.totalProjects', 3)
                ->where('stats.unreadMessages', 2)
            );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Settings
    // ──────────────────────────────────────────────────────────────────────────

    public function test_settings_page_loads(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.settings', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('dashboard/portfolio-builder/settings'));
    }

    public function test_update_settings(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->put(route('portfolio-builder.settings.update', ['locale' => 'en']), [
                'bio' => 'Updated bio',
                'secondary_bio' => 'Secondary',
                'services' => ['Web Dev', 'Consulting'],
                'skill_tags' => ['PHP', 'React'],
                'is_published' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('portfolios', [
            'user_id' => $user->id,
            'bio' => 'Updated bio',
            'is_published' => true,
        ]);

        $this->assertDatabaseHas('portfolio_skill_tags', ['name' => 'PHP']);
        $this->assertDatabaseHas('portfolio_skill_tags', ['name' => 'React']);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Categories CRUD
    // ──────────────────────────────────────────────────────────────────────────

    public function test_categories_page_loads(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.categories', ['locale' => 'en']))
            ->assertOk();
    }

    public function test_create_category(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('portfolio-builder.categories.store', ['locale' => 'en']), [
                'name' => 'Web Projects',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('portfolio_categories', [
            'name' => 'Web Projects',
            'slug' => 'web-projects',
        ]);
    }

    public function test_update_category(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        $category = PortfolioCategory::factory()->create(['portfolio_id' => $portfolio->id]);

        $this->actingAs($user)
            ->put(route('portfolio-builder.categories.update', ['locale' => 'en', 'category' => $category->id]), [
                'name' => 'Renamed',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('portfolio_categories', ['id' => $category->id, 'name' => 'Renamed']);
    }

    public function test_delete_category(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        $category = PortfolioCategory::factory()->create(['portfolio_id' => $portfolio->id]);

        $this->actingAs($user)
            ->delete(route('portfolio-builder.categories.destroy', ['locale' => 'en', 'category' => $category->id]))
            ->assertRedirect();

        $this->assertDatabaseMissing('portfolio_categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_another_users_category(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $otherPortfolio = Portfolio::factory()->create();
        $category = PortfolioCategory::factory()->create(['portfolio_id' => $otherPortfolio->id]);

        $this->actingAs($user)
            ->delete(route('portfolio-builder.categories.destroy', ['locale' => 'en', 'category' => $category->id]))
            ->assertForbidden();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Projects CRUD
    // ──────────────────────────────────────────────────────────────────────────

    public function test_projects_page_loads(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.projects.index', ['locale' => 'en']))
            ->assertOk();
    }

    public function test_create_project(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('portfolio-builder.projects.store', ['locale' => 'en']), [
                'title' => 'My Cool Project',
                'description' => '<p>Project description</p>',
                'is_published' => true,
            ])
            ->assertRedirect(route('portfolio-builder.projects.index', ['locale' => 'en']));

        $this->assertDatabaseHas('portfolio_projects', [
            'title' => 'My Cool Project',
            'slug' => 'my-cool-project',
        ]);
    }

    public function test_create_project_with_media(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('portfolio-builder.projects.store', ['locale' => 'en']), [
                'title' => 'Media Project',
                'description' => '<p>With media</p>',
                'is_published' => true,
                'media' => [
                    ['type' => 'image', 'url' => 'https://res.cloudinary.com/demo/image/upload/sample.jpg'],
                    ['type' => 'youtube', 'url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('portfolio_project_media', 2);
    }

    public function test_update_project(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        $project = PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id]);

        $this->actingAs($user)
            ->put(route('portfolio-builder.projects.update', ['locale' => 'en', 'project' => $project->id]), [
                'title' => 'Updated Title',
                'description' => '<p>Updated</p>',
                'is_published' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('portfolio_projects', [
            'id' => $project->id,
            'title' => 'Updated Title',
            'is_published' => false,
        ]);
    }

    public function test_delete_project(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        $project = PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id]);

        $this->actingAs($user)
            ->delete(route('portfolio-builder.projects.destroy', ['locale' => 'en', 'project' => $project->id]))
            ->assertRedirect();

        $this->assertDatabaseMissing('portfolio_projects', ['id' => $project->id]);
    }

    public function test_cannot_edit_another_users_project(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $otherPortfolio = Portfolio::factory()->create();
        $project = PortfolioProject::factory()->create(['portfolio_id' => $otherPortfolio->id]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.projects.edit', ['locale' => 'en', 'project' => $project->id]))
            ->assertForbidden();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Messages
    // ──────────────────────────────────────────────────────────────────────────

    public function test_messages_page_loads(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.messages.index', ['locale' => 'en']))
            ->assertOk();
    }

    public function test_view_message_marks_it_read(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        $message = PortfolioMessage::factory()->create(['portfolio_id' => $portfolio->id, 'is_read' => false]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.messages.show', ['locale' => 'en', 'message' => $message->id]))
            ->assertOk();

        $this->assertTrue($message->fresh()->is_read);
    }

    public function test_delete_message(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        $message = PortfolioMessage::factory()->create(['portfolio_id' => $portfolio->id]);

        $this->actingAs($user)
            ->delete(route('portfolio-builder.messages.destroy', ['locale' => 'en', 'message' => $message->id]))
            ->assertRedirect();

        $this->assertDatabaseMissing('portfolio_messages', ['id' => $message->id]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Analytics
    // ──────────────────────────────────────────────────────────────────────────

    public function test_analytics_page_loads(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('portfolio-builder.analytics', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('dashboard/portfolio-builder/analytics'));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Slug collision handling
    // ──────────────────────────────────────────────────────────────────────────

    public function test_duplicate_project_title_gets_unique_slug(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id]);
        PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'slug' => 'my-project']);

        $this->actingAs($user)
            ->post(route('portfolio-builder.projects.store', ['locale' => 'en']), [
                'title' => 'My Project',
                'description' => '<p>Another project</p>',
                'is_published' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('portfolio_projects', ['slug' => 'my-project-1']);
    }
}
