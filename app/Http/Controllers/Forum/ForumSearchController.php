<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use App\Models\ForumThread;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ForumSearchController extends Controller
{
    public function index(Request $request): Response
    {
        $query = $request->input('q', '');
        $categorySlug = $request->input('category');
        $resolved = $request->input('resolved');

        $threads = collect();

        if ($query !== '') {
            $searchQuery = ForumThread::query()
                ->with(['author:id,name,username,avatar', 'category:id,name,slug,color'])
                ->where(function ($q) use ($query) {
                    $q->where('title', 'ilike', "%{$query}%")
                        ->orWhere('body', 'ilike', "%{$query}%")
                        ->orWhereJsonContains('tags', $query);
                });

            if ($categorySlug) {
                $searchQuery->whereHas('category', fn ($q) => $q->where('slug', $categorySlug));
            }

            if ($resolved !== null) {
                $searchQuery->where('is_resolved', filter_var($resolved, FILTER_VALIDATE_BOOLEAN));
            }

            $threads = $searchQuery->latest('last_activity_at')
                ->paginate(config('forum.threads_per_page', 20))
                ->withQueryString();
        }

        $categories = ForumCategory::orderBy('sort_order')->get(['id', 'name', 'slug']);

        return Inertia::render('forum/search', [
            'threads' => $threads,
            'categories' => $categories,
            'filters' => $request->only(['q', 'category', 'resolved']),
        ]);
    }
}
