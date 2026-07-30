<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use Tests\TestCase;

/**
 * Guards the boundary between locale-prefixed public pages and un-prefixed
 * back-office pages.
 *
 * Only the 19 public GET pages live under /{locale}. Everything else — admin,
 * mentor, dashboard, authoring — is un-prefixed. A React component that builds
 * `/${locale}/dashboard` therefore produces a 404, and nothing in the type
 * system catches it because these are hand-written template literals rather
 * than Wayfinder calls.
 *
 * This test parses every hard-coded locale-prefixed URL out of the frontend and
 * asserts the path actually exists as a /{locale} route.
 */
class FrontendLocaleLinkTest extends TestCase
{
    /**
     * The template-literal expressions the frontend uses to interpolate the
     * current locale into a hand-built URL.
     */
    private const LOCALE_TOKENS = ['/${l}', '/${locale}', '${prefix}'];

    public function test_no_frontend_component_builds_a_locale_prefixed_back_office_url(): void
    {
        $localeRoutes = $this->localeRoutePatterns();

        $offenders = [];

        foreach ($this->frontendFiles() as $file) {
            $lines = file($file->getPathname());

            foreach ($lines as $number => $line) {
                foreach ($this->localePrefixedPaths($line) as $path) {
                    if (in_array($this->normalize($path), $localeRoutes, true)) {
                        continue;
                    }

                    $offenders[] = sprintf(
                        '%s:%d  /{locale}%s',
                        str_replace(base_path().'/', '', $file->getPathname()),
                        $number + 1,
                        $path
                    );
                }
            }
        }

        $this->assertSame([], $offenders, sprintf(
            "%d frontend URL(s) prefix a locale onto a route that is not locale-prefixed, so they 404:\n%s",
            count($offenders),
            implode("\n", $offenders)
        ));
    }

    /**
     * Sanity check on the parser itself: if this stops finding locale-prefixed
     * URLs, the test above would silently pass while proving nothing.
     */
    public function test_the_parser_still_finds_the_public_locale_prefixed_urls(): void
    {
        $found = 0;

        foreach ($this->frontendFiles() as $file) {
            foreach (file($file->getPathname()) as $line) {
                $found += count($this->localePrefixedPaths($line));
            }
        }

        $this->assertGreaterThan(50, $found, 'The locale-URL parser found suspiciously few matches.');
    }

    /**
     * @return list<string>
     */
    private function localeRoutePatterns(): array
    {
        $patterns = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            if (! str_starts_with($uri, '{locale}')) {
                continue;
            }

            $patterns[] = $this->normalize(substr($uri, strlen('{locale}')));
        }

        return array_values(array_unique($patterns));
    }

    /**
     * Collapses route parameters and interpolated JS expressions to a single
     * placeholder so `/courses/{course}` and `/courses/${course.slug}` compare
     * equal.
     */
    private function normalize(string $path): string
    {
        $path = preg_replace('/\{[^}]+\}/', 'X', $path) ?? '';

        return trim($path, '/');
    }

    /**
     * Extracts the path that follows each locale token on a line, tracking
     * `${...}` nesting so expressions containing quotes or optional chaining
     * (`${thread.category?.slug ?? ''}`) do not truncate the match.
     *
     * @return list<string>
     */
    private function localePrefixedPaths(string $line): array
    {
        $paths = [];

        foreach (self::LOCALE_TOKENS as $token) {
            $offset = 0;

            while (($start = strpos($line, $token, $offset)) !== false) {
                $offset = $start + strlen($token);
                $path = $this->consumePath($line, $offset);

                /* A bare token is a prefix declaration, not a URL. */
                if ($path !== '' && $path !== '/') {
                    $paths[] = preg_replace('/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/', 'X', $path) ?? '';
                }
            }
        }

        return $paths;
    }

    private function consumePath(string $line, int $position): string
    {
        $path = '';
        $depth = 0;
        $length = strlen($line);

        for ($i = $position; $i < $length; $i++) {
            if (substr($line, $i, 2) === '${') {
                $depth++;
                $path .= '${';
                $i++;

                continue;
            }

            $character = $line[$i];

            if ($depth > 0) {
                if ($character === '}') {
                    $depth--;
                }

                $path .= $character;

                continue;
            }

            if (str_contains("`'\"? \t\n<>),;", $character)) {
                break;
            }

            $path .= $character;
        }

        return $path;
    }

    /**
     * @return list<SplFileInfo>
     */
    private function frontendFiles(): array
    {
        $files = [];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(resource_path('js'), RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            /* Wayfinder output is generated, and its query-string helpers use
             * `${prefix}[${key}]`, which is not a URL path. */
            if (str_contains($file->getPathname(), '/js/wayfinder/')
                || str_contains($file->getPathname(), '/js/routes/')
                || str_contains($file->getPathname(), '/js/actions/')) {
                continue;
            }

            if (in_array($file->getExtension(), ['ts', 'tsx'], true)) {
                $files[] = $file;
            }
        }

        return $files;
    }
}
