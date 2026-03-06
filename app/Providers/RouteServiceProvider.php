<?php

namespace App\Providers;

use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Route bindings handled by model resolveRouteBinding methods
    }
}
