<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $baseUrl = rtrim(config('app.url'), '/');
        $locales = ['en'];
        $now = now()->toAtomString();

        $urls = [];

        // Static pages — all locales
        foreach ($locales as $locale) {
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/",
                'lastmod' => $now,
                'changefreq' => 'weekly',
                'priority' => '1.0',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/courses",
                'lastmod' => $now,
                'changefreq' => 'daily',
                'priority' => '0.9',
            ];
            $urls[] = [
                'loc' => "{$baseUrl}/{$locale}/about-us",
                'lastmod' => $now,
                'changefreq' => 'monthly',
                'priority' => '0.5',
            ];
        }

        // Published courses
        $courses = Course::query()
            ->published()
            ->select(['slug', 'updated_at'])
            ->get();

        foreach ($courses as $course) {
            foreach ($locales as $locale) {
                $urls[] = [
                    'loc' => "{$baseUrl}/{$locale}/courses/{$course->slug}",
                    'lastmod' => $course->updated_at->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
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
