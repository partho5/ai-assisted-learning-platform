<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->route('locale', config('app.locale'));

        if (! in_array($locale, config('app.supported_locales', ['en', 'bn']))) {
            abort(404);
        }

        App::setLocale($locale);
        $request->route()->forgetParameter('locale');

        return $next($request);
    }
}
