<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ForumThread;
use App\Models\Resource;
use App\Models\ResourceCompletion;
use App\Models\TestAttempt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LearnController extends Controller
{
    public function show(Request $request, Course $course, Resource $resource): Response|RedirectResponse
    {
        $user = $request->user();
        $isPreview = $request->boolean('preview') && $user && ($user->isAdmin() || $course->isAuthor($user));

        if (! $course->isPublished() && ! $isPreview) {
            abort(404);
        }

        // Guests can only enter via a free resource
        if (! $resource->is_free && ! $user && ! $isPreview) {
            return redirect()->route('login');
        }

        $enrollment = $user
            ? Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->first()
            : null;

        // Non-enrolled auth user trying to enter via a non-free resource (skip for preview)
        if (! $isPreview && $user && ! $enrollment && ! $resource->is_free) {
            return redirect()->route('courses.show', [
                'locale' => app()->getLocale(),
                'course' => $course->slug,
            ]);
        }

        // Load all modules + resources + tests (question sensitive fields excluded via select)
        $course->load([
            'modules' => fn ($q) => $q->orderBy('order'),
            'modules.resources' => fn ($q) => $q->orderBy('order')->orderBy('created_at')->with([
                'test.questions' => fn ($q) => $q->select([
                    'id', 'test_id', 'order', 'question_type', 'body',
                    'hint', 'points', 'evaluation_method', 'numeric_operator',
                    'ai_help_enabled', 'is_required',
                ])->with('options:id,test_question_id,label,order'),
            ]),
        ]);

        $allResources = $course->modules->flatMap(fn ($m) => $m->resources);
        $allResourceIds = $allResources->pluck('id');

        // Batch-load per-user data
        $completions = collect();
        $activeAttempts = collect();
        $pastAttempts = collect();

        if ($user && $enrollment) {
            $completions = ResourceCompletion::where('enrollment_id', $enrollment->id)
                ->whereIn('resource_id', $allResourceIds)
                ->get()
                ->keyBy('resource_id');

            $testIds = $allResources->map(fn ($r) => $r->test?->id)->filter()->values();

            if ($testIds->isNotEmpty()) {
                $activeAttempts = TestAttempt::whereIn('test_id', $testIds)
                    ->where('user_id', $user->id)
                    ->where('status', 'in_progress')
                    ->with('answers')
                    ->latest()
                    ->get()
                    ->groupBy('test_id')
                    ->map(fn ($g) => $g->first());

                $pastAttempts = TestAttempt::whereIn('test_id', $testIds)
                    ->where('user_id', $user->id)
                    ->where('status', '!=', 'in_progress')
                    ->orderByDesc('attempt_number')
                    ->get(['id', 'test_id', 'attempt_number', 'status', 'score', 'submitted_at', 'endorsed_at'])
                    ->groupBy('test_id');
            }
        }

        $hasFullAccess = $isPreview || ($enrollment?->isFull() ?? false);

        // Batch-load forum threads for all resources in this course
        $forumThreadsByResourceId = ForumThread::whereIn('resource_id', $allResourceIds)
            ->with('category:id,slug')
            ->get(['id', 'resource_id', 'slug', 'title', 'replies_count', 'last_activity_at', 'category_id'])
            ->groupBy('resource_id')
            ->map(fn ($threads) => $threads->first()); // one canonical thread per resource

        // Build enriched resources (flat array, one entry per resource)
        $resources = $allResources->map(function ($r) use ($completions, $activeAttempts, $pastAttempts, $hasFullAccess, $forumThreadsByResourceId) {
            $testId = $r->test?->id;
            $canAccess = $r->is_free || $hasFullAccess;

            return array_merge(
                $r->only(['id', 'module_id', 'title', 'type', 'caption',
                    'estimated_time', 'mentor_note', 'why_this_resource', 'is_free', 'order']),
                [
                    'url' => $canAccess ? $r->url : null,
                    'content' => $canAccess ? $r->content : null,
                    'test' => $canAccess ? $r->test : null,
                    'completion' => $completions->get($r->id),
                    'activeAttempt' => $testId ? $activeAttempts->get($testId) : null,
                    'previousAttempts' => $testId
                        ? ($pastAttempts->get($testId)?->values()->toArray() ?? [])
                        : [],
                    'forumThread' => $forumThreadsByResourceId->get($r->id),
                ]
            );
        })->values();

        // Minimal course for sidebar (no test data duplication)
        $courseData = [
            'id' => $course->id,
            'title' => $course->title,
            'slug' => $course->slug,
            'thumbnail' => $course->thumbnail,
            'description' => $course->description,
            'modules' => $course->modules->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'order' => $m->order,
                'resources' => $m->resources->map(fn ($r) => $r->only(['id', 'title', 'type', 'is_free', 'order'])),
            ]),
        ];

        return Inertia::render('courses/learn', [
            'course' => $courseData,
            'initialResourceId' => $resource->id,
            'resources' => $resources,
            'enrollment' => $enrollment,
            'ogUrl' => url()->route('learn.show', ['locale' => app()->getLocale(), 'course' => $course->slug, 'resource' => $resource->id]),
            'isPreview' => $isPreview,
        ]);
    }
}
