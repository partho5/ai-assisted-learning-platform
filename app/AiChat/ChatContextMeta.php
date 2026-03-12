<?php

namespace App\AiChat;

readonly class ChatContextMeta
{
    public function __construct(
        /** authenticated | unauthenticated */
        public string $authStatus,
        /** free | observer | paid */
        public string $userTier,
        /** none | observer | full — only relevant when a course is in context */
        public string $courseAccess = 'none',
        /** Null for guests — no progress context injected */
        public ?UserProgressSummary $progress = null,
    ) {}

    /**
     * Coaching mode is active for paid-tier users or learners with full course access.
     * In coaching mode the bot acts as a proactive tutor, not a passive Q&A assistant.
     */
    public function isCoachingMode(): bool
    {
        return $this->userTier === 'paid' || $this->courseAccess === 'full';
    }

    /**
     * Single-line context injection used in every system prompt template.
     */
    public function toContextLine(): string
    {
        $line = "User: {$this->authStatus}. Tier: {$this->userTier}.";

        if ($this->courseAccess !== 'none') {
            $line .= " Course access: {$this->courseAccess}.";
        }

        return $line;
    }
}
