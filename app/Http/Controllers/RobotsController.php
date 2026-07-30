<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function index(): Response
    {
        $sitemapUrl = rtrim(config('app.url'), '/').'/sitemap.xml';

        /** Derived from config so a new locale can't silently become crawlable. */
        $localePaths = [];
        foreach (config('app.supported_locales', ['bn', 'en']) as $locale) {
            $localePaths[] = "Disallow: /{$locale}/dashboard";
            $localePaths[] = "Disallow: /{$locale}/admin/";
            $localePaths[] = "Disallow: /{$locale}/mentor/";
        }

        $lines = [
            'User-agent: *',
            'Allow: /',
            '',
            ...$localePaths,
            'Disallow: /settings/',
            'Disallow: /login',
            'Disallow: /register',
            'Disallow: /password-reset',
            'Disallow: /email/verify',
            'Disallow: /_boost/',
            '',
            "Sitemap: {$sitemapUrl}",
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain',
        ]);
    }
}
