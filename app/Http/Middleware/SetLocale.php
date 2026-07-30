<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->route('locale', config('app.locale'));

        if (! in_array($locale, config('app.supported_locales', ['bn', 'en']))) {
            abort(404);
        }

        App::setLocale($locale);

        /**
         * Make `locale` an implicit route-generation parameter for the rest of
         * this request, so route('courses.index') resolves to the locale the
         * visitor is already browsing instead of throwing UrlGenerationException.
         *
         * Explicitly passed locales still win, so the ~50 existing call sites
         * that pass it are unaffected. The baseline default is registered in
         * AppServiceProvider for routes outside this middleware's group and for
         * queue/console contexts, where no request locale exists.
         */
        URL::defaults(['locale' => $locale]);

        $request->route()->forgetParameter('locale');

        return $next($request);
    }
}
