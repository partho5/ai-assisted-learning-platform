<?php

namespace App\AiChat;

use App\Models\Course;
use App\Models\Resource;
use Illuminate\Support\Collection;

class ResourceChatContext
{
    public static function buildSystemPrompt(Resource $resource, Course $course, ChatContextMeta $meta, ?Collection $chunks = null, bool $isTrigger = false): string
    {
        $appName = config('app.name', 'SkillEvidence');
        $resourceType = $resource->type instanceof \App\Enums\ResourceType
            ? $resource->type->value
            : (string) $resource->type;

        $lines = [
            "You are a helpful learning assistant for {$appName}.",
            '',
            '## User Context',
            $meta->toContextLine(),
        ];

        // Progress snapshot scoped to this course — single extension point for future signals
        $progressSection = $meta->progress?->toPromptSection($course->title);
        if ($progressSection) {
            $lines[] = '';
            $lines[] = $progressSection;
        }

        $lines[] = '';
        $lines[] = '## Current Learning Context';
        $lines[] = "Course: {$course->title}";
        $lines[] = "Resource: {$resource->title} ({$resourceType})";

        if ($resource->why_this_resource) {
            $lines[] = "Why this resource: {$resource->why_this_resource}";
        }

        if ($resource->mentor_note) {
            $lines[] = "Mentor note: {$resource->mentor_note}";
        }

        // RAG-retrieved chunks replace the old hardcoded 3000-char content dump.
        // Only the most relevant sections are retrieved — saves tokens on every call.
        if ($chunks && $chunks->isNotEmpty()) {
            $lines[] = '';
            $lines[] = '## Relevant Content';
            $lines[] = 'Answer questions using ONLY the following retrieved content from this resource and course.';
            $lines[] = 'For general learning questions or clarifications, you may draw on your own knowledge.';
            foreach ($chunks as $chunk) {
                $lines[] = '';
                $lines[] = '---';
                $lines[] = trim($chunk->chunk_text);
            }
        } elseif ($resourceType === 'text' && $resource->content) {
            // Fallback: resource not yet indexed — use direct content (graceful degradation)
            $plainText = strip_tags($resource->content);
            $plainText = preg_replace('/\s+/', ' ', $plainText) ?? $plainText;
            $plainText = trim(mb_substr($plainText, 0, 3000));
            $lines[] = '';
            $lines[] = '## Resource Content';
            $lines[] = $plainText;
        }

        if ($meta->isCoachingMode()) {
            $lines[] = '';
            $lines[] = '## Coaching Mandate';
            $lines[] = 'You are a dedicated learning coach, not a passive Q&A bot. You have an agenda: move this learner forward.';
            $lines[] = '- End EVERY response with a concrete next step (finish this resource, attempt the test, revisit a weak area, move to the next module).';
            $lines[] = '- Before giving away an explanation, probe first — ask what they already understand to find the exact gap.';
            $lines[] = '- After explaining, follow up: "Can you put that in your own words?" or "Want me to test you on this before you move on?"';
            $lines[] = '- Never end with "Let me know if you have questions." End with a directive or a specific question that creates momentum.';
            $lines[] = '- If they go off-topic, answer briefly then redirect: "Now, back to [topic] — [next step]."';
            $lines[] = '- High expectations, warm support. They paid for real learning — deliver it.';
        }

        $lines[] = '';

        if ($isTrigger) {
            $lines[] = '## Session Opener';
            $lines[] = 'The learner just opened this chat (system-initiated). Do NOT wait for them to ask something.';
            $lines[] = 'Generate a 2–3 sentence coaching opener that:';
            $lines[] = '1. Acknowledges exactly where they are (this specific resource and their progress if known).';
            $lines[] = '2. Ends with ONE concrete directive or question to engage them immediately.';
            $lines[] = 'Do NOT say "How can I help?" or "What would you like to know?" — you lead this session.';
        } else {
            $lines[] = '## Your Role';
            $lines[] = '- Help the learner understand concepts from this resource';
            $lines[] = '- Give real-world examples, analogies, and clarifications';
            $lines[] = '- Answer follow-up questions and help them go deeper';
            $lines[] = '- If the resource is a video or article you cannot read, use the title and context above to guide your answers';
            $lines[] = '- NEVER reveal test answers, rubrics, or grading criteria';
            $lines[] = '- Keep responses concise (under 250 words) unless a detailed explanation is genuinely needed';
            $lines[] = '- Use markdown for code blocks and bullet points when helpful';
        }

        return implode("\n", $lines);
    }
}
