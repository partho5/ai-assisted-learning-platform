<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // index
    // ──────────────────────────────────────────────

    public function test_guest_cannot_view_categories_index(): void
    {
        $this->get(route('admin.categories.index', ['locale' => 'en']))
            ->assertRedirect();
    }

    public function test_learner_cannot_view_categories_index(): void
    {
        $this->actingAs(User::factory()->learner()->create())
            ->get(route('admin.categories.index', ['locale' => 'en']))
            ->assertForbidden();
    }

    public function test_mentor_cannot_view_categories_index(): void
    {
        $this->actingAs(User::factory()->mentor()->create())
            ->get(route('admin.categories.index', ['locale' => 'en']))
            ->assertForbidden();
    }

    public function test_admin_can_view_categories_index(): void
    {
        Category::factory()->count(3)->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.categories.index', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/categories/index')
                ->has('categories', 3)
            );
    }

    // ──────────────────────────────────────────────
    // create / store
    // ──────────────────────────────────────────────

    public function test_admin_can_view_create_form(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.categories.create', ['locale' => 'en']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('admin/categories/create'));
    }

    public function test_admin_can_create_category(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post(route('admin.categories.store', ['locale' => 'en']), [
                'name' => 'Web Development',
                'description' => 'Everything about the web.',
            ])
            ->assertRedirect(route('admin.categories.index', ['locale' => 'en']));

        $this->assertDatabaseHas('categories', [
            'name' => 'Web Development',
            'slug' => 'web-development',
        ]);
    }

    public function test_store_fails_with_duplicate_name(): void
    {
        Category::factory()->create(['name' => 'Web Development']);

        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.categories.store', ['locale' => 'en']), [
                'name' => 'Web Development',
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_store_requires_name(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->post(route('admin.categories.store', ['locale' => 'en']), ['name' => ''])
            ->assertSessionHasErrors('name');
    }

    // ──────────────────────────────────────────────
    // edit / update
    // ──────────────────────────────────────────────

    public function test_admin_can_view_edit_form(): void
    {
        $category = Category::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->get(route('admin.categories.edit', ['locale' => 'en', 'category' => $category]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/categories/edit')
                ->where('category.id', $category->id)
            );
    }

    public function test_admin_can_update_category(): void
    {
        $category = Category::factory()->create(['name' => 'Old Name']);

        $this->actingAs(User::factory()->admin()->create())
            ->put(route('admin.categories.update', ['locale' => 'en', 'category' => $category]), [
                'name' => 'New Name',
                'description' => 'Updated description.',
            ])
            ->assertRedirect(route('admin.categories.index', ['locale' => 'en']));

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'New Name',
            'slug' => 'new-name',
        ]);
    }

    public function test_update_allows_keeping_same_name(): void
    {
        $category = Category::factory()->create(['name' => 'Same Name']);

        $this->actingAs(User::factory()->admin()->create())
            ->put(route('admin.categories.update', ['locale' => 'en', 'category' => $category]), [
                'name' => 'Same Name',
            ])
            ->assertRedirect(route('admin.categories.index', ['locale' => 'en']));
    }

    // ──────────────────────────────────────────────
    // destroy
    // ──────────────────────────────────────────────

    public function test_admin_can_delete_category(): void
    {
        $category = Category::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->delete(route('admin.categories.destroy', ['locale' => 'en', 'category' => $category]))
            ->assertRedirect(route('admin.categories.index', ['locale' => 'en']));

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_with_courses(): void
    {
        $category = Category::factory()->create();
        \App\Models\Course::factory()->for(\App\Models\User::factory()->mentor()->create(), 'mentor')->create(['category_id' => $category->id]);

        $this->actingAs(User::factory()->admin()->create())
            ->delete(route('admin.categories.destroy', ['locale' => 'en', 'category' => $category]))
            ->assertRedirect(route('admin.categories.index', ['locale' => 'en']))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_learner_cannot_delete_category(): void
    {
        $category = Category::factory()->create();

        $this->actingAs(User::factory()->learner()->create())
            ->delete(route('admin.categories.destroy', ['locale' => 'en', 'category' => $category]))
            ->assertForbidden();

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
