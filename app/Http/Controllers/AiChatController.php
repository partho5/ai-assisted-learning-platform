<?php

namespace App\Http\Controllers;

use App\AiChat\ChatContextMeta;
use App\AiChat\CourseChatContext;
use App\AiChat\CoursesListChatContext;
use App\AiChat\PlatformChatContext;
use App\AiChat\ResourceChatContext;
use App\Contracts\AiProvider;
use App\Enums\EnrollmentAccess;
use App\Enums\UserTier;
use App\Http\Requests\AiChatRequest;
use App\Models\ChatSession;
use App\Models\Course;
use App\Models\Resource;
use App\Services\RagRetriever;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AiChatController extends Controller
{
    public function __construct(
        private readonly AiProvider $ai,
        private readonly RagRetriever $rag,
    ) {}

    /**
     * Platform assistant — available to all visitors, no auth required.
     */
    public function platform(AiChatRequest $request): StreamedResponse
    {
        $meta = $this->buildContextMeta($request);
        $courses = $request->validated('courses', []) ?? [];
        $message = $request->validated('message');

        // Courses list page uses its own context builder — no RAG needed (data already in prompt)
        if (! empty($courses)) {
            $systemPrompt = CoursesListChatContext::buildSystemPrompt($courses, $meta);
        } else {
            $ragResult = $this->rag->retrieve($message, null, null);
            $chunks = $this->chunksFromResult($ragResult);
            $systemPrompt = PlatformChatContext::buildSystemPrompt($meta, $chunks);
        }

        $session = $this->resolveSession($request, 'platform');
        $history = $this->buildHistory($request);

        return $this->stream($this->ai, $systemPrompt, $history, $session, $message);
    }

    /**
     * Course assistant — context-aware for the course show page.
     */
    public function course(AiChatRequest $request, Course $course): StreamedResponse
    {
        $course->load('modules.resources');
        $meta = $this->buildContextMeta($request, $course);
        $message = $request->validated('message');

        $ragResult = $this->rag->retrieve($message, 'course', $course->id);
        $chunks = $this->chunksFromResult($ragResult);
        $systemPrompt = CourseChatContext::buildSystemPrompt($course, $meta, $chunks);

        $session = $this->resolveSession($request, 'course');
        $history = $this->buildHistory($request);

        return $this->stream($this->ai, $systemPrompt, $history, $session, $message);
    }

    /**
     * Resource learning assistant — context-aware, auth optional.
     */
    public function resource(AiChatRequest $request, Course $course, Resource $resource): StreamedResponse
    {
        $resource->load('module');
        $meta = $this->buildContextMeta($request, $course);
        $message = $request->validated('message');

        $ragResult = $this->rag->retrieve($message, 'resource', $resource->id);

        // If resource-scoped retrieval returns nothing, fall back to course-scoped
        if ($ragResult['type'] === 'none') {
            $ragResult = $this->rag->retrieve($message, 'course', $course->id);
        }

        $chunks = $this->chunksFromResult($ragResult);
        $systemPrompt = ResourceChatContext::buildSystemPrompt($resource, $course, $meta, $chunks);

        $session = $this->resolveSession($request, 'resource');
        $history = $this->buildHistory($request);

        return $this->stream($this->ai, $systemPrompt, $history, $session, $message);
    }

    /**
     * Extract chunk collection from a RAG result, or null for FAQ hits (handled separately).
     */
    private function chunksFromResult(array $ragResult): ?Collection
    {
        if ($ragResult['type'] === 'faq') {
            // FAQ answers bypass the LLM entirely — return null to skip chunk injection
            // Note: FAQ interception before stream() would be the ideal place; for now,
            // return an empty collection so the prompt signals "no extra knowledge".
            return collect();
        }

        if (isset($ragResult['chunks'])) {
            return $ragResult['chunks'];
        }

        // type === 'none'
        return collect();
    }

    /**
     * @param  array<int, array{role: 'user'|'assistant', content: string}>  $history
     */
    private function stream(
        AiProvider $ai,
        string $systemPrompt,
        array $history,
        ?ChatSession $session,
        string $userMessage,
    ): StreamedResponse {
        // Persist user message immediately
        $session?->messages()->create(['role' => 'user', 'content' => $userMessage]);

        return response()->stream(function () use ($ai, $systemPrompt, $history, $session): void {
            $fullContent = '';

            $ai->streamChat(
                systemPrompt: $systemPrompt,
                history: $history,
                onChunk: function (string $chunk) use (&$fullContent): void {
                    $fullContent .= $chunk;
                    $encoded = json_encode(['chunk' => $chunk]);
                    echo "data: {$encoded}\n\n";
                    ob_flush();
                    flush();
                },
            );

            // Persist assistant reply after stream completes
            if ($session && $fullContent !== '') {
                $session->messages()->create(['role' => 'assistant', 'content' => $fullContent]);
            }

            echo "data: [DONE]\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Build the full message history including the new user message.
     *
     * @return array<int, array{role: 'user'|'assistant', content: string}>
     */
    private function buildHistory(AiChatRequest $request): array
    {
        $history = $request->validated('history', []) ?? [];
        $history[] = ['role' => 'user', 'content' => $request->validated('message')];

        return $history;
    }

    /**
     * Resolve auth status, user tier, and course enrollment access from the request.
     */
    private function buildContextMeta(Request $request, ?Course $course = null): ChatContextMeta
    {
        $user = $request->user();

        $authStatus = $user ? 'authenticated' : 'unauthenticated';

        $userTier = match ($user?->tier) {
            UserTier::Paid => 'paid',
            UserTier::Observer => 'observer',
            default => 'free',
        };

        $courseAccess = 'none';
        if ($course && $user) {
            $enrollment = $user->enrollments()->where('course_id', $course->id)->first();
            $courseAccess = match ($enrollment?->access_level) {
                EnrollmentAccess::Full => 'full',
                EnrollmentAccess::Observer => 'observer',
                default => 'none',
            };
        }

        return new ChatContextMeta($authStatus, $userTier, $courseAccess);
    }

    /**
     * Find or create the chat session for this request.
     * Returns null when neither user_id nor guest_user_id is available.
     */
    private function resolveSession(AiChatRequest $request, string $contextType): ?ChatSession
    {
        $userId = $request->user()?->id;
        $guestUserId = $request->validated('guest_user_id');

        if (! $userId && ! $guestUserId) {
            return null;
        }

        $contextKey = $request->validated('context_key') ?? $contextType;
        $contextUrl = $request->validated('context_url') ?? $request->url();

        return ChatSession::findOrCreateFor(
            userId: $userId,
            guestUserId: $guestUserId,
            context: [
                'context_type' => $contextType,
                'context_key' => $contextKey,
                'context_url' => $contextUrl,
            ],
        );
    }
}
