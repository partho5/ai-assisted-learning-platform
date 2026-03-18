<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTestRequest;
use App\Http\Requests\UpdateTestRequest;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use App\Models\Test;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    public function edit(Course $course, Module $module, Resource $resource): Response
    {
        $this->authorizeOwner($course);

        $resource->load(['test.questions.options']);

        return Inertia::render('mentor/courses/test-editor', [
            'course' => $course,
            'module' => $module,
            'resource' => $resource,
            'test' => $resource->test,
            'questions' => $resource->test?->questions ?? [],
        ]);
    }

    public function store(StoreTestRequest $request, Course $course, Module $module, Resource $resource): RedirectResponse
    {
        $this->authorizeOwner($course);

        $resource->test()->create([
            ...$request->validated(),
            'testable_type' => Resource::class,
            'testable_id' => $resource->id,
        ]);

        return redirect()
            ->route('tests.edit', [
                'locale' => app()->getLocale(),
                'course' => $course->slug,
                'module' => $module->id,
                'resource' => $resource->id,
            ])
            ->with('success', 'Test created.');
    }

    public function update(UpdateTestRequest $request, Course $course, Module $module, Resource $resource, Test $test): RedirectResponse
    {
        $this->authorizeOwner($course);

        $test->update($request->validated());

        return back()->with('success', 'Test settings updated.');
    }

    public function destroy(Course $course, Module $module, Resource $resource, Test $test): RedirectResponse
    {
        $this->authorizeOwner($course);

        $test->delete();

        return redirect()
            ->route('courses.edit', ['locale' => app()->getLocale(), 'course' => $course->slug])
            ->with('success', 'Test deleted.');
    }

    private function authorizeOwner(Course $course): void
    {
        $user = auth()->user();

        if (! $user->isAdmin() && ! $course->isAuthor($user)) {
            abort(403);
        }
    }
}
