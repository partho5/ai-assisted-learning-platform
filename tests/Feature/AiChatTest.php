<?php

namespace Tests\Feature;

use App\Contracts\AiProvider;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiChatTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Platform chat
    // ──────────────────────────────────────────────

    public function test_guest_can_access_platform_chat(): void
    {
        $this->mockAiStreamChat('Hello! I can help you with SkillEvidence.');

        $this->postJson(route('chat.platform', ['locale' => 'en']), [
            'message' => 'What is SkillEvidence?',
        ])->assertOk()
            ->assertHeaderContains('Content-Type', 'text/event-stream');
    }

    public function test_authenticated_user_can_access_platform_chat(): void
    {
        $this->mockAiStreamChat('Happy to help!');

        $this->actingAs(User::factory()->learner()->create())
            ->postJson(route('chat.platform', ['locale' => 'en']), [
                'message' => 'How do I enroll in a course?',
            ])->assertOk();
    }

    public function test_platform_chat_validates_message_is_required(): void
    {
        $this->postJson(route('chat.platform', ['locale' => 'en']), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['message']);
    }

    public function test_platform_chat_validates_message_max_length(): void
    {
        $this->postJson(route('chat.platform', ['locale' => 'en']), [
            'message' => str_repeat('a', 2001),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['message']);
    }

    public function test_platform_chat_validates_history_role_enum(): void
    {
        $this->postJson(route('chat.platform', ['locale' => 'en']), [
            'message' => 'Hello',
            'history' => [
                ['role' => 'invalid_role', 'content' => 'Hi'],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['history.0.role']);
    }

    public function test_platform_chat_accepts_valid_history(): void
    {
        $this->mockAiStreamChat('Follow-up response.');

        $this->postJson(route('chat.platform', ['locale' => 'en']), [
            'message' => 'Tell me more',
            'history' => [
                ['role' => 'user', 'content' => 'What is SkillEvidence?'],
                ['role' => 'assistant', 'content' => 'It is a learning platform.'],
            ],
        ])->assertOk();
    }

    // ──────────────────────────────────────────────
    // Course chat
    // ──────────────────────────────────────────────

    public function test_guest_can_access_course_chat(): void
    {
        $this->mockAiStreamChat('This course covers the fundamentals.');

        $course = Course::factory()->create();

        $this->postJson(
            route('chat.course', ['locale' => 'en', 'course' => $course]),
            ['message' => 'What is this course about?'],
        )->assertOk()
            ->assertHeaderContains('Content-Type', 'text/event-stream');
    }

    public function test_authenticated_learner_can_access_course_chat(): void
    {
        $this->mockAiStreamChat('Happy to help!');

        $course = Course::factory()->create();

        $this->actingAs(User::factory()->learner()->create())
            ->postJson(
                route('chat.course', ['locale' => 'en', 'course' => $course]),
                ['message' => 'Who is this course for?'],
            )->assertOk();
    }

    public function test_course_chat_returns_404_for_nonexistent_course(): void
    {
        $this->postJson(
            route('chat.course', ['locale' => 'en', 'course' => 99999]),
            ['message' => 'Hello'],
        )->assertNotFound();
    }

    public function test_course_chat_validates_message_is_required(): void
    {
        $course = Course::factory()->create();

        $this->postJson(
            route('chat.course', ['locale' => 'en', 'course' => $course]),
            [],
        )->assertUnprocessable()
            ->assertJsonValidationErrors(['message']);
    }

    // ──────────────────────────────────────────────
    // Resource chat
    // ──────────────────────────────────────────────

    public function test_guest_can_access_resource_chat_for_free_resource(): void
    {
        $this->mockAiStreamChat('Great question about this resource!');

        [$course, $resource] = $this->createCourseWithResource(isFree: true);

        $this->postJson(
            route('chat.resource', ['locale' => 'en', 'course' => $course, 'resource' => $resource]),
            ['message' => 'Can you explain this topic?'],
        )->assertOk()
            ->assertHeaderContains('Content-Type', 'text/event-stream');
    }

    public function test_authenticated_learner_can_access_resource_chat(): void
    {
        $this->mockAiStreamChat('Sure, let me explain.');

        [$course, $resource] = $this->createCourseWithResource(isFree: false);

        $this->actingAs(User::factory()->learner()->create())
            ->postJson(
                route('chat.resource', ['locale' => 'en', 'course' => $course, 'resource' => $resource]),
                ['message' => 'I am confused about this.'],
            )->assertOk();
    }

    public function test_resource_chat_validates_message_is_required(): void
    {
        [$course, $resource] = $this->createCourseWithResource();

        $this->postJson(
            route('chat.resource', ['locale' => 'en', 'course' => $course, 'resource' => $resource]),
            [],
        )->assertUnprocessable()
            ->assertJsonValidationErrors(['message']);
    }

    public function test_resource_chat_returns_404_for_nonexistent_resource(): void
    {
        $course = Course::factory()->create();

        $this->postJson(
            route('chat.resource', ['locale' => 'en', 'course' => $course, 'resource' => 99999]),
            ['message' => 'Hello'],
        )->assertNotFound();
    }

    // ──────────────────────────────────────────────
    // Coaching trigger
    // ──────────────────────────────────────────────

    public function test_trigger_fires_for_platform_chat_and_does_not_persist_user_message(): void
    {
        $this->mockAiStreamChat('Welcome back! You have 40% progress on Python. Ready to continue?');

        $user = User::factory()->learner()->create();

        $this->actingAs($user)
            ->postJson(route('chat.platform', ['locale' => 'en']), [
                'message' => '__coach_open__',
                'is_trigger' => true,
                'context_key' => 'dashboard',
            ])->assertOk()
            ->assertHeaderContains('Content-Type', 'text/event-stream');

        // The hidden trigger token must never appear as a user message in the DB
        $this->assertDatabaseMissing('chat_messages', [
            'role' => 'user',
            'content' => '__coach_open__',
        ]);
    }

    public function test_trigger_fires_for_resource_chat(): void
    {
        $this->mockAiStreamChat('I see you\'re on Pandas DataFrames. What do you already know about tabular data?');

        [$course, $resource] = $this->createCourseWithResource(isFree: false);

        $this->actingAs(User::factory()->learner()->create())
            ->postJson(
                route('chat.resource', ['locale' => 'en', 'course' => $course, 'resource' => $resource]),
                [
                    'message' => '__coach_open__',
                    'is_trigger' => true,
                    'context_key' => "resource-{$resource->id}",
                ],
            )->assertOk();

        $this->assertDatabaseMissing('chat_messages', [
            'role' => 'user',
            'content' => '__coach_open__',
        ]);
    }

    public function test_coaching_mandate_appears_in_system_prompt_for_paid_user(): void
    {
        $meta = new \App\AiChat\ChatContextMeta(
            authStatus: 'authenticated',
            userTier: 'paid',
            courseAccess: 'none',
        );

        $prompt = \App\AiChat\PlatformChatContext::buildSystemPrompt($meta, collect(), false);

        $this->assertStringContainsString('Coaching Mandate', $prompt);
        $this->assertStringNotContainsString('Session Opener', $prompt);
    }

    public function test_coaching_mandate_absent_for_free_user(): void
    {
        $meta = new \App\AiChat\ChatContextMeta(
            authStatus: 'authenticated',
            userTier: 'free',
            courseAccess: 'none',
        );

        $prompt = \App\AiChat\PlatformChatContext::buildSystemPrompt($meta, collect(), false);

        $this->assertStringNotContainsString('Coaching Mandate', $prompt);
    }

    public function test_session_opener_appears_in_system_prompt_on_trigger(): void
    {
        $meta = new \App\AiChat\ChatContextMeta(
            authStatus: 'authenticated',
            userTier: 'paid',
            courseAccess: 'none',
        );

        $prompt = \App\AiChat\PlatformChatContext::buildSystemPrompt($meta, collect(), isTrigger: true);

        $this->assertStringContainsString('Coaching Mandate', $prompt);
        $this->assertStringContainsString('Session Opener', $prompt);
    }

    public function test_resource_context_includes_coaching_mandate_for_full_access(): void
    {
        $meta = new \App\AiChat\ChatContextMeta(
            authStatus: 'authenticated',
            userTier: 'free',
            courseAccess: 'full',
        );

        [$course, $resource] = $this->createCourseWithResource(isFree: false);
        $resource->load('module');

        $prompt = \App\AiChat\ResourceChatContext::buildSystemPrompt($resource, $course, $meta, collect(), isTrigger: false);

        $this->assertStringContainsString('Coaching Mandate', $prompt);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /** @return array{0: Course, 1: resource} */
    private function createCourseWithResource(bool $isFree = true): array
    {
        $course = Course::factory()->create();
        $module = Module::factory()->for($course)->create();
        $resource = Resource::factory()->for($module)->create(['is_free' => $isFree, 'type' => 'text']);

        return [$course, $resource];
    }

    private function mockAiStreamChat(string $response): void
    {
        $this->instance(AiProvider::class, new class($response) implements AiProvider
        {
            public function __construct(private readonly string $reply) {}

            /** @return array{score: int, explanation: string} */
            public function grade(string $questionBody, string $rubric, string $answer, int $maxPoints): array
            {
                return ['score' => 100, 'explanation' => 'Mock'];
            }

            public function hint(string $questionBody, string $answerDraft): string
            {
                return 'Mock hint';
            }

            /** @param array<int, array{role: 'user'|'assistant', content: string}> $history */
            public function streamChat(string $systemPrompt, array $history, callable $onChunk, string $model = 'gpt-4o-mini'): void
            {
                $onChunk($this->reply);
            }

            public function complete(string $systemPrompt, string $userMessage, string $model = 'gpt-4o-mini'): string
            {
                return 'Mock response';
            }

            /** @return float[] */
            public function embed(string $text): array
            {
                return array_fill(0, 512, 0.1);
            }
        });
    }
}
