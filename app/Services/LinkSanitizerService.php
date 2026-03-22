<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;

class LinkSanitizerService
{
    private const int TIMEOUT = 3;

    /**
     * Scan HTML for external links, check reachability, and strip any that
     * return 404 or fail to connect entirely. Any other HTTP response
     * (including 401, 403, 5xx) is treated as reachable and left untouched.
     */
    public function sanitize(string $html): string
    {
        $hrefs = $this->extractExternalHrefs($html);

        if (empty($hrefs)) {
            return $html;
        }

        $deadLinks = $this->detectDeadLinks($hrefs);

        if (empty($deadLinks)) {
            return $html;
        }

        return $this->stripDeadLinks($html, $deadLinks);
    }

    /** @return string[] Unique external http/https hrefs found in the HTML */
    private function extractExternalHrefs(string $html): array
    {
        libxml_use_internal_errors(true);

        $doc = new DOMDocument;
        $doc->loadHTML('<?xml encoding="utf-8"?>'.$html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

        libxml_clear_errors();

        $xpath = new DOMXPath($doc);
        $anchors = $xpath->query('//a[@href]');

        $appHost = parse_url(config('app.url'), PHP_URL_HOST);
        $hrefs = [];

        foreach ($anchors as $anchor) {
            $href = $anchor->getAttribute('href');
            $scheme = parse_url($href, PHP_URL_SCHEME);
            $host = parse_url($href, PHP_URL_HOST);

            if (in_array($scheme, ['http', 'https'], true) && $host && $host !== $appHost) {
                $hrefs[] = $href;
            }
        }

        return array_values(array_unique($hrefs));
    }

    /**
     * @param  string[]  $hrefs
     * @return string[] Hrefs that are unreachable (connection failure or 404)
     */
    private function detectDeadLinks(array $hrefs): array
    {
        $responses = Http::pool(function (Pool $pool) use ($hrefs): array {
            return array_map(
                fn (string $href) => $pool->timeout(self::TIMEOUT)->head($href),
                $hrefs
            );
        });

        $dead = [];

        foreach ($hrefs as $i => $href) {
            $response = $responses[$i];

            if ($response instanceof ConnectionException || $response instanceof \Throwable) {
                $dead[] = $href;

                continue;
            }

            if ($response->status() === 404) {
                $dead[] = $href;
            }
        }

        return $dead;
    }

    /**
     * Replace <a href="deadLink">...</a> with its inner content, preserving
     * all other anchor attributes and surrounding HTML untouched.
     *
     * @param  string[]  $deadLinks
     */
    private function stripDeadLinks(string $html, array $deadLinks): string
    {
        foreach ($deadLinks as $href) {
            $escaped = preg_quote($href, '~');
            $html = preg_replace(
                '~<a\b[^>]*\shref=["\']'.$escaped.'["\'][^>]*>(.*?)</a>~is',
                '$1',
                $html
            );
        }

        return $html;
    }
}
