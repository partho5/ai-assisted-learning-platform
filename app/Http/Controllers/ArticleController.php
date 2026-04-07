<?php

namespace App\Http\Controllers;

use App\Enums\ArticleStatus;
use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Models\Article;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * Get all unique tags used across articles.
     */
    public function tags(): \Illuminate\Http\JsonResponse
    {
        $tags = Article::query()
            ->whereNotNull('tags')
            ->pluck('tags')
            ->flatMap(fn ($tags) => is_array($tags) ? $tags : [])
            ->unique()
            ->sort()
            ->values();

        return response()->json(['tags' => $tags]);
    }

    /**
     * Role-aware index:
     *   mentor/admin → their own articles (all statuses)
     *   everyone else → published articles only
     *
     * NOTE: Public URL is /{locale}/resources — model is Article.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user && ($user->isMentor() || $user->isAdmin())) {
            return $this->authorIndex($user, $request);
        }

        return $this->publicIndex($request);
    }

    private function authorIndex(\App\Models\User $user, Request $request): Response
    {
        $query = $user->isAdmin()
            ? Article::query()->with(['author:id,name,username', 'category'])
            : Article::query()->where('author_id', $user->id)->with('category');

        $articles = $query
            ->latest()
            ->get(['id', 'author_id', 'category_id', 'title', 'slug', 'status', 'read_time_minutes', 'published_at', 'created_at', 'updated_at']);

        return Inertia::render('articles/index', [
            'articles' => $articles,
            'isAuthorView' => true,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    private function publicIndex(Request $request): Response
    {
        $query = Article::query()
            ->published()
            ->with(['author:id,name,username,avatar,headline', 'category'])
            ->latest('published_at');

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->input('category')));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereRaw("search_vector @@ plainto_tsquery('english', ?)", [$search]);
        }

        return Inertia::render('articles/index', [
            'articles' => $query->paginate(12)->withQueryString(),
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => $request->only(['category', 'search']),
            'isAuthorView' => false,
        ]);
    }

    public function show(Article $article): Response
    {
        if (! $article->isPublished()) {
            abort(404);
        }

        $article->load('author:id,name,username,avatar,headline,bio,social_links,created_at', 'category');

        $description = $article->excerpt
            ? mb_substr(trim($article->excerpt), 0, 160)
            : mb_substr(trim(strip_tags($article->body ?? '')), 0, 160);

        return Inertia::render('articles/show', [
            'article' => $article,
            'ogUrl' => url()->current(),
            'appUrl' => rtrim(config('app.url'), '/'),
            'schemaTypes' => [
                'howTo' => $article->detectsHowTo(),
                'faq' => $article->detectsFaq(),
            ],
            'meta' => [
                'title' => $article->title.' | '.config('app.name'),
                'description' => $description,
                'image' => $article->featured_image ?: config('seo.og_image'),
                'url' => url()->current(),
            ],
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Article::class);

        return Inertia::render('articles/create', [
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'statuses' => collect(ArticleStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => ucfirst($s->value)]),
        ]);
    }

    public function store(StoreArticleRequest $request): RedirectResponse
    {
        Gate::authorize('create', Article::class);

        $data = $request->validated();
        $data['author_id'] = auth()->id();
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['title']);

        if ($data['body']) {
            $data['read_time_minutes'] = Article::calculateReadTime($data['body']);
        }

        if (($data['status'] ?? '') === ArticleStatus::Published->value) {
            $data['published_at'] = Carbon::now();
        } elseif (($data['status'] ?? '') === ArticleStatus::Scheduled->value) {
            $data['published_at'] = Carbon::parse($data['publish_at']);
        }

        unset($data['publish_at']);

        $article = Article::create($data);

        if ($article->isPublished()) {
            return redirect()->route('articles.show', ['locale' => app()->getLocale(), 'article' => $article->slug])
                ->with('success', 'Article published.');
        }

        return redirect()->route('articles.edit', ['locale' => app()->getLocale(), 'article' => $article->slug])
            ->with('success', $article->status === ArticleStatus::Scheduled ? 'Article scheduled.' : 'Draft saved.');
    }

    public function edit(Article $article): Response
    {
        Gate::authorize('update', $article);

        return Inertia::render('articles/edit', [
            'article' => $article->load('category'),
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'statuses' => collect(ArticleStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => ucfirst($s->value)]),
        ]);
    }

    public function preview(Article $article): Response
    {
        Gate::authorize('update', $article);

        $article->load('author:id,name,username,avatar,headline,bio,social_links,created_at', 'category');

        $description = $article->excerpt
            ? mb_substr(trim($article->excerpt), 0, 160)
            : mb_substr(trim(strip_tags($article->body ?? '')), 0, 160);

        return Inertia::render('articles/show', [
            'article' => $article,
            'isPreview' => true,
            'ogUrl' => url()->current(),
            'appUrl' => rtrim(config('app.url'), '/'),
            'schemaTypes' => [
                'howTo' => $article->detectsHowTo(),
                'faq' => $article->detectsFaq(),
            ],
            'meta' => [
                'title' => $article->title.' | '.config('app.name'),
                'description' => $description,
                'image' => $article->featured_image ?: config('seo.og_image'),
                'url' => url()->current(),
            ],
        ]);
    }

    public function update(UpdateArticleRequest $request, Article $article): RedirectResponse
    {
        Gate::authorize('update', $article);

        $data = $request->validated();

        if ($data['body']) {
            $data['read_time_minutes'] = Article::calculateReadTime($data['body']);
        }

        if (($data['status'] ?? '') === ArticleStatus::Published->value) {
            // Only stamp published_at when first transitioning to published
            if ($article->status !== ArticleStatus::Published) {
                $data['published_at'] = Carbon::now();
            }
        } elseif (($data['status'] ?? '') === ArticleStatus::Scheduled->value) {
            $data['published_at'] = Carbon::parse($data['publish_at']);
        }

        unset($data['publish_at']);

        $article->update($data);

        $fresh = $article->fresh();

        if ($fresh->isPublished()) {
            return redirect()->route('articles.show', ['locale' => app()->getLocale(), 'article' => $article->slug])
                ->with('success', 'Article updated.');
        }

        return redirect()->route('articles.edit', ['locale' => app()->getLocale(), 'article' => $article->slug])
            ->with('success', $fresh->status === ArticleStatus::Scheduled ? 'Article scheduled.' : 'Draft saved.');
    }

    public function destroy(Article $article): RedirectResponse
    {
        Gate::authorize('delete', $article);

        $article->delete();

        return redirect()->route('articles.index', ['locale' => app()->getLocale()])
            ->with('success', 'Article deleted.');
    }

    private function uniqueSlug(string $value): string
    {
        $base = Str::slug($value);
        $slug = $base;
        $i = 2;

        while (Article::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
