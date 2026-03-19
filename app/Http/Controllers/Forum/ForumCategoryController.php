<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use App\Models\ForumThread;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ForumCategoryController extends Controller
{
    public function show(Request $request, ForumCategory $forumCategory): Response
    {
        $filter = $request->input('filter', 'recent');
        $perPage = config('forum.threads_per_page', 20);

        $query = ForumThread::query()
            ->where('category_id', $forumCategory->id)
            ->with(['author:id,name,username,avatar,is_ai', 'category:id,name,slug,color'])
            ->withExists(['votes as has_voted' => function ($q) use ($request) {
                $q->where('user_id', $request->user()?->id ?? 0);
            }]);

        // Pinned threads always first within the current filter
        match ($filter) {
            'trending' => $query->trending(),
            'unanswered' => $query->unanswered()->recent(),
            'resolved' => $query->resolved()->recent(),
            default => $query->recent(),
        };

        // Pinned threads bubble up regardless of filter
        $query->orderByDesc('is_pinned');

        $threads = $query->paginate($perPage)->withQueryString();

        return Inertia::render('forum/show-category', [
            'category' => $forumCategory,
            'threads' => $threads,
            'filter' => $filter,
        ]);
    }
}
