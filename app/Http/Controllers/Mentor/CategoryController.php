<?php

namespace App\Http\Controllers\Mentor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->withCount('courses')
            ->orderBy('name')
            ->get();

        return Inertia::render('mentor/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('mentor/categories/create');
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $name = $request->validated()['name'];

        Category::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $request->validated()['description'] ?? null,
        ]);

        return redirect()->route('mentor.categories.index', ['locale' => app()->getLocale()])
            ->with('success', 'Category created.');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('mentor/categories/edit', [
            'category' => $category,
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $name = $request->validated()['name'];

        $category->update([
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $request->validated()['description'] ?? null,
        ]);

        return redirect()->route('mentor.categories.index', ['locale' => app()->getLocale()])
            ->with('success', 'Category updated.');
    }
}
