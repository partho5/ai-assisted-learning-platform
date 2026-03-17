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
            'Disallow: /en/dashboard',
            'Disallow: /bn/dashboard',
            'Disallow: /en/admin/',
            'Disallow: /bn/admin/',
            'Disallow: /en/mentor/',
            'Disallow: /bn/mentor/',
            'Disallow: /settings/',
            'Disallow: /login',
            'Disallow: /register',
            '',
            "Sitemap: {$sitemapUrl}",
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain',
        ]);
    }
}
