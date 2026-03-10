<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class WelcomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'featuredCourses' => Inertia::defer(fn () => Course::query()
                ->published()
                ->with('mentor:id,name,username')
                ->withCount('resources')
                ->where('is_featured', true)
                ->orWhere(fn ($q) => $q->published())
                ->select(['id', 'user_id', 'title', 'slug', 'description', 'thumbnail', 'difficulty', 'price', 'currency', 'billing_type', 'estimated_duration', 'is_featured'])
                ->orderByDesc('is_featured')
                ->limit(3)
                ->get()
                ->map(fn (Course $course) => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'slug' => $course->slug,
                    'description' => $course->description,
                    'thumbnail' => $course->thumbnail,
                    'difficulty' => $course->difficulty?->value,
                    'resources_count' => $course->resources_count,
                    'price' => $course->formattedPrice() ?? 'Free',
                    'mentor_name' => $course->mentor?->name,
                    'mentor_username' => $course->mentor?->username,
                ])
            ),
        ]);
    }
}
