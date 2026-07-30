<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Course;
use App\Models\ForumCategory;
use App\Models\ForumThread;
use App\Models\Portfolio;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class SitemapController extends Controller
{
    /**
     * Static pages exist in every locale — they are UI chrome, not content
     * records — so each is emitted once per locale as its own self-canonical URL.
     *
     * @var array<string, array{changefreq: string, priority: string}>
     */
    private const STATIC_PAGES = [
        '' => ['changefreq' => 'weekly', 'priority' => '1.0'],
        'courses' => ['changefreq' => 'daily', 'priority' => '0.9'],
        'resources' => ['changefreq' => 'daily', 'priority' => '0.8'],
        'forum' => ['changefreq' => 'daily', 'priority' => '0.8'],
        'portfolio-builder' => ['changefreq' => 'monthly', 'priority' => '0.7'],
        'about-us' => ['changefreq' => 'monthly', 'priority' => '0.5'],
        'contact' => ['changefreq' => 'yearly', 'priority' => '0.4'],
        'privacy-policy' => ['changefreq' => 'yearly', 'priority' => '0.3'],
        'terms' => ['changefreq' => 'yearly', 'priority' => '0.3'],
        'refund-policy' => ['changefreq' => 'yearly', 'priority' => '0.3'],
    ];

    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');

        /**
         * Content is single-language: each record is emitted only under its own
         * locale, matching the canonical URL that EnsureContentLocale enforces.
         * No hreflang alternates are emitted — with separate content pools there
         * is no true translation pair to assert.
         */
        $urls = [
            ...$this->staticUrls($baseUrl),
            ...$this->courseUrls($baseUrl),
            ...$this->articleUrls($baseUrl),
            ...$this->forumUrls($baseUrl),
            ...$this->profileUrls($baseUrl),
        ];

        $xml = view('sitemap', compact('urls'))->render();

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function staticUrls(string $baseUrl): array
    {
        // Fixed date so crawlers don't think these change every request
        $staticLastmod = '2026-03-01T00:00:00+00:00';

        $latestCourse = Course::query()->published()->notLinkOnly()->max('updated_at');
        $courseLastmod = $latestCourse ? Carbon::parse($latestCourse)->toAtomString() : $staticLastmod;

        $latestArticle = Article::query()->published()->max('updated_at');
        $articleLastmod = $latestArticle ? Carbon::parse($latestArticle)->toAtomString() : $staticLastmod;

        $latestThread = ForumThread::query()->max('last_activity_at');
        $forumLastmod = $latestThread ? Carbon::parse($latestThread)->toAtomString() : $staticLastmod;

        $lastmods = [
            'courses' => $courseLastmod,
            'resources' => $articleLastmod,
            'forum' => $forumLastmod,
        ];

        $urls = [];

        foreach ($this->locales() as $index => $locale) {
            foreach (self::STATIC_PAGES as $path => $meta) {
                $urls[] = [
                    'loc' => $this->localizedUrl($baseUrl, $locale, $path),
                    'lastmod' => $lastmods[$path] ?? $staticLastmod,
                    'changefreq' => $meta['changefreq'],
                    /** The primary locale keeps the stated priority; secondary locales step down. */
                    'priority' => $index === 0 ? $meta['priority'] : $this->stepDown($meta['priority']),
                ];
            }
        }

        return $urls;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function courseUrls(string $baseUrl): array
    {
        $urls = [];

        $courses = Course::query()
            ->published()
            ->notLinkOnly()
            ->select(['id', 'slug', 'language', 'updated_at'])
            ->get();

        foreach ($courses as $course) {
            $locale = $course->contentLanguage()->value;

            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/courses/{$course->slug}",
                'lastmod' => $course->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ];

            // One learn entry point per course (first free resource only — the rest are scroll positions)
            $firstFreeResource = Resource::query()
                ->whereHas('module', fn ($q) => $q->where('course_id', $course->id))
                ->where('is_free', true)
                ->orderBy('id')
                ->select(['id', 'updated_at'])
                ->first();

            if ($firstFreeResource) {
                $urls[] = [
                    'loc' => "{$baseUrl}/{$locale}/courses/{$course->slug}/learn/{$firstFreeResource->id}",
                    'lastmod' => $firstFreeResource->updated_at->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }
        }

        return $urls;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function articleUrls(string $baseUrl): array
    {
        return Article::query()
            ->published()
            ->select(['id', 'slug', 'language', 'updated_at'])
            ->get()
            ->map(fn (Article $article) => [
                'loc' => "{$baseUrl}/{$article->contentLanguage()->value}/resources/{$article->slug}",
                'lastmod' => $article->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ])
            ->all();
    }

    /**
     * Forum categories are language-neutral taxonomy, so a category is emitted
     * under a locale only when it actually holds threads in that language —
     * otherwise the URL would be an empty listing.
     *
     * @return array<int, array<string, string>>
     */
    private function forumUrls(string $baseUrl): array
    {
        $urls = [];
        $categories = ForumCategory::query()->select(['id', 'slug', 'updated_at'])->get();

        foreach ($this->locales() as $locale) {
            foreach ($categories as $category) {
                $threadCount = ForumThread::query()
                    ->where('category_id', $category->id)
                    ->where('language', $locale)
                    ->count();

                if ($threadCount === 0) {
                    continue;
                }

                $urls[] = [
                    'loc' => "{$baseUrl}/{$locale}/forum/{$category->slug}",
                    'lastmod' => $category->updated_at->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.7',
                ];
            }
        }

        $threads = ForumThread::query()
            ->with('category:id,slug')
            ->select(['id', 'slug', 'category_id', 'language', 'last_activity_at'])
            ->get();

        foreach ($threads as $thread) {
            $urls[] = [
                'loc' => "{$baseUrl}/{$thread->contentLanguage()->value}/forum/{$thread->category->slug}/{$thread->slug}",
                'lastmod' => $thread->last_activity_at?->toAtomString() ?? '2026-03-01T00:00:00+00:00',
                'changefreq' => 'daily',
                'priority' => '0.9',
            ];
        }

        return $urls;
    }

    /**
     * Profiles and portfolios carry no language of their own — they are a
     * person's identity hub — so they are emitted under the primary locale only.
     *
     * @return array<int, array<string, string>>
     */
    private function profileUrls(string $baseUrl): array
    {
        $locale = $this->primaryLocale();
        $urls = [];

        $users = User::query()
            ->where('portfolio_visibility', 'public')
            ->whereNotNull('username')
            ->select(['username', 'updated_at'])
            ->get();

        foreach ($users as $user) {
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/u/{$user->username}",
                'lastmod' => $user->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.6',
            ];
        }

        $portfolios = Portfolio::query()
            ->where('is_published', true)
            ->with([
                'user:id,username',
                'projects' => fn ($q) => $q->where('is_published', true)->select(['id', 'portfolio_id', 'slug', 'updated_at']),
            ])
            ->select(['id', 'user_id', 'updated_at'])
            ->whereHas('user', fn ($q) => $q->whereNotNull('username'))
            ->get();

        foreach ($portfolios as $portfolio) {
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/u/{$portfolio->user->username}/portfolio",
                'lastmod' => $portfolio->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ];

            foreach ($portfolio->projects as $project) {
                $urls[] = [
                    'loc' => "{$baseUrl}/{$locale}/u/{$portfolio->user->username}/portfolio/{$project->slug}",
                    'lastmod' => $project->updated_at->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }
        }

        return $urls;
    }

    /**
     * Supported locales with the application default first.
     *
     * @return array<int, string>
     */
    private function locales(): array
    {
        $locales = config('app.supported_locales', ['bn', 'en']);
        $primary = $this->primaryLocale();

        return [$primary, ...array_values(array_diff($locales, [$primary]))];
    }

    private function primaryLocale(): string
    {
        return config('app.locale');
    }

    private function localizedUrl(string $baseUrl, string $locale, string $path): string
    {
        return $path === ''
            ? "{$baseUrl}/{$locale}/"
            : "{$baseUrl}/{$locale}/{$path}";
    }

    /**
     * Nudge a priority down one notch for secondary locales.
     */
    private function stepDown(string $priority): string
    {
        return number_format(max(0.1, (float) $priority - 0.1), 1);
    }
}
