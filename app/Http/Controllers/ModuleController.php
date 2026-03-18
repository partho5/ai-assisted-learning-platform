<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreModuleRequest;
use App\Http\Requests\UpdateModuleRequest;
use App\Models\Course;
use App\Models\Module;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function store(StoreModuleRequest $request, Course $course): RedirectResponse
    {
        $this->authorizeOwner($course);

        $data = $request->validated();
        $data['course_id'] = $course->id;
        $data['order'] = $data['order'] ?? $course->modules()->max('order') + 1;

        $course->modules()->create($data);

        return back()->with('success', 'Module added.');
    }

    public function reorder(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeOwner($course);

        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        foreach ($request->input('order') as $position => $moduleId) {
            $course->modules()->where('id', $moduleId)->update(['order' => $position]);
        }

        return back()->with('success', 'Modules reordered.');
    }

    public function update(UpdateModuleRequest $request, Course $course, Module $module): RedirectResponse
    {
        $this->authorizeOwner($course);
        abort_unless($module->course_id === $course->id, 404);

        $module->update($request->validated());

        return back()->with('success', 'Module updated.');
    }

    public function destroy(Course $course, Module $module): RedirectResponse
    {
        $this->authorizeOwner($course);
        abort_unless($module->course_id === $course->id, 404);

        $module->delete();

        return back()->with('success', 'Module deleted.');
    }

    private function authorizeOwner(Course $course): void
    {
        $user = auth()->user();

        if (! $user->isAdmin() && ! $course->isAuthor($user)) {
            abort(403);
        }
    }
}
