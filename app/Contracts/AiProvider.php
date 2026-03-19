<?php

namespace App\Contracts;

interface AiProvider
{
    /**
     * Grade a learner's answer using AI.
     *
     * @return array{score: int, explanation: string}
     */
    public function grade(string $questionBody, string $rubric, string $answer, int $maxPoints): array;

    /**
     * Provide a Socratic hint for a learner without revealing the answer.
     */
    public function hint(string $questionBody, string $answerDraft): string;

    /**
     * Stream a chat response chunk by chunk via a callback.
     *
     * @param  array<int, array{role: 'user'|'assistant', content: string}>  $history
     */
    public function streamChat(string $systemPrompt, array $history, callable $onChunk, string $model = 'gpt-4o-mini'): void;

    /**
     * Generate a single text completion given a system prompt and user message.
     * Returns the assistant's reply as a plain string.
     */
    public function complete(string $systemPrompt, string $userMessage, string $model = 'gpt-4o-mini'): string;

    /**
     * Generate a 512-dimension embedding vector for the given text.
     * Results are cached by content hash + model name (TTL 24h) to avoid redundant API calls.
     *
     * @return float[]
     */
    public function embed(string $text): array;
}
