<?php

namespace App\Http\Controllers\Mentor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\SlugGenerator;
use Illuminate\Http\RedirectResponse;
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
            'slug' => SlugGenerator::generate($name),
            'description' => $request->validated()['description'] ?? null,
        ]);

        return redirect()->route('mentor.categories.index')
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
            'slug' => SlugGenerator::generate($name),
            'description' => $request->validated()['description'] ?? null,
        ]);

        return redirect()->route('mentor.categories.index')
            ->with('success', 'Category updated.');
    }
}
