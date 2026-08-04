<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class WelcomeController extends Controller
{
    public function index(\Illuminate\Http\Request $request): Response
    {
        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'meta' => [
                'title' => trans('meta.home.title'),
                'description' => trans('meta.home.description'),
                'image' => config('seo.og_image'),
                'url' => url()->current(),
            ],
            'featuredCourses' => Inertia::defer(fn () => Course::query()
                ->published()
                ->notLinkOnly()
                ->byLanguage(app()->getLocale())
                ->with('mentor:id,name,username')
                ->withCount('resources')
                ->select(['id', 'user_id', 'title', 'subtitle', 'slug', 'description', 'thumbnail', 'difficulty', 'price', 'currency', 'billing_type', 'subscription_duration_months', 'estimated_duration', 'is_featured'])
                ->orderByDesc('is_featured')
                ->limit(3)
                ->get()
                ->map(fn (Course $course) => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'subtitle' => $course->subtitle,
                    'slug' => $course->slug,
                    'description' => $course->description,
                    'thumbnail' => $course->thumbnail,
                    'difficulty' => $course->difficulty?->value,
                    'resources_count' => $course->resources_count,
                    'price' => $course->formattedPrice() ?? 'Free',
                    /** Raw pricing alongside the display string: JSON-LD needs the numbers, not "$10.00/month". */
                    'raw_price' => $course->price,
                    'currency' => $course->currency,
                    'billing_type' => $course->billing_type,
                    'subscription_duration_months' => $course->subscription_duration_months,
                    'estimated_duration' => $course->estimated_duration,
                    'mentor_name' => $course->mentor?->name,
                    'mentor_username' => $course->mentor?->username,
                ])
            ),
        ]);
    }
}
