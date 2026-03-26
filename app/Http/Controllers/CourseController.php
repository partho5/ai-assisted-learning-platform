<?php

namespace App\Http\Controllers;

use App\Enums\CourseDifficulty;
use App\Enums\CourseLanguage;
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
        $query = $user->isAdmin()
            ? Course::query()->with(['category', 'mentor:id,name,username'])
            : $user->authoredCourses()->with('category');

        $courses = $query
            ->withCount('modules')
            ->latest()
            ->get();

        return Inertia::render('mentor/courses/index', [
            'courses' => $courses,
            'isAdmin' => $user->isAdmin(),
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

        $courseLang = $request->input('course_lang', app()->getLocale());
        if ($courseLang !== 'all') {
            $query->byLanguage($courseLang);
        }

        return Inertia::render('courses/index', [
            'courses' => $query->paginate(12)->withQueryString(),
            'categories' => Category::orderBy('name')->get(['id', 'name', 'slug']),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
            'filters' => $request->only(['category', 'difficulty', 'search', 'course_lang']),
            'ogUrl' => url()->current(),
            'meta' => [
                'title' => 'Courses | '.config('app.name'),
                'description' => 'Explore mentor-led courses with real tests, assignments, and verified skill. Find the right course and start learning free.',
                'image' => config('seo.og_image'),
                'url' => url()->current(),
            ],
        ]);
    }

    public function show(Request $request, Course $course): Response
    {
        if (! $course->isPublished()) {
            abort(404);
        }

        $course->load([
            'authors:id,name,username,avatar,headline,bio,social_links',
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

        $ogDescription = $course->subtitle
            ? mb_substr(trim($course->subtitle), 0, 160)
            : mb_substr(trim(strip_tags($course->description ?? '')), 0, 160);

        return Inertia::render('courses/show', [
            'course' => $course,
            'enrollment' => $enrollment,
            'ogUrl' => url()->current(),
            'meta' => [
                'title' => $course->title.' | '.config('app.name'),
                'description' => $ogDescription,
                'image' => $course->thumbnail ?: config('seo.og_image'),
                'url' => url()->current(),
            ],
        ]);
    }

    public function preview(Request $request, Course $course): Response
    {
        $this->authorizeOwner($course);

        $course->load([
            'authors:id,name,username,avatar,headline,bio,social_links',
            'category',
            'modules' => fn ($q) => $q->orderBy('order'),
            'modules.resources' => fn ($q) => $q->orderBy('order')->orderBy('created_at'),
        ]);

        $course->loadCount(['modules', 'resources', 'enrollments']);

        return Inertia::render('courses/show', [
            'course' => $course,
            'enrollment' => null,
            'ogUrl' => route('courses.show', ['locale' => app()->getLocale(), 'course' => $course->slug]),
            'isPreview' => true,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('mentor/courses/create', [
            'categories' => Category::orderBy('name')->get(),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
            'languages' => collect(CourseLanguage::cases())->map(fn ($c) => ['value' => $c->value, 'label' => strtoupper($c->value)]),
            'isAdmin' => auth()->user()->isAdmin(),
        ]);
    }

    public function store(StoreCourseRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();
        $data['slug'] = $this->uniqueSlug($data['title']);

        if (! auth()->user()->isAdmin()) {
            unset($data['is_featured']);
        }

        $course = Course::create($data);

        $course->authors()->attach(auth()->id(), [
            'role' => 'lead',
            'added_by' => auth()->id(),
        ]);

        return redirect()
            ->route('courses.edit', ['locale' => app()->getLocale(), 'course' => $course->slug])
            ->with('success', 'Course created. Add modules and resources below.');
    }

    public function edit(Course $course): Response
    {
        $this->authorizeOwner($course);

        $course->load([
            'category',
            'authors:id,name,username,avatar,headline',
            'modules' => fn ($q) => $q->orderBy('order'),
            'modules.resources' => fn ($q) => $q->orderBy('order')->orderBy('created_at'),
            'couponCodes' => fn ($q) => $q->orderByDesc('created_at'),
        ]);

        $isLeadAuthor = auth()->user()->isAdmin() || $course->isLeadAuthor(auth()->user());

        return Inertia::render('mentor/courses/edit', [
            'course' => $course,
            'categories' => Category::orderBy('name')->get(),
            'difficulties' => collect(CourseDifficulty::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
            'languages' => collect(CourseLanguage::cases())->map(fn ($c) => ['value' => $c->value, 'label' => strtoupper($c->value)]),
            'resourceTypes' => collect(ResourceType::cases())->map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)]),
            'isAdmin' => auth()->user()->isAdmin(),
            'isLeadAuthor' => $isLeadAuthor,
        ]);
    }

    public function update(UpdateCourseRequest $request, Course $course): RedirectResponse
    {
        $this->authorizeOwner($course);

        $data = $request->validated();

        if (! auth()->user()->isAdmin()) {
            unset($data['is_featured']);
        }

        // edit slug with title changing. prevent it currently. reason: SEO impact concern.
//        if (isset($data['title']) && $data['title'] !== $course->title) {
//            $data['slug'] = $this->uniqueSlug($data['title'], $course->id);
//        }

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

    public function submitForReview(Course $course): RedirectResponse
    {
        $this->authorizeOwner($course);

        $course->update([
            'status' => \App\Enums\CourseStatus::PendingReview,
            'rejection_reason' => null,
        ]);

        return back()->with('success', 'Course submitted for review.');
    }

    public function approve(Course $course): RedirectResponse
    {
        $user = auth()->user();

        if (! $user->isAdmin()) {
            abort(403);
        }

        $course->update([
            'status' => \App\Enums\CourseStatus::Published,
            'rejection_reason' => null,
        ]);

        return back()->with('success', 'Course approved and published.');
    }

    public function reject(Request $request, Course $course): RedirectResponse
    {
        $user = auth()->user();

        if (! $user->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $course->update([
            'status' => \App\Enums\CourseStatus::Draft,
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return back()->with('success', 'Course rejected and returned to draft.');
    }

    private function authorizeOwner(Course $course): void
    {
        $user = auth()->user();

        if (! $user->isAdmin() && ! $course->isAuthor($user)) {
            abort(403);
        }
    }

    private function uniqueSlug(string $title, ?int $excludeId = null): string
    {
        $base = Str::of($title)->lower()->replaceMatches('/[^\p{L}\p{N}\p{M}]+/u', '-')->trim('-')->toString();
        $slug = $base;
        $counter = 1;

        while (Course::where('slug', $slug)->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
