<?php

namespace Tests\Feature;

use App\Enums\ResourceType;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResourceManagementTest extends TestCase
{
    use RefreshDatabase;

    private function resourceRoute(string $name, Course $course, Module $module, ?Resource $resource = null): string
    {
        $params = ['locale' => 'en', 'course' => $course->slug, 'module' => $module->id];

        if ($resource) {
            $params['resource'] = $resource->id;
        }

        return route($name, $params);
    }

    public function test_mentor_can_add_resource_to_own_module(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->actingAs($mentor)
            ->post($this->resourceRoute('resources.store', $course, $module), [
                'title' => 'Intro Video',
                'type' => ResourceType::Video->value,
                'url' => 'https://www.youtube.com/watch?v=abc123',
                'why_this_resource' => 'Best intro for beginners.',
                'caption' => 'A great introductory video.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('resources', [
            'module_id' => $module->id,
            'title' => 'Intro Video',
            'type' => ResourceType::Video->value,
        ]);
    }

    public function test_why_this_resource_is_nullable(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->actingAs($mentor)
            ->post($this->resourceRoute('resources.store', $course, $module), [
                'title' => 'A Video',
                'type' => ResourceType::Video->value,
                'url' => 'https://youtube.com/watch?v=xyz',
            ])
            ->assertSessionHasNoErrors();
    }

    public function test_url_is_required_for_video_resource(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->actingAs($mentor)
            ->post($this->resourceRoute('resources.store', $course, $module), [
                'title' => 'No URL Video',
                'type' => ResourceType::Video->value,
                'why_this_resource' => 'Great resource.',
            ])
            ->assertSessionHasErrors('url');
    }

    public function test_url_is_not_required_for_text_resource(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->actingAs($mentor)
            ->post($this->resourceRoute('resources.store', $course, $module), [
                'title' => 'Text Resource',
                'type' => ResourceType::Text->value,
                'why_this_resource' => 'Great notes.',
                'content' => 'Some rich content here.',
            ])
            ->assertSessionDoesntHaveErrors('url');
    }

    public function test_mentor_can_update_resource(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->video()->for($module)->create();

        $this->actingAs($mentor)
            ->put($this->resourceRoute('resources.update', $course, $module, $resource), [
                'title' => 'Updated Resource',
                'type' => ResourceType::Video->value,
                'url' => 'https://www.youtube.com/watch?v=new',
                'why_this_resource' => 'Even better.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('resources', [
            'id' => $resource->id,
            'title' => 'Updated Resource',
        ]);
    }

    public function test_mentor_can_delete_resource(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->for($module)->create();

        $this->actingAs($mentor)
            ->delete($this->resourceRoute('resources.destroy', $course, $module, $resource))
            ->assertRedirect();

        $this->assertDatabaseMissing('resources', ['id' => $resource->id]);
    }

    public function test_mentor_cannot_add_resource_to_another_mentors_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $this->actingAs($mentor)
            ->post($this->resourceRoute('resources.store', $course, $module), [
                'title' => 'Hacked',
                'type' => ResourceType::Text->value,
                'content' => 'Some content',
                'why_this_resource' => 'x',
            ])
            ->assertForbidden();
    }

    public function test_resource_ownership_enforced_by_module_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();
        $otherModule = Module::factory()->for($course)->create();
        $resource = Resource::factory()->for($otherModule)->create();

        $this->actingAs($mentor)
            ->delete($this->resourceRoute('resources.destroy', $course, $module, $resource))
            ->assertNotFound();
    }
}
