<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pins back-office pages to a single, stable interface language.
 *
 * Admin, mentor and dashboard screens are authenticated tooling: they carry no
 * indexable content and no localized copy, which is why they sit outside the
 * /{locale} prefix. Their URLs therefore have no locale to read, and falling
 * through to the public default would flip the admin UI's wording whenever the
 * public default changes.
 *
 * The fallback locale is used because it is the complete message catalogue.
 */
class SetBackOfficeLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        App::setLocale(config('app.fallback_locale', 'en'));

        return $next($request);
    }
}
