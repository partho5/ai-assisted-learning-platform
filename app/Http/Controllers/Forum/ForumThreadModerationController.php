<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use App\Models\ForumThread;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ForumThreadModerationController extends Controller
{
    /** Toggle the pinned state of a thread. */
    public function pin(Request $request, ForumCategory $forumCategory, ForumThread $forumThread): JsonResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);

        $forumThread->update(['is_pinned' => ! $forumThread->is_pinned]);

        return response()->json(['is_pinned' => $forumThread->is_pinned]);
    }

    /** Toggle the locked state of a thread. */
    public function lock(Request $request, ForumCategory $forumCategory, ForumThread $forumThread): JsonResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);

        $forumThread->update(['is_locked' => ! $forumThread->is_locked]);

        return response()->json(['is_locked' => $forumThread->is_locked]);
    }

    /** Move a thread to a different category. */
    public function move(Request $request, ForumCategory $forumCategory, ForumThread $forumThread): RedirectResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);

        $request->validate([
            'category_id' => ['required', 'integer', 'exists:forum_categories,id'],
        ]);

        abort_if((int) $request->input('category_id') === $forumCategory->id, 422, 'Thread is already in this category.');

        $validated = $request->only('category_id');

        $oldCategoryId = $forumThread->category_id;
        $newCategoryId = (int) $validated['category_id'];

        $forumThread->update(['category_id' => $newCategoryId]);

        // Update denormalized counts
        ForumCategory::where('id', $oldCategoryId)->decrement('thread_count');
        $newCategory = ForumCategory::find($newCategoryId);
        if ($newCategory) {
            $newCategory->increment('thread_count');
            $newCategory->update(['last_thread_id' => $forumThread->id]);
        }

        $forumThread->refresh();
        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.threads.show', [
            'locale' => $locale,
            'forumCategory' => $forumThread->category->slug,
            'forumThread' => $forumThread->slug,
        ]);
    }
}
