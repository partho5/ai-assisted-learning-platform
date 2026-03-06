<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResourceRequest;
use App\Http\Requests\UpdateResourceRequest;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use Illuminate\Http\RedirectResponse;

class ResourceController extends Controller
{
    public function store(StoreResourceRequest $request, Course $course, Module $module): RedirectResponse
    {
        $this->authorizeOwner($course);
        abort_unless($module->course_id === $course->id, 404);

        $data = $request->validated();
        $data['module_id'] = $module->id;
        $data['order'] = $data['order'] ?? $module->resources()->max('order') + 1;

        $module->resources()->create($data);

        return back()->with('success', 'Resource added.');
    }

    public function update(UpdateResourceRequest $request, Course $course, Module $module, Resource $resource): RedirectResponse
    {
        $this->authorizeOwner($course);
        abort_unless($module->course_id === $course->id, 404);
        abort_unless($resource->module_id === $module->id, 404);

        $resource->update($request->validated());

        return back()->with('success', 'Resource updated.');
    }

    public function destroy(Course $course, Module $module, Resource $resource): RedirectResponse
    {
        $this->authorizeOwner($course);
        abort_unless($module->course_id === $course->id, 404);
        abort_unless($resource->module_id === $module->id, 404);

        $resource->delete();

        return back()->with('success', 'Resource deleted.');
    }

    private function authorizeOwner(Course $course): void
    {
        $user = auth()->user();

        if (! $user->isAdmin() && $course->user_id !== $user->id) {
            abort(403);
        }
    }
}
