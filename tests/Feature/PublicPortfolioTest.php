<?php

namespace Tests\Feature;

use App\Models\Portfolio;
use App\Models\PortfolioCategory;
use App\Models\PortfolioProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PublicPortfolioTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────────────────────────────────
    // Landing page
    // ──────────────────────────────────────────────────────────────────────────

    public function test_landing_page_loads(): void
    {
        $this->get(route('portfolio-builder.landing'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('portfolio-landing'));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Public portfolio show
    // ──────────────────────────────────────────────────────────────────────────

    public function test_published_portfolio_is_visible(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);
        PortfolioProject::factory()->count(2)->create(['portfolio_id' => $portfolio->id, 'is_published' => true]);

        $this->get(route('public-portfolio.show', ['locale' => 'en', 'username' => $user->username]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('u/portfolio/show')
                ->has('projects', 2)
            );
    }

    public function test_unpublished_portfolio_returns_404(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => false]);

        $this->get(route('public-portfolio.show', ['locale' => 'en', 'username' => $user->username]))
            ->assertNotFound();
    }

    public function test_nonexistent_user_returns_404(): void
    {
        $this->get(route('public-portfolio.show', ['locale' => 'en', 'username' => 'nobody']))
            ->assertNotFound();
    }

    public function test_category_filter_works(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);
        $cat = PortfolioCategory::factory()->create(['portfolio_id' => $portfolio->id, 'slug' => 'web']);

        PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'category_id' => $cat->id, 'is_published' => true]);
        PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'category_id' => null, 'is_published' => true]);

        $this->get(route('public-portfolio.show', ['locale' => 'en', 'username' => $user->username]).'?category=web')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects', 1));
    }

    public function test_unpublished_projects_are_hidden(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);
        PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'is_published' => true]);
        PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'is_published' => false]);

        $this->get(route('public-portfolio.show', ['locale' => 'en', 'username' => $user->username]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('projects', 1));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Single project page
    // ──────────────────────────────────────────────────────────────────────────

    public function test_single_project_page_loads(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);
        $project = PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'is_published' => true]);

        $this->get(route('public-portfolio.project', ['locale' => 'en', 'username' => $user->username, 'project_slug' => $project->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('u/portfolio/project')
                ->where('project.title', $project->title)
            );
    }

    public function test_unpublished_project_shows_unavailable_page(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);
        $project = PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'is_published' => false]);

        $this->get(route('public-portfolio.project', ['locale' => 'en', 'username' => $user->username, 'project_slug' => $project->slug]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('u/portfolio/unavailable')
                ->has('owner')
                ->has('portfolioUrl')
            );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Contact form
    // ──────────────────────────────────────────────────────────────────────────

    public function test_contact_form_sends_message(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);

        $this->post(route('public-portfolio.contact', ['locale' => 'en', 'username' => $user->username]), [
            'sender_name' => 'Jane Doe',
            'sender_email' => 'jane@example.com',
            'subject' => 'Hello',
            'body' => 'I love your portfolio!',
            'confirm_human' => true,
            'honeypot' => '',
        ])
            ->assertRedirect();

        $this->assertDatabaseHas('portfolio_messages', [
            'sender_name' => 'Jane Doe',
            'sender_email' => 'jane@example.com',
        ]);

        Mail::assertQueued(\App\Mail\PortfolioContactMail::class);
    }

    public function test_contact_form_rejects_without_confirm_human(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);

        $this->post(route('public-portfolio.contact', ['locale' => 'en', 'username' => $user->username]), [
            'sender_name' => 'Jane Doe',
            'sender_email' => 'jane@example.com',
            'body' => 'Spam attempt',
            'confirm_human' => false,
            'honeypot' => '',
        ])
            ->assertSessionHasErrors('confirm_human');
    }

    public function test_contact_form_rejects_honeypot(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);

        $this->post(route('public-portfolio.contact', ['locale' => 'en', 'username' => $user->username]), [
            'sender_name' => 'Bot',
            'sender_email' => 'bot@example.com',
            'body' => 'I am a bot',
            'confirm_human' => true,
            'honeypot' => 'gotcha',
        ])
            ->assertSessionHasErrors('honeypot');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Visit tracking
    // ──────────────────────────────────────────────────────────────────────────

    public function test_portfolio_visit_is_tracked(): void
    {
        $user = User::factory()->create();
        Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);

        $this->get(route('public-portfolio.show', ['locale' => 'en', 'username' => $user->username]));

        $this->assertDatabaseCount('portfolio_visits', 1);
        $this->assertDatabaseHas('portfolio_visits', ['project_id' => null]);
    }

    public function test_project_visit_is_tracked(): void
    {
        $user = User::factory()->create();
        $portfolio = Portfolio::factory()->create(['user_id' => $user->id, 'is_published' => true]);
        $project = PortfolioProject::factory()->create(['portfolio_id' => $portfolio->id, 'is_published' => true]);

        $this->get(route('public-portfolio.project', ['locale' => 'en', 'username' => $user->username, 'project_slug' => $project->slug]));

        $this->assertDatabaseHas('portfolio_visits', ['project_id' => $project->id]);
    }
}
