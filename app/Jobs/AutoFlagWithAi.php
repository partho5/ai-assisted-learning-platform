<?php

namespace App\Jobs;

use App\Contracts\AiProvider;
use App\Enums\ForumReportReason;
use App\Models\AiMember;
use App\Models\ForumReply;
use App\Models\ForumReport;
use App\Models\ForumThread;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class AutoFlagWithAi implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $backoff = 15;

    /**
     * @param  class-string<ForumThread|ForumReply>  $contentType
     */
    public function __construct(
        public readonly string $contentType,
        public readonly int $contentId,
    ) {}

    public function handle(AiProvider $ai): void
    {
        $moderators = AiMember::query()
            ->where('is_active', true)
            ->where('is_moderator', true)
            ->with('user:id,name')
            ->get();

        if ($moderators->isEmpty()) {
            return;
        }

        /** @var ForumThread|ForumReply|null $content */
        $content = $this->contentType::find($this->contentId);

        if (! $content) {
            return;
        }

        $body = strip_tags($content instanceof ForumThread ? $content->title.' '.$content->body : $content->body);

        foreach ($moderators as $moderator) {
            $this->evaluateContent($ai, $moderator, $content, $body);
        }
    }

    public function failed(Throwable $exception): void
    {
        // Silently fail — auto-flagging is best-effort
    }

    private function evaluateContent(AiProvider $ai, AiMember $moderator, Model $content, string $body): void
    {
        $systemPrompt = $moderator->persona_prompt ?? 'You are a content moderation assistant.';

        $systemPrompt .= <<<'PROMPT'


You must evaluate forum content for policy violations.
Respond ONLY with valid JSON in this exact format:
{"flag": true|false, "reason": "spam"|"misinformation"|"off_topic"|"inappropriate"|null, "explanation": "<one sentence>"}

Flag content that contains: spam, self-promotion, hate speech, harassment, misinformation, or is clearly off-topic.
If content is acceptable, return {"flag": false, "reason": null, "explanation": "Content is acceptable."}.
PROMPT;

        $userMessage = "Please evaluate this forum content:\n\n{$body}";

        try {
            $responseText = $ai->complete($systemPrompt, $userMessage);
            $result = json_decode($responseText, true) ?? [];
        } catch (Throwable) {
            return;
        }

        if (! ($result['flag'] ?? false)) {
            return;
        }

        $reason = $this->mapReason($result['reason'] ?? null);

        // Create report on behalf of the AI moderator user
        ForumReport::firstOrCreate(
            [
                'user_id' => $moderator->user_id,
                'reportable_type' => $this->contentType,
                'reportable_id' => $this->contentId,
            ],
            ['reason' => $reason]
        );
    }

    private function mapReason(?string $reason): ForumReportReason
    {
        return match ($reason) {
            'spam' => ForumReportReason::Spam,
            'misinformation' => ForumReportReason::Misinformation,
            'off_topic' => ForumReportReason::OffTopic,
            default => ForumReportReason::Inappropriate,
        };
    }
}
