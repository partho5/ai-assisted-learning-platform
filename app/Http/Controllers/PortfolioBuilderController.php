<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePortfolioCategoryRequest;
use App\Http\Requests\StorePortfolioProjectRequest;
use App\Http\Requests\StorePortfolioSettingsRequest;
use App\Http\Requests\UpdatePortfolioCategoryRequest;
use App\Http\Requests\UpdatePortfolioProjectRequest;
use App\Models\Portfolio;
use App\Models\PortfolioCategory;
use App\Models\PortfolioMessage;
use App\Models\PortfolioProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioBuilderController extends Controller
{
    /**
     * Dashboard overview: stats + recent messages.
     */
    public function index(Request $request): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);

        $totalProjects = $portfolio->projects()->count();
        $totalVisits = $portfolio->visits()->count();
        $unreadMessages = $portfolio->messages()->where('is_read', false)->count();
        $recentMessages = $portfolio->messages()
            ->latest()
            ->limit(5)
            ->get();
        $visitsLast30 = $portfolio->visits()
            ->where('visited_at', '>=', now()->subDays(30))
            ->count();

        return Inertia::render('dashboard/portfolio-builder/index', [
            'portfolio' => $portfolio,
            'stats' => [
                'totalProjects' => $totalProjects,
                'totalVisits' => $totalVisits,
                'visitsLast30' => $visitsLast30,
                'unreadMessages' => $unreadMessages,
            ],
            'recentMessages' => $recentMessages,
            'portfolioUrl' => $portfolio->is_published
                ? route('public-portfolio.show', ['locale' => app()->getLocale(), 'username' => $request->user()->username])
                : null,
        ]);
    }

    /**
     * Settings page: bio, secondary bio, skill tags, services, publish toggle.
     */
    public function settings(Request $request): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $portfolio->load('skillTags');

        return Inertia::render('dashboard/portfolio-builder/settings', [
            'portfolio' => $portfolio,
        ]);
    }

    public function updateSettings(StorePortfolioSettingsRequest $request): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $validated = $request->validated();

        $portfolio->update([
            'bio' => $validated['bio'],
            'secondary_bio' => $validated['secondary_bio'],
            'services' => $validated['services'],
            'is_published' => $validated['is_published'],
        ]);

        // Sync skill tags
        $portfolio->skillTags()->delete();
        if (! empty($validated['skill_tags'])) {
            foreach ($validated['skill_tags'] as $i => $tag) {
                $portfolio->skillTags()->create([
                    'name' => $tag,
                    'sort_order' => $i,
                ]);
            }
        }

        return back()->with('success', 'Settings saved.');
    }

    /**
     * List/manage projects.
     */
    public function projects(Request $request): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $projects = $portfolio->projects()
            ->with('category')
            ->orderBy('sort_order')
            ->get();
        $categories = $portfolio->categories()->orderBy('sort_order')->get();

        return Inertia::render('dashboard/portfolio-builder/projects/index', [
            'projects' => $projects,
            'categories' => $categories,
        ]);
    }

    public function createProject(Request $request): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $categories = $portfolio->categories()->orderBy('sort_order')->get();

        return Inertia::render('dashboard/portfolio-builder/projects/create', [
            'categories' => $categories,
        ]);
    }

    public function storeProject(StorePortfolioProjectRequest $request): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $validated = $request->validated();

        $slug = Str::slug($validated['title']);
        $baseSlug = $slug;
        $counter = 1;
        while ($portfolio->projects()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $project = $portfolio->projects()->create([
            'category_id' => $validated['category_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'],
            'featured_image' => $validated['featured_image'] ?? null,
            'external_url' => $validated['external_url'] ?? null,
            'tech_tags' => $validated['tech_tags'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
            'is_published' => $validated['is_published'],
            'sort_order' => $portfolio->projects()->max('sort_order') + 1,
        ]);

        // Save media
        if (! empty($validated['media'])) {
            foreach ($validated['media'] as $i => $media) {
                $project->media()->create([
                    'type' => $media['type'],
                    'url' => $media['url'],
                    'sort_order' => $i,
                ]);
            }
        }

        return redirect()->route('portfolio-builder.projects.index', ['locale' => app()->getLocale()])
            ->with('success', 'Project created.');
    }

    public function editProject(Request $request, PortfolioProject $project): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        abort_if($project->portfolio_id !== $portfolio->id, 403);

        $project->load('media');
        $categories = $portfolio->categories()->orderBy('sort_order')->get();

        return Inertia::render('dashboard/portfolio-builder/projects/edit', [
            'project' => $project,
            'categories' => $categories,
        ]);
    }

    public function updateProject(UpdatePortfolioProjectRequest $request, PortfolioProject $project): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        abort_if($project->portfolio_id !== $portfolio->id, 403);

        $validated = $request->validated();

        // Re-generate slug if title changed
        $slug = $project->slug;
        if ($validated['title'] !== $project->title) {
            $slug = Str::slug($validated['title']);
            $baseSlug = $slug;
            $counter = 1;
            while ($portfolio->projects()->where('slug', $slug)->where('id', '!=', $project->id)->exists()) {
                $slug = $baseSlug.'-'.$counter++;
            }
        }

        $project->update([
            'category_id' => $validated['category_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'],
            'featured_image' => $validated['featured_image'] ?? null,
            'external_url' => $validated['external_url'] ?? null,
            'tech_tags' => $validated['tech_tags'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
            'is_published' => $validated['is_published'],
        ]);

        // Sync media: delete old, insert new
        $project->media()->delete();
        if (! empty($validated['media'])) {
            foreach ($validated['media'] as $i => $media) {
                $project->media()->create([
                    'type' => $media['type'],
                    'url' => $media['url'],
                    'sort_order' => $i,
                ]);
            }
        }

        return redirect()->route('portfolio-builder.projects.index', ['locale' => app()->getLocale()])
            ->with('success', 'Project updated.');
    }

    public function destroyProject(Request $request, PortfolioProject $project): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        abort_if($project->portfolio_id !== $portfolio->id, 403);

        $project->delete();

        return back()->with('success', 'Project deleted.');
    }

    /**
     * Reorder projects by updating their sort_order from a client-provided id list.
     */
    public function reorderProjects(Request $request): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);

        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        $ownedIds = $portfolio->projects()->pluck('id')->all();

        foreach ($validated['order'] as $position => $projectId) {
            if (! in_array($projectId, $ownedIds, true)) {
                continue;
            }
            $portfolio->projects()->where('id', $projectId)->update(['sort_order' => $position]);
        }

        return back()->with('success', 'Projects reordered.');
    }

    /**
     * Manage categories (inline CRUD).
     */
    public function categories(Request $request): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $categories = $portfolio->categories()->withCount('projects')->orderBy('sort_order')->get();

        return Inertia::render('dashboard/portfolio-builder/categories', [
            'categories' => $categories,
        ]);
    }

    public function storeCategory(StorePortfolioCategoryRequest $request): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $name = $request->validated()['name'];
        $slug = Str::slug($name);
        $baseSlug = $slug;
        $counter = 1;
        while ($portfolio->categories()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $portfolio->categories()->create([
            'name' => $name,
            'slug' => $slug,
            'sort_order' => $portfolio->categories()->max('sort_order') + 1,
        ]);

        return back()->with('success', 'Category created.');
    }

    public function updateCategory(UpdatePortfolioCategoryRequest $request, PortfolioCategory $category): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        abort_if($category->portfolio_id !== $portfolio->id, 403);

        $name = $request->validated()['name'];
        $slug = Str::slug($name);
        $baseSlug = $slug;
        $counter = 1;
        while ($portfolio->categories()->where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $category->update(['name' => $name, 'slug' => $slug]);

        return back()->with('success', 'Category updated.');
    }

    public function destroyCategory(Request $request, PortfolioCategory $category): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        abort_if($category->portfolio_id !== $portfolio->id, 403);

        $category->delete();

        return back()->with('success', 'Category deleted.');
    }

    /**
     * Messages inbox.
     */
    public function messages(Request $request): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        $messages = $portfolio->messages()
            ->latest()
            ->paginate(20);

        return Inertia::render('dashboard/portfolio-builder/messages/index', [
            'messages' => $messages,
        ]);
    }

    public function showMessage(Request $request, PortfolioMessage $message): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        abort_if($message->portfolio_id !== $portfolio->id, 403);

        if (! $message->is_read) {
            $message->update(['is_read' => true]);
        }

        return Inertia::render('dashboard/portfolio-builder/messages/show', [
            'message' => $message,
        ]);
    }

    public function destroyMessage(Request $request, PortfolioMessage $message): RedirectResponse
    {
        $portfolio = $this->getOrCreatePortfolio($request);
        abort_if($message->portfolio_id !== $portfolio->id, 403);

        $message->delete();

        return redirect()->route('portfolio-builder.messages.index', ['locale' => app()->getLocale()])
            ->with('success', 'Message deleted.');
    }

    /**
     * Analytics page.
     */
    public function analytics(Request $request): Response
    {
        $portfolio = $this->getOrCreatePortfolio($request);

        $totalVisits = $portfolio->visits()->count();
        $visitsLast30Days = $portfolio->visits()
            ->where('visited_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(visited_at) as date, COUNT(*) as count')
            ->groupByRaw('DATE(visited_at)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'count' => $row->count]);

        $topProjects = $portfolio->visits()
            ->whereNotNull('project_id')
            ->selectRaw('project_id, COUNT(*) as visits')
            ->groupBy('project_id')
            ->orderByDesc('visits')
            ->limit(10)
            ->with('project:id,title,slug')
            ->get();

        $recentVisitors = $portfolio->visits()
            ->latest('visited_at')
            ->limit(50)
            ->with('project:id,title,slug')
            ->get()
            ->map(fn ($v) => [
                'date' => $v->visited_at->format('M d, Y H:i'),
                'referer' => $v->referer,
                'page' => $v->project ? $v->project->title : 'Portfolio Home',
            ]);

        $messageCount = $portfolio->messages()->count();

        return Inertia::render('dashboard/portfolio-builder/analytics', [
            'totalVisits' => $totalVisits,
            'visitsLast30Days' => $visitsLast30Days,
            'topProjects' => $topProjects,
            'recentVisitors' => $recentVisitors,
            'messageCount' => $messageCount,
        ]);
    }

    /**
     * Get or auto-create the current user's portfolio.
     */
    private function getOrCreatePortfolio(Request $request): Portfolio
    {
        return Portfolio::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['is_published' => false],
        );
    }
}
