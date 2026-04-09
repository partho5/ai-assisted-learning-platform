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
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');

        $urls = [];

        // Static pages — use a fixed date so crawlers don't think they change every request
        $staticLastmod = '2026-03-01T00:00:00+00:00';

        // /en/ home and static pages — /bn/ is only for Bengali-audience courses, not a locale mirror
        $latestCourse = Course::query()->published()->max('updated_at');
        $courseLastmod = $latestCourse ? Carbon::parse($latestCourse)->toAtomString() : $staticLastmod;

        $urls[] = ['loc' => "{$baseUrl}/en/", 'lastmod' => $staticLastmod, 'changefreq' => 'weekly', 'priority' => '1.0'];
        $urls[] = ['loc' => "{$baseUrl}/en/courses", 'lastmod' => $courseLastmod, 'changefreq' => 'daily', 'priority' => '0.9'];
        $urls[] = ['loc' => "{$baseUrl}/bn/courses", 'lastmod' => $courseLastmod, 'changefreq' => 'daily', 'priority' => '0.9'];
        $urls[] = [
            'loc' => "{$baseUrl}/en/resources",
            'lastmod' => ($latestArticle = Article::query()->published()->max('updated_at')) ? Carbon::parse($latestArticle)->toAtomString() : $staticLastmod,
            'changefreq' => 'daily',
            'priority' => '0.8',
        ];
        $urls[] = ['loc' => "{$baseUrl}/en/portfolio-builder", 'lastmod' => $staticLastmod, 'changefreq' => 'monthly', 'priority' => '0.7'];
        $urls[] = ['loc' => "{$baseUrl}/en/about-us", 'lastmod' => $staticLastmod, 'changefreq' => 'monthly', 'priority' => '0.5'];
        $urls[] = ['loc' => "{$baseUrl}/en/contact", 'lastmod' => $staticLastmod, 'changefreq' => 'yearly', 'priority' => '0.4'];
        $urls[] = ['loc' => "{$baseUrl}/en/privacy-policy", 'lastmod' => $staticLastmod, 'changefreq' => 'yearly', 'priority' => '0.3'];
        $urls[] = ['loc' => "{$baseUrl}/en/terms", 'lastmod' => $staticLastmod, 'changefreq' => 'yearly', 'priority' => '0.3'];
        $urls[] = ['loc' => "{$baseUrl}/en/refund-policy", 'lastmod' => $staticLastmod, 'changefreq' => 'yearly', 'priority' => '0.3'];

        // Published courses — each course under its own language locale only
        $courses = Course::query()
            ->published()
            ->select(['id', 'slug', 'language', 'updated_at'])
            ->get();

        foreach ($courses as $course) {
            $locale = $course->language->value;
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

        // Published articles — canonical URL always under /en/ (all content is English)
        $articles = Article::query()
            ->published()
            ->select(['id', 'slug', 'updated_at'])
            ->get();

        foreach ($articles as $article) {
            $urls[] = [
                'loc' => "{$baseUrl}/en/resources/{$article->slug}",
                'lastmod' => $article->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ];
        }

        // Forum index (en only)
        $latestThreadDate = ForumThread::query()->max('last_activity_at');
        $urls[] = [
            'loc' => "{$baseUrl}/en/forum",
            'lastmod' => $latestThreadDate ? Carbon::parse($latestThreadDate)->toAtomString() : $staticLastmod,
            'changefreq' => 'daily',
            'priority' => '0.8',
        ];

        // Forum categories (en only)
        $categories = ForumCategory::query()
            ->select(['id', 'slug', 'updated_at'])
            ->get();

        foreach ($categories as $category) {
            $urls[] = [
                'loc' => "{$baseUrl}/en/forum/{$category->slug}",
                'lastmod' => $category->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ];
        }

        // Forum threads (en only) — most valuable forum content for SEO
        $threads = ForumThread::query()
            ->with('category:id,slug')
            ->select(['id', 'slug', 'category_id', 'last_activity_at'])
            ->get();

        foreach ($threads as $thread) {
            $urls[] = [
                'loc' => "{$baseUrl}/en/forum/{$thread->category->slug}/{$thread->slug}",
                'lastmod' => $thread->last_activity_at?->toAtomString() ?? $staticLastmod,
                'changefreq' => 'daily',
                'priority' => '0.9',
            ];
        }

        // Public portfolios
        $users = User::query()
            ->where('portfolio_visibility', 'public')
            ->whereNotNull('username')
            ->select(['username', 'updated_at'])
            ->get();

        foreach ($users as $user) {
            $urls[] = [
                'loc' => "{$baseUrl}/en/u/{$user->username}",
                'lastmod' => $user->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.6',
            ];
        }

        // Portfolio builder pages and individual projects
        $portfolios = Portfolio::query()
            ->where('is_published', true)
            ->with(['user:id,username', 'projects' => fn ($q) => $q->where('is_published', true)->select(['id', 'portfolio_id', 'slug', 'updated_at'])])
            ->select(['id', 'user_id', 'updated_at'])
            ->whereHas('user', fn ($q) => $q->whereNotNull('username'))
            ->get();

        foreach ($portfolios as $portfolio) {
            $urls[] = [
                'loc' => "{$baseUrl}/en/u/{$portfolio->user->username}/portfolio",
                'lastmod' => $portfolio->updated_at->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ];

            foreach ($portfolio->projects as $project) {
                $urls[] = [
                    'loc' => "{$baseUrl}/en/u/{$portfolio->user->username}/portfolio/{$project->slug}",
                    'lastmod' => $project->updated_at->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }
        }

        $xml = view('sitemap', compact('urls'))->render();

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
