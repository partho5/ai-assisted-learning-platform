<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function index(): Response
    {
        $sitemapUrl = rtrim(config('app.url'), '/').'/sitemap.xml';

        $lines = [
            'User-agent: *',
            'Allow: /',
            '',
            /** Back-office carries no locale prefix, so one entry each covers it. */
            'Disallow: /dashboard',
            'Disallow: /admin/',
            'Disallow: /mentor/',
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
