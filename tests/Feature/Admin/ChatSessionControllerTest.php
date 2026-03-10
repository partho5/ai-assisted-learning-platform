<?php

namespace Tests\Feature\Admin;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatSessionControllerTest extends TestCase
{
    use RefreshDatabase;

    private function chatSessionRoute(int $sessionId): string
    {
        return route('admin.chats.show', ['locale' => 'en', 'chatSession' => $sessionId]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $session = ChatSession::factory()->create();

        $this->get($this->chatSessionRoute($session->id))
            ->assertRedirect(route('login'));
    }

    public function test_learner_is_forbidden(): void
    {
        $learner = User::factory()->create();
        $session = ChatSession::factory()->create();

        $this->actingAs($learner)
            ->get($this->chatSessionRoute($session->id))
            ->assertForbidden();
    }

    public function test_mentor_is_forbidden(): void
    {
        $mentor = User::factory()->mentor()->create();
        $session = ChatSession::factory()->create();

        $this->actingAs($mentor)
            ->get($this->chatSessionRoute($session->id))
            ->assertForbidden();
    }

    public function test_admin_can_view_chat_session_with_messages(): void
    {
        $admin = User::factory()->admin()->create();
        $learner = User::factory()->create();

        $session = ChatSession::factory()->forUser($learner)->create([
            'context_type' => 'platform',
            'context_key' => 'platform',
        ]);
        ChatMessage::factory()->create([
            'chat_session_id' => $session->id,
            'role' => 'user',
            'content' => 'Hello, what is this platform?',
        ]);
        ChatMessage::factory()->create([
            'chat_session_id' => $session->id,
            'role' => 'assistant',
            'content' => 'This is a skill evidence platform!',
        ]);

        $this->actingAs($admin)
            ->get($this->chatSessionRoute($session->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/chats/show')
                ->where('session.id', $session->id)
                ->where('session.identity.type', 'user')
                ->where('session.identity.name', $learner->name)
                ->where('session.context_type', 'platform')
                ->has('session.messages', 2)
                ->where('session.messages.0.role', 'user')
                ->where('session.messages.0.content', 'Hello, what is this platform?')
                ->where('session.messages.1.role', 'assistant')
            );
    }

    public function test_admin_can_view_guest_chat_session(): void
    {
        $admin = User::factory()->admin()->create();
        $session = ChatSession::factory()->create([
            'context_type' => 'course',
            'context_key' => 'course:5',
        ]);

        $this->actingAs($admin)
            ->get($this->chatSessionRoute($session->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/chats/show')
                ->where('session.identity.type', 'guest')
                ->where('session.identity.name', 'Guest')
                ->where('session.context_type', 'course')
            );
    }

    public function test_messages_are_returned_in_chronological_order(): void
    {
        $admin = User::factory()->admin()->create();
        $session = ChatSession::factory()->create();

        $msg2 = ChatMessage::factory()->create(['chat_session_id' => $session->id, 'role' => 'assistant', 'created_at' => now()]);
        $msg1 = ChatMessage::factory()->create(['chat_session_id' => $session->id, 'role' => 'user', 'created_at' => now()->subMinute()]);

        $this->actingAs($admin)
            ->get($this->chatSessionRoute($session->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('session.messages.0.id', $msg1->id)
                ->where('session.messages.1.id', $msg2->id)
            );
    }
}
