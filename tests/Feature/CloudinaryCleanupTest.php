<?php

namespace Tests\Feature;

use App\Enums\ResourceType;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CloudinaryCleanupTest extends TestCase
{
    use RefreshDatabase;

    private string $oldUrl = 'https://res.cloudinary.com/testcloud/image/upload/v1700000000/skill-evidence/old.jpg';

    private string $newUrl = 'https://res.cloudinary.com/testcloud/image/upload/v1700000001/skill-evidence/new.jpg';

    // ──────────────────────────────────────────────────────────────────────────
    // CloudinaryService unit tests
    // ──────────────────────────────────────────────────────────────────────────

    public function test_is_cloudinary_url_returns_true_for_cloudinary_urls(): void
    {
        $service = app(CloudinaryService::class);

        $this->assertTrue($service->isCloudinaryUrl($this->oldUrl));
    }

    public function test_is_cloudinary_url_returns_false_for_non_cloudinary_urls(): void
    {
        $service = app(CloudinaryService::class);

        $this->assertFalse($service->isCloudinaryUrl('https://youtube.com/watch?v=abc'));
        $this->assertFalse($service->isCloudinaryUrl('https://example.com/image.jpg'));
    }

    public function test_extracts_public_id_from_cloudinary_url(): void
    {
        $service = app(CloudinaryService::class);

        $this->assertSame(
            'skill-evidence/old',
            $service->extractPublicId($this->oldUrl),
        );
    }

    public function test_extracts_public_id_with_transformations(): void
    {
        $service = app(CloudinaryService::class);
        $url = 'https://res.cloudinary.com/testcloud/image/upload/w_300,h_200/v1700000000/folder/file.png';

        $this->assertSame('folder/file', $service->extractPublicId($url));
    }

    public function test_extract_public_id_returns_null_for_non_cloudinary_url(): void
    {
        $service = app(CloudinaryService::class);

        $this->assertNull($service->extractPublicId('https://example.com/image.jpg'));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Course thumbnail
    // ──────────────────────────────────────────────────────────────────────────

    public function test_old_thumbnail_deleted_when_course_thumbnail_updated(): void
    {
        Http::fake(['https://api.cloudinary.com/*' => Http::response(['result' => 'ok'])]);

        $course = Course::factory()->create(['thumbnail' => $this->oldUrl]);
        $course->update(['thumbnail' => $this->newUrl]);

        Http::assertSent(fn ($req) => str_contains($req->url(), 'cloudinary.com') &&
            $req->data()['public_id'] === 'skill-evidence/old');
    }

    public function test_no_cloudinary_call_when_thumbnail_unchanged(): void
    {
        Http::fake();

        $course = Course::factory()->create(['thumbnail' => $this->oldUrl]);
        $course->update(['title' => 'New Title']);

        Http::assertNothingSent();
    }

    public function test_no_cloudinary_call_when_thumbnail_was_null(): void
    {
        Http::fake();

        $course = Course::factory()->create(['thumbnail' => null]);
        $course->update(['thumbnail' => $this->newUrl]);

        Http::assertNothingSent();
    }

    public function test_thumbnail_deleted_when_course_deleted(): void
    {
        Http::fake(['https://api.cloudinary.com/*' => Http::response(['result' => 'ok'])]);

        $course = Course::factory()->create(['thumbnail' => $this->oldUrl]);
        $course->delete();

        Http::assertSent(fn ($req) => str_contains($req->url(), 'cloudinary.com'));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // User avatar
    // ──────────────────────────────────────────────────────────────────────────

    public function test_old_avatar_deleted_when_user_avatar_updated(): void
    {
        Http::fake(['https://api.cloudinary.com/*' => Http::response(['result' => 'ok'])]);

        $user = User::factory()->create(['avatar' => $this->oldUrl]);
        $user->update(['avatar' => $this->newUrl]);

        Http::assertSent(fn ($req) => str_contains($req->url(), 'cloudinary.com') &&
            $req->data()['public_id'] === 'skill-evidence/old');
    }

    public function test_no_cloudinary_call_when_avatar_unchanged(): void
    {
        Http::fake();

        $user = User::factory()->create(['avatar' => $this->oldUrl]);
        $user->update(['name' => 'New Name']);

        Http::assertNothingSent();
    }

    public function test_avatar_deleted_when_user_deleted(): void
    {
        Http::fake(['https://api.cloudinary.com/*' => Http::response(['result' => 'ok'])]);

        $user = User::factory()->create(['avatar' => $this->oldUrl]);
        $user->delete();

        Http::assertSent(fn ($req) => str_contains($req->url(), 'cloudinary.com'));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Resource (image type)
    // ──────────────────────────────────────────────────────────────────────────

    public function test_old_cloudinary_url_deleted_when_image_resource_url_updated(): void
    {
        Http::fake(['https://api.cloudinary.com/*' => Http::response(['result' => 'ok'])]);

        $module = Module::factory()->create();
        $resource = Resource::factory()->for($module)->create([
            'type' => ResourceType::Image,
            'url' => $this->oldUrl,
        ]);

        $resource->update(['url' => $this->newUrl]);

        Http::assertSent(fn ($req) => str_contains($req->url(), 'cloudinary.com') &&
            $req->data()['public_id'] === 'skill-evidence/old');
    }

    public function test_no_cloudinary_call_when_resource_url_is_non_cloudinary(): void
    {
        Http::fake();

        $module = Module::factory()->create();
        $resource = Resource::factory()->for($module)->create([
            'type' => ResourceType::Video,
            'url' => 'https://youtube.com/watch?v=abc',
        ]);

        $resource->update(['url' => 'https://youtube.com/watch?v=xyz']);

        Http::assertNothingSent();
    }

    public function test_cloudinary_image_deleted_when_resource_deleted(): void
    {
        Http::fake(['https://api.cloudinary.com/*' => Http::response(['result' => 'ok'])]);

        $module = Module::factory()->create();
        $resource = Resource::factory()->for($module)->create([
            'type' => ResourceType::Image,
            'url' => $this->oldUrl,
        ]);

        $resource->delete();

        Http::assertSent(fn ($req) => str_contains($req->url(), 'cloudinary.com'));
    }

    public function test_non_cloudinary_resource_url_not_deleted_on_resource_delete(): void
    {
        Http::fake();

        $module = Module::factory()->create();
        $resource = Resource::factory()->for($module)->create([
            'type' => ResourceType::Video,
            'url' => 'https://youtube.com/watch?v=abc',
        ]);

        $resource->delete();

        Http::assertNothingSent();
    }
}
