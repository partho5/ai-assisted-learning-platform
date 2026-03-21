<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');
        $locales = ['en', 'bn'];

        $urls = [];

        // Static pages — use a fixed date so crawlers don't think they change every request
        $staticLastmod = '2026-03-01T00:00:00+00:00';
        foreach ($locales as $locale) {
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/",
                'lastmod' => $staticLastmod,
                'changefreq' => 'weekly',
                'priority' => '1.0',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/courses",
                'lastmod' => ($latestCourse = Course::query()->published()->max('updated_at')) ? Carbon::parse($latestCourse)->toAtomString() : $staticLastmod,
                'changefreq' => 'daily',
                'priority' => '0.9',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/about-us",
                'lastmod' => $staticLastmod,
                'changefreq' => 'monthly',
                'priority' => '0.5',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/contact",
                'lastmod' => $staticLastmod,
                'changefreq' => 'yearly',
                'priority' => '0.4',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/privacy-policy",
                'lastmod' => $staticLastmod,
                'changefreq' => 'yearly',
                'priority' => '0.3',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/terms",
                'lastmod' => $staticLastmod,
                'changefreq' => 'yearly',
                'priority' => '0.3',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/refund-policy",
                'lastmod' => $staticLastmod,
                'changefreq' => 'yearly',
                'priority' => '0.3',
            ];
        }

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

        // Public portfolios
        $users = User::query()
            ->where('portfolio_visibility', 'public')
            ->whereNotNull('username')
            ->select(['username', 'updated_at'])
            ->get();

        foreach ($users as $user) {
            foreach ($locales as $locale) {
                $urls[] = [
                    'loc' => "{$baseUrl}/{$locale}/u/{$user->username}",
                    'lastmod' => $user->updated_at->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            }
        }

        $xml = view('sitemap', compact('urls'))->render();

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
