<?php

namespace App\Services;

use App\Enums\ResourceType;
use App\Models\Course;
use App\Models\Module;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use JsonException;

/**
 * Bulk-creates modules/lessons for a course from an untrusted, mentor-uploaded
 * JSON file. Every item is validated against the same constraints as the
 * manual "Add Module" / "Add Lesson" forms before anything is written, and
 * the whole file is inserted inside a single transaction: either every item
 * is valid and all of it is saved, or nothing is.
 */
class CourseImportService
{
    private const MAX_MODULES = 50;

    private const MAX_LESSONS_PER_MODULE = 100;

    private const MAX_TOP_LEVEL_LESSONS = 200;

    private const MAX_JSON_DEPTH = 20;

    /**
     * Only resource types that don't require a URL can be created via the
     * minimal JSON schema (title/resource_type/importance/content).
     *
     * @var array<int, string>
     */
    private const ALLOWED_LESSON_TYPES = [ResourceType::Text->value, ResourceType::Assignment->value];

    public function __construct(private readonly HtmlSanitizerService $sanitizer) {}

    /**
     * @return array{modules: int, lessons: int}
     *
     * @throws ValidationException
     */
    public function import(Course $course, UploadedFile $file, ?int $moduleId): array
    {
        $items = $this->parseJson($file);

        $errors = [];
        $plan = $this->buildPlan($course, $items, $moduleId, $errors);

        if ($errors !== [] || $plan === null) {
            // Inertia's default error sharing keeps only the first message per
            // field, so every collected issue is joined into one message —
            // otherwise all but the first validation error would be silently lost.
            throw ValidationException::withMessages([
                'file' => [implode("\n", $errors !== [] ? $errors : ['The file could not be processed.'])],
            ]);
        }

        return DB::transaction(fn () => $this->persist($course, $plan));
    }

