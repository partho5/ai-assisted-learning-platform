<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreForumThreadRequest;
use App\Http\Requests\UpdateForumThreadRequest;
use App\Jobs\AutoFlagWithAi;
use App\Models\ForumCategory;
use App\Models\ForumThread;
use App\Services\TriggerEvaluator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ForumThreadController extends Controller
{
    public function create(Request $request): Response
    {
        $categories = ForumCategory::orderBy('sort_order')->get(['id', 'name', 'slug', 'color']);

        return Inertia::render('forum/create-thread', [
            'categories' => $categories,
            'prefill' => [
                'category_id' => $request->integer('category_id') ?: null,
                'resource_id' => $request->integer('resource_id') ?: null,
                'course_id' => $request->integer('course_id') ?: null,
                'title' => $request->input('title', ''),
            ],
        ]);
    }

    public function store(StoreForumThreadRequest $request): RedirectResponse
    {
        $slug = ForumThread::generateSlug($request->input('title'));

        /** @var \App\Models\User $user */
        $user = $request->user();

        $thread = ForumThread::create([
            'user_id' => $user->id,
            'category_id' => $request->input('category_id'),
            'slug' => $slug,
            'title' => $request->input('title'),
            'body' => $request->input('body'),
            'tags' => $request->input('tags', []),
            'resource_id' => $request->input('resource_id'),
            'course_id' => $request->input('course_id'),
            'last_activity_at' => now(),
        ]);

        // Update denormalized category stats
        $thread->category()->increment('thread_count');
        $thread->category()->update(['last_thread_id' => $thread->id]);

        // Dispatch AI replies for new_thread trigger
        app(TriggerEvaluator::class)->onNewThread($thread);

        // Dispatch AI moderation check
        AutoFlagWithAi::dispatch(ForumThread::class, $thread->id);

        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.threads.show', [
            'locale' => $locale,
            'forumCategory' => $thread->category->slug,
            'forumThread' => $thread->slug,
        ]);
    }

    public function show(Request $request, ForumCategory $forumCategory, ForumThread $forumThread): Response
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);

        $user = $request->user();
        $perPage = config('forum.replies_per_page', 30);

        $forumThread->load([
            'author:id,name,username,avatar,role,is_ai',
            'author.reputation:user_id,points',
            'category:id,name,slug,color',
        ]);

        $forumThread->loadExists([
            'votes as has_voted' => fn ($q) => $q->where('user_id', $user?->id ?? 0),
            'bookmarks as is_bookmarked' => fn ($q) => $q->where('user_id', $user?->id ?? 0),
            'follows as is_following' => fn ($q) => $q->where('user_id', $user?->id ?? 0),
        ]);

        // Accepted answer loaded separately to pin it above replies
        $acceptedAnswer = $forumThread->replies()
            ->where('is_accepted_answer', true)
            ->with([
                'author:id,name,username,avatar,role,is_ai',
                'author.reputation:user_id,points',
                'quotedReply:id,body,user_id',
            ])
            ->withExists(['votes as has_voted' => fn ($q) => $q->where('user_id', $user?->id ?? 0)])
            ->first();

        $replies = $forumThread->replies()
            ->where('is_accepted_answer', false)
            ->with([
                'author:id,name,username,avatar,role,is_ai',
                'author.reputation:user_id,points',
                'quotedReply:id,body,user_id',
            ])
            ->withExists(['votes as has_voted' => fn ($q) => $q->where('user_id', $user?->id ?? 0)])
            ->oldest()
            ->paginate($perPage);

        return Inertia::render('forum/show-thread', [
            'thread' => $forumThread,
            'acceptedAnswer' => $acceptedAnswer,
            'replies' => $replies,
            'canModerate' => $user && ($user->isAdmin() || $user->isMentor()),
            'canReply' => $user !== null && ! $forumThread->is_locked,
            'isAuthor' => $user?->id === $forumThread->user_id,
        ]);
    }

    public function edit(Request $request, ForumCategory $forumCategory, ForumThread $forumThread): Response
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);
        abort_unless(
            $request->user()?->id === $forumThread->user_id || $request->user()?->isAdmin(),
            403
        );

        $categories = ForumCategory::orderBy('sort_order')->get(['id', 'name', 'slug', 'color']);

        return Inertia::render('forum/edit-thread', [
            'thread' => $forumThread,
            'categories' => $categories,
        ]);
    }

    public function update(UpdateForumThreadRequest $request, ForumCategory $forumCategory, ForumThread $forumThread): RedirectResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);
        abort_unless(
            $request->user()?->id === $forumThread->user_id || $request->user()?->isAdmin(),
            403
        );

        $oldCategoryId = $forumThread->category_id;
        $newCategoryId = $request->integer('category_id');

        $forumThread->update([
            'title' => $request->input('title'),
            'body' => $request->input('body'),
            'category_id' => $newCategoryId,
            'tags' => $request->input('tags', []),
        ]);

        // Update denormalized counts if category changed
        if ($oldCategoryId !== $newCategoryId) {
            ForumCategory::where('id', $oldCategoryId)->decrement('thread_count');
            $newCategory = ForumCategory::find($newCategoryId);
            if ($newCategory) {
                $newCategory->increment('thread_count');
                $newCategory->update(['last_thread_id' => $forumThread->id]);
            }
        }

        $forumThread->refresh();
        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.threads.show', [
            'locale' => $locale,
            'forumCategory' => $forumThread->category->slug,
            'forumThread' => $forumThread->slug,
        ]);
    }

    public function destroy(Request $request, ForumCategory $forumCategory, ForumThread $forumThread): RedirectResponse
    {
        abort_if($forumThread->category_id !== $forumCategory->id, 404);
        abort_unless(
            $request->user()?->id === $forumThread->user_id || $request->user()?->isAdmin(),
            403
        );

        $categoryId = $forumThread->category_id;
        $forumThread->delete();

        ForumCategory::where('id', $categoryId)->decrement('thread_count');

        $locale = $request->route('locale', 'en');

        return redirect()->route('forum.category.show', [
            'locale' => $locale,
            'forumCategory' => $forumCategory->slug,
        ]);
    }
}
