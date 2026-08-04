<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseImportRequest;
use App\Models\Course;
use App\Services\CourseImportService;
use Illuminate\Http\RedirectResponse;

class CourseImportController extends Controller
{
    public function __construct(private readonly CourseImportService $importer) {}

    public function store(StoreCourseImportRequest $request, Course $course): RedirectResponse
    {
        $this->authorizeOwner($course);

        $data = $request->validated();

        $result = $this->importer->import($course, $data['file'], $data['module_id'] ?? null);

        return back()->with('success', "Imported {$result['modules']} module(s) and {$result['lessons']} lesson(s).");
    }

    private function authorizeOwner(Course $course): void
    {
        $user = auth()->user();

        if (! $user->isAdmin() && ! $course->isAuthor($user)) {
            abort(403);
        }
    }
}
