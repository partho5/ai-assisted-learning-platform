<?php

namespace App\Services;

use App\Contracts\AiProvider;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAiProvider implements AiProvider
{
    private string $apiKey;

    private string $model;

    private string $endpoint = 'https://api.openai.com/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = (string) config('services.openai.key', '');
        $this->model = (string) config('services.openai.model', 'gpt-4o-mini');
    }

    /**
     * @return array{score: int, explanation: string}
     */
    public function grade(string $questionBody, string $rubric, string $answer, int $maxPoints): array
    {
        $systemPrompt = <<<PROMPT
You are an expert evaluator for a skill-based learning platform.

Question: {$questionBody}
Maximum points: {$maxPoints}
Grading rubric: {$rubric}

Return ONLY valid JSON in this exact format:
{"score": <integer 0 to 100>, "explanation": "<one or two sentences>"}

Score 100 means fully correct. Score 0 means entirely wrong.
Do not include any other text outside the JSON object.
PROMPT;

        $response = Http::withToken($this->apiKey)
            ->timeout(60)
            ->post($this->endpoint, [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $answer ?: '(no answer provided)'],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('AI grading failed: '.$response->body());
        }

        $content = $response->json('choices.0.message.content', '{}');
        $result = json_decode($content, true) ?? [];

        return [
            'score' => (int) ($result['score'] ?? 0),
            'explanation' => (string) ($result['explanation'] ?? ''),
        ];
    }

    public function hint(string $questionBody, string $answerDraft): string
    {
        $systemPrompt = <<<PROMPT
You are a helpful tutor on a skill-based learning platform.

A learner is working on this question:
{$questionBody}

Provide a short Socratic hint (2-3 sentences) that guides them toward the answer WITHOUT revealing it.
Focus on the concept, not the exact answer.
PROMPT;

        $userContent = $answerDraft
            ? "My current answer is: {$answerDraft}\n\nCan you give me a hint?"
            : "I'm not sure where to start. Can you give me a hint?";

        $response = Http::withToken($this->apiKey)
            ->timeout(30)
            ->post($this->endpoint, [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userContent],
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('AI hint failed: '.$response->body());
        }

        return $response->json('choices.0.message.content', 'I am not able to provide a hint right now. Please try again.');
    }

    /**
     * @param  array<int, array{role: 'user'|'assistant', content: string}>  $history
     */
    public function streamChat(string $systemPrompt, array $history, callable $onChunk, string $model = 'gpt-4o-mini'): void
    {
        $messages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $history,
        );

        $response = Http::withToken($this->apiKey)
            ->withOptions(['stream' => true])
            ->timeout(120)
            ->post($this->endpoint, [
                'model' => $model,
                'messages' => $messages,
                'stream' => true,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('AI chat stream failed: '.$response->body());
        }

        $body = $response->getBody();

        while (! $body->eof()) {
            $line = '';

            while (! $body->eof()) {
                $char = $body->read(1);
                if ($char === "\n") {
                    break;
                }
                $line .= $char;
            }

            $line = trim($line);

            if (! str_starts_with($line, 'data: ')) {
                continue;
            }

            $data = substr($line, 6);

            if ($data === '[DONE]') {
                break;
            }

            $chunk = json_decode($data, true);
            $content = $chunk['choices'][0]['delta']['content'] ?? null;

            if ($content !== null) {
                $onChunk($content);
            }
        }
    }
}
