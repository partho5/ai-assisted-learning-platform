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
}
