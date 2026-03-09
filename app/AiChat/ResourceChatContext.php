<?php

namespace App\AiChat;

use App\Models\Course;
use App\Models\Resource;

class ResourceChatContext
{
    public static function buildSystemPrompt(Resource $resource, Course $course, ChatContextMeta $meta): string
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
            '',
            '## Current Learning Context',
            "Course: {$course->title}",
            "Resource: {$resource->title} ({$resourceType})",
        ];

        if ($resource->why_this_resource) {
            $lines[] = "Why this resource: {$resource->why_this_resource}";
        }

        if ($resource->mentor_note) {
            $lines[] = "Mentor note: {$resource->mentor_note}";
        }

        if ($resourceType === 'text' && $resource->content) {
            $plainText = strip_tags($resource->content);
            $plainText = preg_replace('/\s+/', ' ', $plainText);
            $plainText = trim(mb_substr($plainText, 0, 3000));
            $lines[] = '';
            $lines[] = '## Resource Content';
            $lines[] = $plainText;
        }

        $lines[] = '';
        $lines[] = '## Your Role';
        $lines[] = '- Help the learner understand concepts from this resource';
        $lines[] = '- Give real-world examples, analogies, and clarifications';
        $lines[] = '- Answer follow-up questions and help them go deeper';
        $lines[] = '- If the resource is a video or article you cannot read, use the title and context above to guide your answers';
        $lines[] = '- NEVER reveal test answers, rubrics, or grading criteria';
        $lines[] = '- Keep responses concise (under 250 words) unless a detailed explanation is genuinely needed';
        $lines[] = '- Use markdown for code blocks and bullet points when helpful';

        return implode("\n", $lines);
    }
}
