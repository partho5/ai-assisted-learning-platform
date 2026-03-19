<?php

namespace App\Http\Controllers\Admin\Forum;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ForumCategoryAdminController extends Controller
{
    public function index(): Response
    {
        $categories = ForumCategory::withCount('threads')->orderBy('sort_order')->get();

        return Inertia::render('admin/forum/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['required', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        ForumCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'],
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        $locale = $request->route('locale', 'en');

        return redirect()->route('admin.forum.categories.index', ['locale' => $locale]);
    }

    public function update(Request $request, ForumCategory $forumCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['required', 'string', 'max:50'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $forumCategory->update($validated);

        $locale = $request->route('locale', 'en');

        return redirect()->route('admin.forum.categories.index', ['locale' => $locale]);
    }

    public function destroy(Request $request, ForumCategory $forumCategory): RedirectResponse
    {
        $forumCategory->delete();

        $locale = $request->route('locale', 'en');

        return redirect()->route('admin.forum.categories.index', ['locale' => $locale]);
    }
}
