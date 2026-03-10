<?php

namespace App\AiChat;

use App\Models\Course;
use Illuminate\Support\Collection;

class CourseChatContext
{
    public static function buildSystemPrompt(Course $course, ChatContextMeta $meta, ?Collection $chunks = null): string
    {
        $appName = config('app.name', 'SkillEvidence');

        $lines = [
            "You are a helpful learning assistant for {$appName}.",
            '',
            '## User Context',
            $meta->toContextLine(),
            '',
            '## Course Being Viewed',
            "Title: {$course->title}",
        ];

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

        $lines[] = '';
        $lines[] = '## Your Role';
        $lines[] = '- Answer questions about what this course covers and who it is for';
        $lines[] = '- Help the visitor decide if this course is right for them';
        $lines[] = '- Explain topics mentioned in the course title or modules at a surface level';
        $lines[] = '- Guide them on enrollment options (observer = free preview, full access = paid or Paid tier)';
        $lines[] = '- Keep responses concise (under 200 words) unless more detail is genuinely needed';
        $lines[] = '- Use markdown for bullet points when helpful';

        return implode("\n", $lines);
    }
}
