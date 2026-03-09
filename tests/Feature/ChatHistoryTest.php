<?php

namespace Tests\Feature;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatHistoryTest extends TestCase
{
    use RefreshDatabase;

    private const string GUEST_ID = 'abc123.xyz789';

    // ──────────────────────────────────────────────
    // GET history — guest
    // ──────────────────────────────────────────────

    public function test_guest_gets_empty_history_when_no_session_exists(): void
    {
        $this->getJson(route('chat.history.index', ['locale' => 'en']).'?context_key=platform&guest_user_id='.self::GUEST_ID)
            ->assertOk()
            ->assertJson(['messages' => [], 'has_more' => false]);
    }

    public function test_guest_can_retrieve_their_history(): void
    {
        $session = ChatSession::factory()->create([
            'guest_user_id' => self::GUEST_ID,
            'user_id' => null,
            'context_key' => 'platform',
        ]);

        ChatMessage::factory()->for($session, 'session')->create(['role' => 'user', 'content' => 'Hello']);
        ChatMessage::factory()->for($session, 'session')->create(['role' => 'assistant', 'content' => 'Hi there!']);

        $this->getJson(route('chat.history.index', ['locale' => 'en']).'?context_key=platform&guest_user_id='.self::GUEST_ID)
            ->assertOk()
            ->assertJsonCount(2, 'messages')
            ->assertJsonFragment(['content' => 'Hello'])
            ->assertJsonFragment(['content' => 'Hi there!']);
    }

    public function test_guest_cannot_see_another_guests_history(): void
    {
        $session = ChatSession::factory()->create([
            'guest_user_id' => 'other-guest.id',
            'user_id' => null,
            'context_key' => 'platform',
        ]);

        ChatMessage::factory()->for($session, 'session')->create(['content' => 'Secret']);

        $this->getJson(route('chat.history.index', ['locale' => 'en']).'?context_key=platform&guest_user_id='.self::GUEST_ID)
            ->assertOk()
            ->assertJsonCount(0, 'messages');
    }

    // ──────────────────────────────────────────────
    // GET history — authenticated user
    // ──────────────────────────────────────────────

    public function test_authenticated_user_can_retrieve_their_history(): void
    {
        $user = User::factory()->learner()->create();
        $session = ChatSession::factory()->forUser($user)->create(['context_key' => 'platform']);
        ChatMessage::factory()->for($session, 'session')->create(['role' => 'user', 'content' => 'Auth message']);

        $this->actingAs($user)
            ->getJson(route('chat.history.index', ['locale' => 'en']).'?context_key=platform')
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonFragment(['content' => 'Auth message']);
    }

    public function test_authenticated_user_cannot_see_another_users_history(): void
    {
        $userA = User::factory()->learner()->create();
        $userB = User::factory()->learner()->create();

        $session = ChatSession::factory()->forUser($userA)->create(['context_key' => 'platform']);
        ChatMessage::factory()->for($session, 'session')->create(['content' => 'User A secret']);

        $this->actingAs($userB)
            ->getJson(route('chat.history.index', ['locale' => 'en']).'?context_key=platform')
            ->assertOk()
            ->assertJsonCount(0, 'messages');
    }

    // ──────────────────────────────────────────────
    // GET history — pagination
    // ──────────────────────────────────────────────

    public function test_history_returns_oldest_first_within_page(): void
    {
        $session = ChatSession::factory()->create([
            'guest_user_id' => self::GUEST_ID,
            'user_id' => null,
            'context_key' => 'platform',
        ]);

        $first = ChatMessage::factory()->for($session, 'session')->create(['content' => 'First']);
        $second = ChatMessage::factory()->for($session, 'session')->create(['content' => 'Second']);

        $data = $this->getJson(
            route('chat.history.index', ['locale' => 'en']).'?context_key=platform&guest_user_id='.self::GUEST_ID,
        )->assertOk()->json();

        $this->assertSame('First', $data['messages'][0]['content']);
        $this->assertSame('Second', $data['messages'][1]['content']);
    }

    public function test_history_pagination_cursor_loads_older_messages(): void
    {
        $session = ChatSession::factory()->create([
            'guest_user_id' => self::GUEST_ID,
            'user_id' => null,
            'context_key' => 'platform',
        ]);

        // Create 25 messages so pagination kicks in (page size = 20)
        $messages = ChatMessage::factory()->for($session, 'session')->count(25)->create();
        $oldestId = $messages->first()->id;

        // First page (latest 20)
        $page1 = $this->getJson(
            route('chat.history.index', ['locale' => 'en']).'?context_key=platform&guest_user_id='.self::GUEST_ID,
        )->assertOk()->json();

        $this->assertCount(20, $page1['messages']);
        $this->assertTrue($page1['has_more']);

        // Load older using the first message's id as cursor
        $cursor = $page1['messages'][0]['id'];
        $page2 = $this->getJson(
            route('chat.history.index', ['locale' => 'en']).'?context_key=platform&guest_user_id='.self::GUEST_ID.'&before_id='.$cursor,
        )->assertOk()->json();

        $this->assertCount(5, $page2['messages']);
        $this->assertFalse($page2['has_more']);
        $this->assertSame($oldestId, $page2['messages'][0]['id']);
    }

