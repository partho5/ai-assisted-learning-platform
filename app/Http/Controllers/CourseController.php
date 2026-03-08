<?php

namespace App\Http\Controllers;

use App\Enums\CourseDifficulty;
use App\Enums\ResourceType;
use App\Http\Requests\StoreCourseRequest;
use App\Http\Requests\UpdateCourseRequest;
use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Role-aware index: mentors/admins see their own course management,
     * everyone else sees the public catalog.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user && ($user->isMentor() || $user->isAdmin())) {
            return $this->mentorIndex($user);
        }

        return $this->publicCatalog($request);
    }

    private function mentorIndex(\App\Models\User $user): Response
    {
        $courses = $user->courses()
            ->with('category')
            ->withCount('modules')
            ->latest()
            ->get();

        return Inertia::render('mentor/courses/index', [
            'courses' => $courses,
        ]);
    }

    private function publicCatalog(Request $request): Response
    {
        $query = Course::query()
            ->published()
            ->with(['mentor:id,name,username,avatar,headline', 'category'])
            ->withCount(['modules', 'resources'])
            ->latest();

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->input('category')));
        }

        if ($request->filled('difficulty')) {
            $query->where('difficulty', $request->input('difficulty'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(fn ($q) => $q
                ->where('title', 'ilike', "%{$search}%")
                ->orWhere('description', 'ilike', "%{$search}%")
            );
        }

        return Inertia::render('courses/index', [
            'courses' => $query->paginate(12)->withQueryString(),
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
            'filters' => $request->only(['category', 'difficulty', 'search']),
        ]);
    }

    public function show(Request $request, Course $course): Response
    {
        if (! $course->isPublished()) {
            abort(404);
        }

        $course->load([
            'mentor:id,name,username,avatar,headline,bio',
            'category',
            'modules' => fn ($q) => $q->orderBy('order'),
            'modules.resources' => fn ($q) => $q->orderBy('order')->orderBy('created_at'),
        ]);

        $course->loadCount(['modules', 'resources', 'enrollments']);

        $enrollment = null;
        if ($request->user()) {
            $enrollment = Enrollment::where('user_id', $request->user()->id)
                ->where('course_id', $course->id)
                ->first();
        }

        return Inertia::render('courses/show', [
            'course' => $course,
            'enrollment' => $enrollment,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('mentor/courses/create', [
            'categories' => Category::orderBy('name')->get(),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
        ]);
    }

    public function store(StoreCourseRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();
        $data['slug'] = $this->uniqueSlug($data['title']);

        $course = Course::create($data);

        return redirect()
            ->route('courses.edit', ['locale' => app()->getLocale(), 'course' => $course->slug])
            ->with('success', 'Course created. Add modules and resources below.');
    }

    public function edit(Course $course): Response
    {
        $this->authorizeOwner($course);

        $course->load([
            'category',
            'modules' => fn ($q) => $q->orderBy('order'),
            'modules.resources' => fn ($q) => $q->orderBy('order')->orderBy('created_at'),
        ]);

        return Inertia::render('mentor/courses/edit', [
            'course' => $course,
            'categories' => Category::orderBy('name')->get(),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
            'resourceTypes' => collect(ResourceType::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
        ]);
    }

    public function update(UpdateCourseRequest $request, Course $course): RedirectResponse
    {
        $this->authorizeOwner($course);

        $data = $request->validated();

        if (isset($data['title']) && $data['title'] !== $course->title) {
            $data['slug'] = $this->uniqueSlug($data['title'], $course->id);
        }

        $course->update($data);

        return back()->with('success', 'Course updated.');
    }

    public function destroy(Course $course): RedirectResponse
    {
        $this->authorizeOwner($course);

        $course->delete();

        return redirect()
            ->route('courses.index', ['locale' => app()->getLocale()])
            ->with('success', 'Course deleted.');
    }

    private function authorizeOwner(Course $course): void
    {
        $user = auth()->user();

        if (! $user->isAdmin() && $course->user_id !== $user->id) {
            abort(403);
        }
    }

    private function uniqueSlug(string $title, ?int $excludeId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 1;

        while (Course::where('slug', $slug)->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
