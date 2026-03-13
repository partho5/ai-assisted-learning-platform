<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResourceRequest;
use App\Http\Requests\UpdateResourceRequest;
use App\Models\Course;
use App\Models\Module;
use App\Models\Resource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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

    public function reorder(Request $request, Course $course, Module $module): RedirectResponse
    {
        $this->authorizeOwner($course);
        abort_unless($module->course_id === $course->id, 404);

        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        foreach ($request->input('order') as $position => $resourceId) {
            $module->resources()->where('id', $resourceId)->update(['order' => $position]);
        }

        return back()->with('success', 'Resources reordered.');
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
