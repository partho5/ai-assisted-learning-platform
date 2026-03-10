<?php

namespace App\Services;

use App\Enums\ResourceType;
use App\Models\Course;

/**
 * Produces knowledge chunks from a Course using structural units (not token-based splitting).
 * One chunk per course, per module, and per resource — minimises total chunk count and
 * embedding API calls while preserving semantic coherence.
 */
class KnowledgeChunker
{
    /**
     * Generate all chunks for a published course.
     *
     * @return array<int, array{source_type: string, source_id: int, chunk_index: int, chunk_text: string, content_hash: string, metadata: array<string, mixed>}>
     */
    public function chunksForCourse(Course $course): array
    {
        $chunks = [];

        // — Course-level chunk —
        $courseText = $this->buildCourseText($course);
        if ($courseText !== '') {
            $chunks[] = $this->makeChunk('course', $course->id, 0, $courseText, [
                'course_id' => $course->id,
                'course_title' => $course->title,
            ]);
        }

        foreach ($course->modules as $module) {
            // — Module-level chunk —
            $moduleText = $this->buildModuleText($module);
            if ($moduleText !== '') {
                $chunks[] = $this->makeChunk('module', $module->id, 0, $moduleText, [
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'module_id' => $module->id,
                    'module_title' => $module->title,
                ]);
            }

            // — Resource-level chunks —
            foreach ($module->resources as $resource) {
                $resourceChunks = $this->chunksForResource($resource, $course);
                foreach ($resourceChunks as $chunk) {
                    $chunks[] = $chunk;
                }
            }
        }

        return $chunks;
    }

    /**
     * Generate chunks for a single resource.
     * Long text resources are split at paragraph boundaries (~2000 chars each).
     * Non-text resources with no meaningful body are skipped.
     *
     * @return array<int, array{source_type: string, source_id: int, chunk_index: int, chunk_text: string, content_hash: string, metadata: array<string, mixed>}>
     */
    public function chunksForResource(mixed $resource, Course $course): array
    {
        $type = $resource->type instanceof ResourceType
            ? $resource->type
            : ResourceType::from((string) $resource->type);

        $body = $this->buildResourceBody($resource, $type);
        $hasMeaningfulContent = $body !== ''
            || ! empty(trim((string) ($resource->why_this_resource ?? '')))
            || ! empty(trim((string) ($resource->mentor_note ?? '')));

        // Skip resources with no meaningful content — title+type alone adds no knowledge
        if (! $hasMeaningfulContent) {
            return [];
        }

        $header = $this->buildResourceHeader($resource, $type, $course);

        $baseText = trim($header.($body !== '' ? "\n\n".$body : ''));

        $metadata = [
            'course_id' => $course->id,
            'course_title' => $course->title,
            'resource_id' => $resource->id,
            'resource_title' => $resource->title,
            'resource_type' => $type->value,
        ];

        // Short enough to fit in a single chunk
        if (mb_strlen($baseText) <= 2000) {
            return [$this->makeChunk('resource', $resource->id, 0, $baseText, $metadata)];
        }

        // Split long text at paragraph boundaries
        return $this->splitIntoParagraphChunks($resource->id, $baseText, $metadata);
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private function buildCourseText(Course $course): string
    {
        $parts = ["Course: {$course->title}"];

        if ($course->description) {
            $parts[] = 'Description: '.$this->stripAndTrim($course->description, 400);
        }

        if ($course->what_you_will_learn) {
            $parts[] = 'What you will learn: '.$this->stripAndTrim($course->what_you_will_learn, 300);
        }

        if ($course->prerequisites) {
            $parts[] = 'Prerequisites: '.$this->stripAndTrim($course->prerequisites, 200);
        }

        if ($course->difficulty) {
            $difficulty = is_string($course->difficulty) ? $course->difficulty : $course->difficulty->value;
            $parts[] = "Difficulty: {$difficulty}";
        }

        if ($course->modules->isNotEmpty()) {
            $moduleTitles = $course->modules->pluck('title')->join(', ');
            $parts[] = "Modules: {$moduleTitles}";
        }

        return implode("\n", $parts);
    }

    private function buildModuleText(mixed $module): string
    {
        $parts = ["Module: {$module->title}"];

        if ($module->description) {
            $parts[] = 'Description: '.$this->stripAndTrim($module->description, 300);
        }

        if ($module->resources->isNotEmpty()) {
            $resourceTitles = $module->resources->pluck('title')->join(', ');
            $parts[] = "Resources: {$resourceTitles}";
        }

        return implode("\n", $parts);
    }

    private function buildResourceHeader(mixed $resource, ResourceType $type, Course $course): string
    {
        $parts = [
            "Resource: {$resource->title}",
            "Type: {$type->value}",
            "Course: {$course->title}",
        ];

        if ($resource->why_this_resource) {
            $parts[] = 'Why this resource: '.$this->stripAndTrim($resource->why_this_resource, 200);
        }

        if ($resource->mentor_note) {
            $parts[] = 'Mentor note: '.$this->stripAndTrim($resource->mentor_note, 200);
        }

        return implode("\n", $parts);
    }

    private function buildResourceBody(mixed $resource, ResourceType $type): string
    {
        // Only embed body content for types that carry readable text
        if (! in_array($type, [ResourceType::Text, ResourceType::Assignment, ResourceType::Document], true)) {
            return '';
        }

        if (empty($resource->content)) {
            return '';
        }

        return $this->stripAndTrim($resource->content, 4000);
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<int, array{source_type: string, source_id: int, chunk_index: int, chunk_text: string, content_hash: string, metadata: array<string, mixed>}>
     */
    private function splitIntoParagraphChunks(int $resourceId, string $text, array $metadata): array
    {
        $paragraphs = preg_split('/\n{2,}/', $text) ?: [$text];
        $chunks = [];
        $current = '';
        $index = 0;

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if ($paragraph === '') {
                continue;
            }

            if ($current !== '' && mb_strlen($current) + mb_strlen($paragraph) + 2 > 2000) {
                $chunks[] = $this->makeChunk('resource', $resourceId, $index, trim($current), $metadata);
                $index++;
                $current = $paragraph;
            } else {
                $current .= ($current !== '' ? "\n\n" : '').$paragraph;
            }
        }

        if ($current !== '') {
            $chunks[] = $this->makeChunk('resource', $resourceId, $index, trim($current), $metadata);
        }

        return $chunks;
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array{source_type: string, source_id: int, chunk_index: int, chunk_text: string, content_hash: string, metadata: array<string, mixed>}
     */
    private function makeChunk(string $sourceType, int $sourceId, int $chunkIndex, string $text, array $metadata): array
    {
        return [
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'chunk_index' => $chunkIndex,
            'chunk_text' => $text,
            'content_hash' => hash('sha256', $text),
            'metadata' => $metadata,
        ];
    }

    private function stripAndTrim(string $html, int $maxChars): string
    {
        $plain = strip_tags($html);
        $plain = preg_replace('/\s+/', ' ', $plain) ?? $plain;

        return trim(mb_substr($plain, 0, $maxChars));
    }
}
