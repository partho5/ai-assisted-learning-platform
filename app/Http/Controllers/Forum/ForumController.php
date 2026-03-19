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
        $categories = ForumCategory::query()
            ->withCount(['threads', 'threads as unresolved_threads_count' => function ($query) {
                $query->where('is_resolved', false);
            }])
            ->with(['lastThread.author:id,name,username,avatar'])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('forum/index', [
            'categories' => $categories,
        ]);
    }
}
