<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleReorderTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_reorder_own_course_modules(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $m1 = Module::factory()->for($course)->create(['order' => 0]);
        $m2 = Module::factory()->for($course)->create(['order' => 1]);
        $m3 = Module::factory()->for($course)->create(['order' => 2]);

        $this->actingAs($mentor)
            ->post(route('modules.reorder', ['locale' => 'en', 'course' => $course->slug]), [
                'order' => [$m3->id, $m1->id, $m2->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('modules', ['id' => $m3->id, 'order' => 0]);
        $this->assertDatabaseHas('modules', ['id' => $m1->id, 'order' => 1]);
        $this->assertDatabaseHas('modules', ['id' => $m2->id, 'order' => 2]);
    }

    public function test_admin_can_reorder_any_course_modules(): void
    {
        $mentor = User::factory()->mentor()->create();
        $admin = User::factory()->admin()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $m1 = Module::factory()->for($course)->create(['order' => 0]);
        $m2 = Module::factory()->for($course)->create(['order' => 1]);

        $this->actingAs($admin)
            ->post(route('modules.reorder', ['locale' => 'en', 'course' => $course->slug]), [
                'order' => [$m2->id, $m1->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('modules', ['id' => $m2->id, 'order' => 0]);
        $this->assertDatabaseHas('modules', ['id' => $m1->id, 'order' => 1]);
    }

    public function test_mentor_cannot_reorder_modules_of_another_mentors_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();

        $m1 = Module::factory()->for($course)->create(['order' => 0]);
        $m2 = Module::factory()->for($course)->create(['order' => 1]);

        $this->actingAs($mentor)
            ->post(route('modules.reorder', ['locale' => 'en', 'course' => $course->slug]), [
                'order' => [$m2->id, $m1->id],
            ])
            ->assertForbidden();
    }

    public function test_reorder_requires_order_field(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->post(route('modules.reorder', ['locale' => 'en', 'course' => $course->slug]), [])
            ->assertSessionHasErrors('order');
    }

    public function test_guest_cannot_reorder_modules(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->post(route('modules.reorder', ['locale' => 'en', 'course' => $course->slug]), [
            'order' => [],
        ])->assertRedirect(route('login'));
    }
}
