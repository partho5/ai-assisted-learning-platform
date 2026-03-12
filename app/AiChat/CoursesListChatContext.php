<?php

namespace App\AiChat;

class CoursesListChatContext
{
    /**
     * @param  array<int, array{id: int, title: string, description: string|null, difficulty: string|null, category: string|null}>  $courses
     */
    public static function buildSystemPrompt(array $courses, ChatContextMeta $meta, bool $isTrigger = false): string
    {
        $appName = config('app.name', 'SkillEvidence');

        $lines = [
            "You are a helpful course advisor for {$appName}, an AI-assisted skill learning platform.",
            '',
            '## User Context',
            $meta->toContextLine(),
            '',
            '## Courses Currently Visible on the Page',
        ];

        foreach ($courses as $course) {
            $title = $course['title'];
            $difficulty = $course['difficulty'] ?? null;
            $category = $course['category'] ?? null;

            $header = "- **{$title}**";
            if ($difficulty) {
                $header .= " · {$difficulty}";
            }
            if ($category) {
                $header .= " · {$category}";
            }

            $lines[] = $header;

            if (! empty($course['description'])) {
                $desc = trim(mb_substr(strip_tags($course['description']), 0, 200));
                if ($desc) {
                    $lines[] = "  {$desc}";
                }
            }
        }

        $lines[] = '';

        if ($isTrigger) {
            $lines[] = '## Session Opener';
            $lines[] = 'The learner just opened this chat on the course catalog page (system-initiated). Do NOT wait for them to ask something.';
            $lines[] = 'Generate a 1–2 sentence opener that:';
            $lines[] = '1. Acknowledges they are browsing courses.';
            $lines[] = '2. Asks ONE targeted question to understand their goal so you can recommend the right course.';
            $lines[] = 'Do NOT say "How can I help?" generically — ask something specific like their background or what skill they want to build.';
        } else {
            $lines[] = '## Your Role';
            $lines[] = '- Help users discover and compare the courses listed above';
            $lines[] = '- Recommend courses based on their goals, background, or skill level';
            $lines[] = '- Explain what each course covers and who it is best suited for';
            $lines[] = '- If asked about a course not in the list, explain that you only have context for what is currently visible';
            $lines[] = '- Keep responses concise (under 250 words) unless detailed comparison is requested';
            $lines[] = '- Use markdown bullet points when listing multiple courses';
        }

        return implode("\n", $lines);
    }
}
