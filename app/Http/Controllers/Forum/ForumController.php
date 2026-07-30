<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use Inertia\Inertia;
use Inertia\Response;

class ForumController extends Controller
{
    public function index(): Response
    {
        $locale = app()->getLocale();

        /**
         * Counts and the "last thread" preview are scoped to the current locale
         * so the Bengali forum doesn't advertise English activity.
         */
        $categories = ForumCategory::query()
            ->withCount([
                'threads' => function ($query) use ($locale) {
                    $query->where('language', $locale);
                },
                'threads as unresolved_threads_count' => function ($query) use ($locale) {
                    $query->where('language', $locale)->where('is_resolved', false);
                },
            ])
            ->with(['lastThread.author:id,name,username,avatar'])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('forum/index', [
            'categories' => $categories,
        ]);
    }
}
