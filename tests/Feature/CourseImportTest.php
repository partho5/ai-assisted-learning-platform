<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CourseImportTest extends TestCase
{
    use RefreshDatabase;

    private function jsonFile(string $name, mixed $data): UploadedFile
    {
        $content = is_string($data) ? $data : json_encode($data);

        return UploadedFile::fake()->createWithContent($name, $content);
    }

    public function test_mentor_can_import_modules_with_nested_lessons(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $payload = [
            [
                'type' => 'module',
                'title' => 'Getting Started',
                'description' => 'Intro module',
                'lessons' => [
                    [
                        'type' => 'lesson',
                        'title' => 'What is X',
                        'resource_type' => 'text',
                        'importance' => 'Foundational concept',
                        'content' => 'Some lesson content',
                    ],
                    [
                        'type' => 'lesson',
                        'title' => 'Assignment 1',
                        'resource_type' => 'assignment',
                        'content' => 'Do the thing',
                    ],
                ],
            ],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('import.json', $payload),
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('modules', [
            'course_id' => $course->id,
            'title' => 'Getting Started',
        ]);

        $module = Module::where('course_id', $course->id)->where('title', 'Getting Started')->firstOrFail();
        $this->assertStringContainsString('Intro module', $module->description ?? '');

        $this->assertDatabaseHas('resources', [
            'module_id' => $module->id,
            'title' => 'What is X',
            'type' => 'text',
        ]);
        $lesson = $module->resources()->where('title', 'What is X')->firstOrFail();
        $this->assertStringContainsString('Some lesson content', $lesson->content);

        $this->assertDatabaseHas('resources', [
            'module_id' => $module->id,
            'title' => 'Assignment 1',
            'type' => 'assignment',
        ]);
    }

    public function test_mentor_can_import_lessons_into_existing_module(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $payload = [
            ['type' => 'lesson', 'title' => 'Lesson A', 'resource_type' => 'text', 'content' => 'A content'],
            ['type' => 'lesson', 'title' => 'Lesson B', 'resource_type' => 'assignment', 'content' => 'B content'],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('lessons.json', $payload),
                'module_id' => $module->id,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('resources', ['module_id' => $module->id, 'title' => 'Lesson A']);
        $this->assertDatabaseHas('resources', ['module_id' => $module->id, 'title' => 'Lesson B']);
    }

    public function test_lessons_only_file_without_module_id_is_rejected(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $payload = [
            ['type' => 'lesson', 'title' => 'Orphan Lesson', 'resource_type' => 'text', 'content' => 'x'],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('lessons.json', $payload),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseMissing('resources', ['title' => 'Orphan Lesson']);
    }

    public function test_module_id_must_belong_to_the_target_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $otherCourse = Course::factory()->for($mentor, 'mentor')->create();
        $foreignModule = Module::factory()->for($otherCourse)->create();

        $payload = [
            ['type' => 'lesson', 'title' => 'Sneaky Lesson', 'resource_type' => 'text', 'content' => 'x'],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('lessons.json', $payload),
                'module_id' => $foreignModule->id,
            ])
            ->assertSessionHasErrors('module_id');

        $this->assertDatabaseMissing('resources', ['title' => 'Sneaky Lesson']);
    }

    public function test_malformed_json_is_rejected(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('bad.json', '{not valid json'),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('modules', 0);
    }

    public function test_oversized_file_is_rejected(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $huge = UploadedFile::fake()->create('huge.json', 2048, 'application/json');

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $huge,
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('modules', 0);
    }

    public function test_non_json_extension_is_rejected(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $payload = [['type' => 'module', 'title' => 'Sneaky Module']];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('data.txt', $payload),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('modules', 0);
    }

    public function test_disallowed_resource_type_is_rejected(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $payload = [
            [
                'type' => 'module',
                'title' => 'Video Module',
                'lessons' => [
                    ['type' => 'lesson', 'title' => 'A Video', 'resource_type' => 'video'],
                ],
            ],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('video.json', $payload),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('modules', 0);
        $this->assertDatabaseCount('resources', 0);
    }

    public function test_import_is_all_or_nothing_when_one_item_is_invalid(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $payload = [
            [
                'type' => 'module',
                'title' => 'Valid Module',
                'lessons' => [
                    ['type' => 'lesson', 'title' => 'Good Lesson', 'resource_type' => 'text', 'content' => 'x'],
                ],
            ],
            [
                'type' => 'module',
                'title' => '', // invalid: title required
            ],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('mixed.json', $payload),
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseMissing('modules', ['title' => 'Valid Module']);
        $this->assertDatabaseCount('modules', 0);
        $this->assertDatabaseCount('resources', 0);
    }

    public function test_mixed_top_level_types_are_rejected(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();
        $module = Module::factory()->for($course)->create();

        $payload = [
            ['type' => 'module', 'title' => 'A Module'],
            ['type' => 'lesson', 'title' => 'A Lesson', 'resource_type' => 'text', 'content' => 'x'],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('mixed.json', $payload),
                'module_id' => $module->id,
            ])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('modules', 1); // only the factory-created one
    }

    public function test_imported_html_content_is_sanitized(): void
    {
        $mentor = User::factory()->mentor()->create();
        $course = Course::factory()->for($mentor, 'mentor')->create();

        $payload = [
            [
                'type' => 'module',
                'title' => 'Security Module',
                'description' => '<script>alert(1)</script>Safe text',
                'lessons' => [
                    [
                        'type' => 'lesson',
                        'title' => 'XSS Lesson',
                        'resource_type' => 'text',
                        'importance' => '<img src=x onerror=alert(1)>Why it matters',
                        'content' => '<p onclick="alert(1)">Hello <script>alert(2)</script>world</p>',
                    ],
                ],
            ],
        ];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('xss.json', $payload),
            ])
            ->assertSessionHasNoErrors();

        $module = Module::where('course_id', $course->id)->firstOrFail();
        $this->assertStringNotContainsString('<script>', $module->description ?? '');
        $this->assertStringContainsString('Safe text', $module->description ?? '');

        $resource = $module->resources()->firstOrFail();
        $this->assertStringNotContainsString('<script>', $resource->content);
        $this->assertStringNotContainsString('onclick', $resource->content);
        $this->assertStringContainsString('Hello', $resource->content);
        $this->assertStringNotContainsString('onerror', $resource->why_this_resource);
    }

    public function test_mentor_cannot_import_into_another_mentors_course(): void
    {
        $mentor = User::factory()->mentor()->create();
        $other = User::factory()->mentor()->create();
        $course = Course::factory()->for($other, 'mentor')->create();

        $payload = [['type' => 'module', 'title' => 'Hacked Module']];

        $this->actingAs($mentor)
            ->post(route('courses.import', ['course' => $course->slug]), [
                'file' => $this->jsonFile('hack.json', $payload),
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('modules', 0);
    }
}
