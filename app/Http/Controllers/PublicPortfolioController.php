<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendPortfolioMessageRequest;
use App\Mail\PortfolioContactMail;
use App\Models\Portfolio;
use App\Models\PortfolioVisit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PublicPortfolioController extends Controller
{
    /**
     * Show a user's public portfolio.
     */
    public function show(Request $request, string $username): Response
    {
        $user = User::where('username', $username)->firstOrFail();
        $portfolio = Portfolio::where('user_id', $user->id)
            ->where('is_published', true)
            ->firstOrFail();

        $portfolio->load(['skillTags', 'categories']);

        $projectsQuery = $portfolio->projects()
            ->where('is_published', true)
            ->with(['media', 'category'])
            ->orderBy('sort_order');

        $categorySlug = $request->query('category');
        $activeCategory = null;
        if ($categorySlug) {
            $activeCategory = $portfolio->categories()->where('slug', $categorySlug)->first();
            if ($activeCategory) {
                $projectsQuery->where('category_id', $activeCategory->id);
            }
        }

        $projects = $projectsQuery->get();

        // Track visit
        $this->trackVisit($portfolio, null, $request);

        return Inertia::render('u/portfolio/show', [
            'owner' => [
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'headline' => $user->headline,
            ],
            'portfolio' => $portfolio,
            'projects' => $projects,
            'categories' => $portfolio->categories,
            'activeCategory' => $activeCategory,
        ]);
    }

    /**
     * Single project page (SEO-optimized).
     */
    public function showProject(Request $request, string $username, string $projectSlug): Response
    {
        $user = User::where('username', $username)->firstOrFail();
        $portfolio = Portfolio::where('user_id', $user->id)
            ->where('is_published', true)
            ->firstOrFail();

        $project = $portfolio->projects()
            ->where('slug', $projectSlug)
            ->with(['media', 'category'])
            ->firstOrFail();

        if (! $project->is_published) {
            return Inertia::render('u/portfolio/unavailable', [
                'owner' => [
                    'name' => $user->name,
                    'username' => $user->username,
                ],
                'portfolioUrl' => route('public-portfolio.show', [
                    'locale' => app()->getLocale(),
                    'username' => $user->username,
                ]),
            ]);
        }

        // Track visit
        $this->trackVisit($portfolio, $project->id, $request);

        $portfolio->load('skillTags');

        return Inertia::render('u/portfolio/project', [
            'owner' => [
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'headline' => $user->headline,
            ],
            'portfolio' => $portfolio,
            'project' => $project,
            'categories' => $portfolio->categories()->get(),
        ]);
    }

    /**
     * Handle contact form submission.
     */
    public function sendMessage(SendPortfolioMessageRequest $request, string $username): RedirectResponse
    {
        $user = User::where('username', $username)->firstOrFail();
        $portfolio = Portfolio::where('user_id', $user->id)
            ->where('is_published', true)
            ->firstOrFail();

        $validated = $request->validated();

        $message = $portfolio->messages()->create([
            'sender_name' => $validated['sender_name'],
            'sender_email' => $validated['sender_email'],
            'subject' => $validated['subject'] ?? null,
            'body' => $validated['body'],
        ]);

        Mail::send(new PortfolioContactMail($user, $message));

        return back()->with('success', 'I will get back to you via email.');
    }

    private function trackVisit(Portfolio $portfolio, ?int $projectId, Request $request): void
    {
        PortfolioVisit::create([
            'portfolio_id' => $portfolio->id,
            'project_id' => $projectId,
            'ip_hash' => hash('sha256', $request->ip().config('app.key')),
            'user_agent' => $request->userAgent() ? Str::limit($request->userAgent(), 500, '') : null,
            'referer' => $request->header('referer') ? Str::limit($request->header('referer'), 500, '') : null,
            'visited_at' => now(),
        ]);
    }
}
