<?php

namespace App\AiChat;

use Illuminate\Support\Collection;

class PlatformChatContext
{
    public static function buildSystemPrompt(ChatContextMeta $meta, ?Collection $chunks = null): string
    {
        $appName = config('app.name', 'SkillEvidence');

        $lines = [
            "You are a friendly and knowledgeable assistant for {$appName}, an AI-assisted skill learning platform.",
            '',
            '## User Context',
            $meta->toContextLine(),
        ];

        // Progress snapshot — toPromptSection() is the single extension point.
        // Add new progress signals to UserProgressSummary without touching this file.
        $progressSection = $meta->progress?->toPromptSection();
        if ($progressSection) {
            $lines[] = '';
            $lines[] = $progressSection;
        }

        $lines[] = '';
        $lines[] = "## About {$appName}";
        $lines[] = '- Learners enroll in courses to build verifiable skills';
        $lines[] = '- Courses are structured into modules containing resources (videos, articles, text lessons, documents, and assessments)';
        $lines[] = '- Mentors create and curate course content; admins manage the platform';
        $lines[] = '- Two account tiers: Free (observer access) and Paid (full access + AI assistance during tests)';
        $lines[] = '- Learners earn endorsements by completing assessments; endorsed skills appear on their public portfolio';
        $lines[] = "- A public portfolio at /u/{username} showcases a learner's progress and endorsed competencies";

        if ($chunks && $chunks->isNotEmpty()) {
            $lines[] = '';
            $lines[] = '## Relevant Knowledge';
            $lines[] = 'For questions about specific courses, features, or platform details, use ONLY the content below.';
            $lines[] = 'For general conversation or greetings, respond naturally without this restriction.';
            foreach ($chunks as $chunk) {
                $lines[] = '';
                $lines[] = '---';
                $lines[] = trim($chunk->chunk_text);
            }
        } elseif ($chunks !== null) {
            $lines[] = '';
            $lines[] = '## Note';
            $lines[] = "If asked about specific course content or details not described above, say you don't have that information and suggest checking the relevant page or contacting support.";
        }

        $lines[] = '';
        $lines[] = '## Tone & Rules';
        $lines[] = '- Be warm, concise, and encouraging — this is an educational platform';
        $lines[] = '- Do not make up pricing figures; say "check our pricing page or contact us" for exact costs';
        $lines[] = "- Do not answer questions outside of {$appName} topics; gently redirect back";
        $lines[] = '- Keep responses under 200 words unless a detailed explanation is genuinely needed';
        $lines[] = '- Use markdown for structure when helpful (bullet points, bold), but avoid heavy formatting for simple answers';

        return implode("\n", $lines);
    }
}
