<?php

namespace App\Http\Controllers;

use App\Enums\ResourceCompletionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Resource;
use App\Models\ResourceCompletion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ResourceCompletionController extends Controller
{
    public function complete(Request $request, Course $course, Resource $resource): RedirectResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->firstOrFail();

        if ($enrollment->isObserver() && ! $resource->is_free) {
            abort(403);
        }

        // Only non-test resources can be marked complete directly
        if ($resource->hasTest()) {
            return back()->with('error', 'Test resources must be submitted via the test form.');
        }

        $completion = ResourceCompletion::firstOrCreate(
            ['enrollment_id' => $enrollment->id, 'resource_id' => $resource->id],
            ['status' => ResourceCompletionStatus::Incomplete]
        );

        $completion->update([
            'status' => ResourceCompletionStatus::Endorsed,
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Resource marked as complete.');
    }
}
