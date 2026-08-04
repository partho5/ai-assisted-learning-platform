<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_add_module_to_own_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->post(route('modules.store', ['course' => $course->slug]), [
                'title' => 'Getting Started',
                'description' => 'Introduction module.',
                'order' => 0,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('modules', [
            'course_id' => $course->id,
            'title' => 'Getting Started',
        ]);
    }

    public function test_mentor_cannot_add_module_to_another_mentors_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();

        $this->actingAs($mentor)
            ->post(route('modules.store', ['course' => $course->slug]), [
                'title' => 'Hacked Module',
            ])
            ->assertForbidden();
    }

    public function test_module_description_html_is_sanitized(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->post(route('modules.store', ['course' => $course->slug]), [
                'title' => 'Getting Started',
                'description' => '<p onclick="alert(1)">Intro <script>alert(1)</script>module</p>',
            ])
            ->assertRedirect();

        $module = Module::where('course_id', $course->id)->firstOrFail();
        $this->assertStringNotContainsString('<script>', $module->description);
        $this->assertStringNotContainsString('onclick', $module->description);
        $this->assertStringContainsString('Intro', $module->description);
    }

    public function test_mentor_can_update_module_in_own_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create(['title' => 'Old Title']);

        $this->actingAs($mentor)
            ->put(route('modules.update', ['course' => $course->slug, 'module' => $module->id]), [
                'title' => 'New Title',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('modules', ['id' => $module->id, 'title' => 'New Title']);
    }

    public function test_mentor_can_delete_module_from_own_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->actingAs($mentor)
            ->delete(route('modules.destroy', ['course' => $course->slug, 'module' => $module->id]))
            ->assertRedirect();

        $this->assertDatabaseMissing('modules', ['id' => $module->id]);
    }

    public function test_module_title_is_required(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->post(route('modules.store', ['course' => $course->slug]), [
                'description' => 'No title here.',
            ])
            ->assertSessionHasErrors('title');
    }

    public function test_module_belongs_to_course_is_enforced(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $otherCourse = Course::factory()->for($mentor, 'mentor')->create();
        $moduleFromOther = Module::factory()->for($otherCourse)->create();

        $this->actingAs($mentor)
            ->delete(route('modules.destroy', ['course' => $course->slug, 'module' => $moduleFromOther->id]))
            ->assertNotFound();
    }
}
