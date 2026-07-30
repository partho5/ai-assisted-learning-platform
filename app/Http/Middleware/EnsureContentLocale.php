<?php

namespace App\Http\Middleware;

use App\Concerns\HasContentLanguage;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Redirects a content URL to the locale the content actually belongs to.
 *
 * Content is single-language by design: each course, article, and forum thread
 * exists under exactly one locale. Without this guard every record is reachable
 * under both `/bn/` and `/en/`, serving identical bytes from two URLs — the
 * duplicate-content problem that makes hreflang pairs impossible to assert
 * honestly.
 *
 * A permanent redirect is used rather than a 404 so any link equity already
 * pointing at the wrong-locale URL consolidates onto the canonical one.
 *
 * Must run after {@see SetLocale}, which resolves the locale from the URL.
 * Attach only to public show routes — never to author preview routes, where
 * the request locale is deliberately independent of the draft's language.
 */
class EnsureContentLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethod('GET')) {
            return $next($request);
        }

        $language = $this->resolveContentLanguage($request);

        if ($language === null || $language === app()->getLocale()) {
            return $next($request);
        }

        $target = $this->localizedUrl($request, $language);

        if ($target === null) {
            return $next($request);
        }

        return redirect($target, 301);
    }

    /**
     * The language of the first route-bound model that declares one.
     *
     * Routes such as `learn.show` bind both a Course and a Resource; only the
     * Course carries a language, so the first match wins.
     */
    private function resolveContentLanguage(Request $request): ?string
    {
        foreach ($request->route()?->parameters() ?? [] as $parameter) {
            if (! $parameter instanceof Model) {
                continue;
            }

            if (! in_array(HasContentLanguage::class, class_uses_recursive($parameter), true)) {
                continue;
            }

            return $parameter->contentLanguage()->value;
        }

        return null;
    }

    /**
     * Rebuild the current URL with a different locale segment.
     *
     * Swapping the leading path segment is deliberately preferred over
     * regenerating from the route name: it preserves the query string and
     * sidesteps custom route-key bindings such as `{article:slug}`.
     */
    private function localizedUrl(Request $request, string $locale): ?string
    {
        $segments = explode('/', $request->path());

        if (! in_array($segments[0] ?? null, config('app.supported_locales', []), true)) {
            return null;
        }

        $segments[0] = $locale;

        $url = url(implode('/', $segments));

        /**
         * The raw QUERY_STRING is used rather than getQueryString(), which
         * alphabetizes parameters — a redirect should hand back the query
         * exactly as it arrived.
         */
        $query = (string) $request->server('QUERY_STRING');

        return $query === '' ? $url : $url.'?'.$query;
    }
}
