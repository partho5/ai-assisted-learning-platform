<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'appUrl' => config('app.url'),
            'auth' => [
                'user' => fn () => $request->user()?->load('reputation'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Read from route param directly — web middleware runs before setlocale middleware
            'locale' => $request->route('locale', config('app.locale')),
            'supportedLocales' => config('app.supported_locales', ['en', 'bn']),
            // Lazy closure so translations are resolved after SetLocale sets app locale
            'ui' => fn () => trans('ui'),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'chat_merged' => fn () => $request->session()->get('chat_merged'),
            ],
            'paypalClientId' => config('services.paypal.client_id'),
            'onesignalAppId' => config('services.onesignal.app_id'),
        ];
    }
}
