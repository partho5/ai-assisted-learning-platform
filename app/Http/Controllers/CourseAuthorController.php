<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CourseAuthorController extends Controller
{
    /**
     * Add a co-author to the course.
     * Any existing author (or admin) can add; the new user must be a mentor or admin.
     */
    public function store(Request $request, Course $course): RedirectResponse
    {
        $user = auth()->user();

        if (! $user->isAdmin() && ! $course->isAuthor($user)) {
            abort(403);
        }

        $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
        ]);

        $identifier = $request->input('identifier');

        $newAuthor = User::where('email', $identifier)
            ->orWhere('username', $identifier)
            ->first();

        if (! $newAuthor) {
            return back()->withErrors(['identifier' => 'No user found with that email or username.']);
        }

        if ($newAuthor->isLearner()) {
            return back()->withErrors(['identifier' => 'Only mentors or admins can be added as co-authors.']);
        }

        if ($course->isAuthor($newAuthor)) {
            return back()->withErrors(['identifier' => 'This user is already an author of this course.']);
        }

        $course->authors()->attach($newAuthor->id, [
            'role'     => 'co_author',
            'added_by' => $user->id,
        ]);

        return back()->with('success', "{$newAuthor->name} added as co-author.");
    }

    /**
     * Remove a co-author from the course.
     * Only the lead author or an admin can remove. The lead cannot be removed.
     */
    public function destroy(Course $course, User $author): RedirectResponse
    {
        $user = auth()->user();

        if (! $user->isAdmin() && ! $course->isLeadAuthor($user)) {
            abort(403);
        }

        $pivot = $course->authors()->wherePivot('user_id', $author->id)->first();

        if (! $pivot) {
            return back()->withErrors(['error' => 'This user is not an author of this course.']);
        }

        if ($pivot->pivot->role === 'lead') {
            return back()->withErrors(['error' => 'The lead author cannot be removed.']);
        }

        $course->authors()->detach($author->id);

        return back()->with('success', "{$author->name} removed from co-authors.");
    }
}
