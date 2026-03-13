<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResourceReorderTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_reorder_resources_in_own_module(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $r1 = Resource::factory()->for($module)->create(['order' => 0]);
        $r2 = Resource::factory()->for($module)->create(['order' => 1]);
        $r3 = Resource::factory()->for($module)->create(['order' => 2]);

        $this->actingAs($mentor)
            ->post(route('resources.reorder', ['locale' => 'en', 'course' => $course->slug, 'module' => $module->id]), [
                'order' => [$r3->id, $r1->id, $r2->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('resources', ['id' => $r3->id, 'order' => 0]);
        $this->assertDatabaseHas('resources', ['id' => $r1->id, 'order' => 1]);
        $this->assertDatabaseHas('resources', ['id' => $r2->id, 'order' => 2]);
    }

    public function test_admin_can_reorder_resources_in_any_module(): void
    {
        $mentor = User::factory()->mentor()->create();
        $admin = User::factory()->admin()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $r1 = Resource::factory()->for($module)->create(['order' => 0]);
        $r2 = Resource::factory()->for($module)->create(['order' => 1]);

        $this->actingAs($admin)
            ->post(route('resources.reorder', ['locale' => 'en', 'course' => $course->slug, 'module' => $module->id]), [
                'order' => [$r2->id, $r1->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('resources', ['id' => $r2->id, 'order' => 0]);
        $this->assertDatabaseHas('resources', ['id' => $r1->id, 'order' => 1]);
    }

    public function test_mentor_cannot_reorder_resources_in_another_mentors_module(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $r1 = Resource::factory()->for($module)->create(['order' => 0]);
        $r2 = Resource::factory()->for($module)->create(['order' => 1]);

        $this->actingAs($mentor)
            ->post(route('resources.reorder', ['locale' => 'en', 'course' => $course->slug, 'module' => $module->id]), [
                'order' => [$r2->id, $r1->id],
            ])
            ->assertForbidden();
    }

    public function test_reorder_rejects_module_from_different_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $otherCourse = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($otherCourse)->create();

        $this->actingAs($mentor)
            ->post(route('resources.reorder', ['locale' => 'en', 'course' => $course->slug, 'module' => $module->id]), [
                'order' => [],
            ])
            ->assertNotFound();
    }

    public function test_reorder_requires_order_field(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->actingAs($mentor)
            ->post(route('resources.reorder', ['locale' => 'en', 'course' => $course->slug, 'module' => $module->id]), [])
            ->assertSessionHasErrors('order');
    }

    public function test_guest_cannot_reorder_resources(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->post(route('resources.reorder', ['locale' => 'en', 'course' => $course->slug, 'module' => $module->id]), [
            'order' => [],
        ])->assertRedirect(route('login'));
    }
}
