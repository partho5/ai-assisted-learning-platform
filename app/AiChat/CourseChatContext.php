<?php

namespace App\AiChat;

use App\Models\Course;
use Illuminate\Support\Collection;

class CourseChatContext
{
    public static function buildSystemPrompt(Course $course, ChatContextMeta $meta, ?Collection $chunks = null, bool $isTrigger = false): string
    {
        $appName = config('app.name', 'SkillEvidence');

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
        $lines[] = '## Course Being Viewed';
        $lines[] = "Title: {$course->title}";

        if ($course->description) {
            $plain = trim(mb_substr(preg_replace('/\s+/', ' ', strip_tags($course->description)), 0, 500));
            $lines[] = "Description: {$plain}";
        }

        if ($course->what_you_will_learn) {
            $plain = trim(mb_substr(preg_replace('/\s+/', ' ', strip_tags($course->what_you_will_learn)), 0, 300));
            $lines[] = "What you will learn: {$plain}";
        }

        if ($course->prerequisites) {
            $plain = trim(mb_substr(preg_replace('/\s+/', ' ', strip_tags($course->prerequisites)), 0, 200));
            $lines[] = "Prerequisites: {$plain}";
        }

        if ($course->modules->isNotEmpty()) {
            $lines[] = '';
            $lines[] = '## Course Structure';
            foreach ($course->modules as $module) {
                $count = $module->resources->count();
                $noun = $count === 1 ? 'resource' : 'resources';
                $lines[] = "- {$module->title} ({$count} {$noun})";
            }
        }

        // RAG-retrieved chunks specific to this course
        if ($chunks && $chunks->isNotEmpty()) {
            $lines[] = '';
            $lines[] = '## Retrieved Course Knowledge';
            $lines[] = 'Use the following retrieved content to answer specific questions about this course.';
            foreach ($chunks as $chunk) {
                $lines[] = '';
                $lines[] = '---';
                $lines[] = trim($chunk->chunk_text);
            }
        }

        if ($meta->isCoachingMode()) {
            $lines[] = '';
            $lines[] = '## Coaching Mandate';
            $lines[] = 'You are a dedicated learning coach, not a passive Q&A bot. You have an agenda: move this learner forward.';
            $lines[] = '- End EVERY response with a concrete next step (start the next module, tackle an incomplete resource, attempt a pending test).';
            $lines[] = '- Use their progress data above to personalise every nudge — reference specific modules or their completion percentage.';
            $lines[] = '- Never end with "Let me know if you have questions." End with a directive that creates momentum.';
            $lines[] = '- High expectations, warm support.';
        }

        $lines[] = '';

        if ($isTrigger) {
            $lines[] = '## Session Opener';
            $lines[] = 'The learner just opened this chat (system-initiated). Do NOT wait for them to ask something.';
            $lines[] = 'Generate a 2–3 sentence coaching opener that:';
            $lines[] = '1. References this specific course and their progress (% complete, modules done, etc.).';
            $lines[] = '2. Ends with ONE concrete directive to move them forward right now.';
            $lines[] = 'Do NOT say "How can I help?" or "What would you like to know?" — you lead this session.';
        } else {
            $lines[] = '## Your Role';
            $lines[] = '- Answer questions about what this course covers and who it is for';
            $lines[] = '- Help the visitor decide if this course is right for them';
            $lines[] = '- Explain topics mentioned in the course title or modules at a surface level';
            $lines[] = '- Guide them on enrollment options (observer = free preview, full access = paid or Paid tier)';
            $lines[] = '- Keep responses concise (under 200 words) unless more detail is genuinely needed';
            $lines[] = '- Use markdown for bullet points when helpful';
        }

        return implode("\n", $lines);
    }
}
