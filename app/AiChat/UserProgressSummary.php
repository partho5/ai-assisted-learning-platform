<?php

namespace App\AiChat;

use App\Models\Course;
use App\Models\TestAttempt;
use App\Models\User;

/**
 * Compact snapshot of an authenticated user's learning progress.
 * Loaded once per chat request via a single eager-loaded query — no embedding cost.
 * Guests receive no progress context.
 */
readonly class UserProgressSummary
{
    /**
     * @param  array<int, array{title: string, completion: int, access: string}>  $enrolledCourses
     * @param  string[]  $endorsedSkills
     * @param  string[]  $recentCompletions
     */
    public function __construct(
        public array $enrolledCourses,
        public array $endorsedSkills,
        public array $recentCompletions,
        public int $totalEndorsements,
    ) {}

    /**
     * Build a UserProgressSummary for the given user.
     * Scoped to a specific course if provided (richer detail for course/resource chat).
     */
    public static function forUser(User $user, ?Course $scopedCourse = null): self
    {
        // Load enrollments with course title and completion counts in one query
        $enrollments = $user->enrollments()
            ->with([
                'course:id,title',
                'completions' => fn ($q) => $q->where('status', 'complete')->orWhere('status', 'endorsed'),
            ])
            ->get();

        $enrolledCourses = $enrollments->map(function ($enrollment) {
            $total = $enrollment->course->resources()->count();
            $done = $enrollment->completions->count();
            $pct = $total > 0 ? (int) round($done / $total * 100) : 0;

            return [
                'title' => $enrollment->course->title,
                'completion' => $pct,
                'access' => $enrollment->access_level->value ?? (string) $enrollment->access_level,
            ];
        })->toArray();

        // Endorsed test attempts — skill titles via the test → testable resource title
        $endorsedAttempts = TestAttempt::query()
            ->where('user_id', $user->id)
            ->whereNotNull('endorsed_at')
            ->with('test.testable:id,title')
            ->latest('endorsed_at')
            ->limit(10)
            ->get();

        $endorsedSkills = $endorsedAttempts
            ->map(fn ($attempt) => $attempt->test?->testable?->title)
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        // Recently completed resources (last 5) — for context on what the user just learned
        $recentCompletionsQuery = $user->enrollments()
            ->with([
                'completions' => fn ($q) => $q
                    ->whereIn('status', ['complete', 'endorsed'])
                    ->with('resource:id,title')
                    ->latest('completed_at')
                    ->limit(5),
            ]);

        if ($scopedCourse) {
            $recentCompletionsQuery->where('course_id', $scopedCourse->id);
        }

        $recentCompletions = $recentCompletionsQuery
            ->get()
            ->flatMap(fn ($enrollment) => $enrollment->completions)
            ->sortByDesc('completed_at')
            ->take(5)
            ->map(fn ($c) => $c->resource?->title)
            ->filter()
            ->values()
            ->toArray();

        return new self(
            enrolledCourses: $enrolledCourses,
            endorsedSkills: $endorsedSkills,
            recentCompletions: $recentCompletions,
            totalEndorsements: count($endorsedSkills),
        );
    }

    /**
     * Render a compact system-prompt section (target: ~150 tokens).
     * Returns empty string if nothing meaningful to show (new user with no activity).
     */
    public function toPromptSection(?string $scopedCourseTitle = null): string
    {
        if (empty($this->enrolledCourses) && empty($this->endorsedSkills)) {
            return '';
        }

        $lines = ['## This Learner\'s Progress'];

        if (! empty($this->enrolledCourses)) {
            if ($scopedCourseTitle) {
                // Course/resource context — show this course's progress prominently
                $current = collect($this->enrolledCourses)
                    ->firstWhere('title', $scopedCourseTitle);

                if ($current) {
                    $lines[] = "Current course: {$current['title']} — {$current['completion']}% complete";
                }

                // Other enrolled courses briefly
                $others = collect($this->enrolledCourses)
                    ->reject(fn ($c) => $c['title'] === $scopedCourseTitle)
                    ->take(3);

                if ($others->isNotEmpty()) {
                    $otherTitles = $others->map(fn ($c) => "{$c['title']} ({$c['completion']}%)")->join(', ');
                    $lines[] = "Also enrolled: {$otherTitles}";
                }
            } else {
                // Platform context — list all enrolled courses
                $courseSummaries = collect($this->enrolledCourses)
                    ->take(5)
                    ->map(fn ($c) => "{$c['title']} ({$c['completion']}%)")
                    ->join(', ');
                $lines[] = "Enrolled courses: {$courseSummaries}";
            }
        }

        if (! empty($this->endorsedSkills)) {
            $skills = implode(', ', array_slice($this->endorsedSkills, 0, 5));
            $lines[] = "Endorsed skills: {$skills}";
        }

        if (! empty($this->recentCompletions)) {
            $recent = implode(', ', array_slice($this->recentCompletions, 0, 3));
            $lines[] = "Recently completed: {$recent}";
        }

        return implode("\n", $lines);
    }
}