    public function test_history_requires_context_key(): void
    {
        $this->getJson(route('chat.history.index', ['locale' => 'en']).'?guest_user_id='.self::GUEST_ID)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['context_key']);
    }

    // ──────────────────────────────────────────────
    // DELETE history
    // ──────────────────────────────────────────────

    public function test_guest_can_delete_their_history(): void
    {
        $session = ChatSession::factory()->create([
            'guest_user_id' => self::GUEST_ID,
            'user_id' => null,
            'context_key' => 'platform',
        ]);

        ChatMessage::factory()->for($session, 'session')->count(3)->create();

        $this->deleteJson(
            route('chat.history.destroy', ['locale' => 'en']).'?context_key=platform&guest_user_id='.self::GUEST_ID,
        )->assertOk()->assertJson(['ok' => true]);

        $this->assertDatabaseCount('chat_messages', 0);
    }

    public function test_authenticated_user_can_delete_their_history(): void
    {
        $user = User::factory()->learner()->create();
        $session = ChatSession::factory()->forUser($user)->create(['context_key' => 'platform']);
        ChatMessage::factory()->for($session, 'session')->count(2)->create();

        $this->actingAs($user)
            ->deleteJson(route('chat.history.destroy', ['locale' => 'en']).'?context_key=platform')
            ->assertOk();

        $this->assertDatabaseCount('chat_messages', 0);
    }

    // ──────────────────────────────────────────────
    // Message persistence via chat endpoints
    // ──────────────────────────────────────────────

    public function test_guest_chat_saves_messages_when_guest_user_id_provided(): void
    {
        $this->mockAiStreamChat('Hello!');

        $response = $this->postJson(route('chat.platform', ['locale' => 'en']), [
            'message' => 'Hi there',
            'guest_user_id' => self::GUEST_ID,
            'context_key' => 'platform',
            'context_url' => 'http://localhost/en/',
        ]);

        $response->assertOk();
        $response->streamedContent(); // execute the stream closure so the assistant message is saved

        $this->assertDatabaseHas('chat_messages', ['role' => 'user', 'content' => 'Hi there']);
        $this->assertDatabaseHas('chat_messages', ['role' => 'assistant', 'content' => 'Hello!']);
    }

    public function test_chat_does_not_save_when_no_identity_provided(): void
    {
        $this->mockAiStreamChat('Hello!');

        $response = $this->postJson(route('chat.platform', ['locale' => 'en']), [
            'message' => 'Hi there',
        ]);

        $response->assertOk();
        $response->streamedContent();

        $this->assertDatabaseCount('chat_messages', 0);
    }

    public function test_authenticated_user_chat_saves_messages(): void
    {
        $this->mockAiStreamChat('Welcome!');
        $user = User::factory()->learner()->create();

        $response = $this->actingAs($user)->postJson(route('chat.platform', ['locale' => 'en']), [
            'message' => 'Hello',
            'context_key' => 'platform',
            'context_url' => 'http://localhost/en/',
        ]);

        $response->assertOk();
        $response->streamedContent();

        $session = ChatSession::where('user_id', $user->id)->first();
        $this->assertNotNull($session);
        $this->assertDatabaseHas('chat_messages', ['chat_session_id' => $session->id, 'role' => 'user']);
        $this->assertDatabaseHas('chat_messages', ['chat_session_id' => $session->id, 'role' => 'assistant']);
    }

    // ──────────────────────────────────────────────
    // Guest merge on registration
    // ──────────────────────────────────────────────

    public function test_guest_history_is_merged_on_registration(): void
    {
        // Seed guest sessions
        $session = ChatSession::factory()->create([
            'guest_user_id' => self::GUEST_ID,
            'user_id' => null,
            'context_key' => 'platform',
        ]);
        ChatMessage::factory()->for($session, 'session')->count(2)->create();

        // Register with guest_user_id
        $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'newuser@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'learner',
            'guest_user_id' => self::GUEST_ID,
        ]);

        $user = User::where('email', 'newuser@example.com')->first();
        $this->assertNotNull($user);

        // Sessions should now belong to the user, not the guest
        $this->assertDatabaseHas('chat_sessions', [
            'user_id' => $user->id,
            'guest_user_id' => null,
            'context_key' => 'platform',
        ]);
        $this->assertDatabaseCount('chat_messages', 2);
    }

    public function test_registration_without_guest_user_id_does_not_fail(): void
    {
        $this->post(route('register.store'), [
            'name' => 'Another User',
            'email' => 'another@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'learner',
        ])->assertRedirect();

        $this->assertDatabaseCount('chat_sessions', 0);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    private function mockAiStreamChat(string $response): void
    {
        $this->instance(\App\Contracts\AiProvider::class, new class($response) implements \App\Contracts\AiProvider
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
        });
    }
}