    /** @return array<int, mixed> */
    private function parseJson(UploadedFile $file): array
    {
        $contents = file_get_contents($file->getRealPath());

        if ($contents === false || trim($contents) === '') {
            throw ValidationException::withMessages(['file' => ['Could not read the uploaded file.']]);
        }

        try {
            $data = json_decode($contents, true, self::MAX_JSON_DEPTH, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw ValidationException::withMessages(['file' => ['The file is not valid JSON: '.$e->getMessage()]]);
        }

        if (! is_array($data) || $data === [] || array_keys($data) !== range(0, count($data) - 1)) {
            throw ValidationException::withMessages(['file' => ['The JSON must be a non-empty array of module or lesson objects.']]);
        }

        return $data;
    }

    /**
     * @param  array<int, mixed>  $items
     * @param  array<int, string>  $errors
     * @return array<string, mixed>|null
     */
    private function buildPlan(Course $course, array $items, ?int $moduleId, array &$errors): ?array
    {
        $types = collect($items)
            ->map(fn ($item) => is_array($item) ? ($item['type'] ?? null) : null)
            ->unique();

        if ($types->count() > 1 || ! in_array($types->first(), ['module', 'lesson'], true)) {
            $errors[] = 'All items in the file must share the same "type" — either all "module" or all "lesson".';

            return null;
        }

        return $types->first() === 'module'
            ? $this->buildModulePlan($items, $errors)
            : $this->buildLessonPlan($moduleId, $items, $errors);
    }

    /**
     * @param  array<int, mixed>  $items
     * @param  array<int, string>  $errors
     * @return array<string, mixed>|null
     */
    private function buildModulePlan(array $items, array &$errors): ?array
    {
        if (count($items) > self::MAX_MODULES) {
            $errors[] = 'A single import file cannot contain more than '.self::MAX_MODULES.' modules.';

            return null;
        }

        $modules = [];
        foreach ($items as $index => $item) {
            $modules[] = $this->validateModuleItem($item, $index, $errors);
        }

        return $errors === [] ? ['kind' => 'modules', 'modules' => $modules] : null;
    }

    /**
     * @param  array<int, mixed>  $items
     * @param  array<int, string>  $errors
     * @return array<string, mixed>|null
     */
    private function buildLessonPlan(?int $moduleId, array $items, array &$errors): ?array
    {
        if ($moduleId === null) {
            $errors[] = 'Select a target module before uploading a lessons-only file.';

            return null;
        }

        if (count($items) > self::MAX_TOP_LEVEL_LESSONS) {
            $errors[] = 'A single import file cannot contain more than '.self::MAX_TOP_LEVEL_LESSONS.' lessons.';

            return null;
        }

        $lessons = [];
        foreach ($items as $index => $item) {
            $lessons[] = $this->validateLessonItem($item, 'lesson '.($index + 1), $errors);
        }

        return $errors === [] ? ['kind' => 'lessons', 'moduleId' => $moduleId, 'lessons' => $lessons] : null;
    }

    /**
     * @param  array<int, string>  $errors
     * @return array{title: string, description: ?string, lessons: array<int, array<string, mixed>>}
     */
    private function validateModuleItem(mixed $item, int $index, array &$errors): array
    {
        $label = 'module '.($index + 1);

        if (! is_array($item)) {
            $errors[] = "{$label}: must be an object.";

            return ['title' => '', 'description' => null, 'lessons' => []];
        }

        $title = $item['title'] ?? null;
        if (! is_string($title) || trim($title) === '') {
            $errors[] = "{$label}: title is required.";
        } elseif (mb_strlen($title) > 255) {
            $errors[] = "{$label}: title must not exceed 255 characters.";
        }

        $description = $item['description'] ?? null;
        if ($description !== null && ! is_string($description)) {
            $errors[] = "{$label}: description must be a string.";
            $description = null;
        }

        $lessonsRaw = $item['lessons'] ?? [];
        if (! is_array($lessonsRaw)) {
            $errors[] = "{$label}: lessons must be an array.";
            $lessonsRaw = [];
        } elseif (count($lessonsRaw) > self::MAX_LESSONS_PER_MODULE) {
            $errors[] = "{$label}: cannot contain more than ".self::MAX_LESSONS_PER_MODULE.' lessons.';
            $lessonsRaw = [];
        }

        $lessons = [];
        foreach ($lessonsRaw as $lessonIndex => $lessonItem) {
            $lessons[] = $this->validateLessonItem($lessonItem, "{$label}, lesson ".($lessonIndex + 1), $errors);
        }

        return [
            'title' => is_string($title) ? trim($title) : '',
            'description' => $description,
            'lessons' => $lessons,
        ];
    }

    /**
     * @param  array<int, string>  $errors
     * @return array{title: string, type: ?string, why_this_resource: ?string, content: ?string}
     */
    private function validateLessonItem(mixed $item, string $label, array &$errors): array
    {
        if (! is_array($item)) {
            $errors[] = "{$label}: must be an object.";

            return ['title' => '', 'type' => null, 'why_this_resource' => null, 'content' => null];
        }

        if (($item['type'] ?? null) !== 'lesson') {
            $errors[] = "{$label}: type must be \"lesson\".";
        }

        $title = $item['title'] ?? null;
        if (! is_string($title) || trim($title) === '') {
            $errors[] = "{$label}: title is required.";
        } elseif (mb_strlen($title) > 255) {
            $errors[] = "{$label}: title must not exceed 255 characters.";
        }

        $resourceType = $item['resource_type'] ?? null;
        if (! is_string($resourceType) || ! in_array($resourceType, self::ALLOWED_LESSON_TYPES, true)) {
            $errors[] = "{$label}: resource_type must be one of: ".implode(', ', self::ALLOWED_LESSON_TYPES).'.';
            $resourceType = null;
        }

        $importance = $item['importance'] ?? null;
        if ($importance !== null && ! is_string($importance)) {
            $errors[] = "{$label}: importance must be a string.";
            $importance = null;
        }

        $content = $item['content'] ?? null;
        if ($content !== null && ! is_string($content)) {
            $errors[] = "{$label}: content must be a string.";
            $content = null;
        }

        if ($resourceType === ResourceType::Text->value && (! is_string($content) || trim($content) === '')) {
            $errors[] = "{$label}: content is required when resource_type is \"text\".";
        }

        return [
            'title' => is_string($title) ? trim($title) : '',
            'type' => $resourceType,
            'why_this_resource' => $importance,
            'content' => $content,
        ];
    }

    /**
     * @param  array<string, mixed>  $plan
     * @return array{modules: int, lessons: int}
     */
    private function persist(Course $course, array $plan): array
    {
        if ($plan['kind'] === 'modules') {
            return $this->persistModules($course, $plan['modules']);
        }

        return $this->persistLessons($course, $plan['moduleId'], $plan['lessons']);
    }

    /**
     * @param  array<int, array<string, mixed>>  $modules
     * @return array{modules: int, lessons: int}
     */
    private function persistModules(Course $course, array $modules): array
    {
        $order = ((int) $course->modules()->max('order')) + 1;
        $lessonCount = 0;

        foreach ($modules as $moduleData) {
            $module = $course->modules()->create([
                'title' => $moduleData['title'],
                'description' => $this->sanitizer->sanitize($moduleData['description']),
                'order' => $order++,
            ]);

            $lessonOrder = 0;
            foreach ($moduleData['lessons'] as $lessonData) {
                $module->resources()->create($this->prepareResourceData($lessonData, $lessonOrder++));
                $lessonCount++;
            }
        }

        return ['modules' => count($modules), 'lessons' => $lessonCount];
    }

    /**
     * @param  array<int, array<string, mixed>>  $lessons
     * @return array{modules: int, lessons: int}
     */
    private function persistLessons(Course $course, int $moduleId, array $lessons): array
    {
        /** @var Module $module */
        $module = Module::query()->where('course_id', $course->id)->findOrFail($moduleId);

        $order = ((int) $module->resources()->max('order')) + 1;

        foreach ($lessons as $lessonData) {
            $module->resources()->create($this->prepareResourceData($lessonData, $order++));
        }

        return ['modules' => 0, 'lessons' => count($lessons)];
    }

    /**
     * @param  array<string, mixed>  $lessonData
     * @return array<string, mixed>
     */
    private function prepareResourceData(array $lessonData, int $order): array
    {
        return [
            'title' => $lessonData['title'],
            'type' => $lessonData['type'],
            'why_this_resource' => $this->sanitizer->sanitize($lessonData['why_this_resource']),
            'content' => $this->sanitizer->sanitize($lessonData['content']),
            'order' => $order,
        ];
    }
}
