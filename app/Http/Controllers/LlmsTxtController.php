<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Course;
use Illuminate\Http\Response;

class LlmsTxtController extends Controller
{
    public function index(): Response
    {
        $appName = config('app.name');
        $baseUrl = rtrim(config('app.url'), '/');

        $lines = [
            "# {$appName}",
            '',
            "> {$appName} is a mentor-led online learning platform where learners take courses, complete real tests and assignments, and build verified skill portfolios that employers trust.",
            '',
            '## Key Pages',
            "- Homepage: {$baseUrl}/en/",
            "- Course Catalog: {$baseUrl}/en/courses",
            "- Resources (guides & articles): {$baseUrl}/en/resources",
            "- About Us: {$baseUrl}/en/about-us",
            "- Contact: {$baseUrl}/en/contact",
            '',
            '## Published Courses',
        ];

        $courses = Course::query()
            ->published()
            ->select(['title', 'slug', 'subtitle', 'description', 'difficulty', 'price', 'currency'])
            ->with('mentor:id,name')
            ->orderBy('title')
            ->get();

        foreach ($courses as $course) {
            $desc = $course->subtitle
                ? trim($course->subtitle)
                : strip_tags($course->description ?? '');
            $desc = preg_replace('/\s+/', ' ', trim($desc));
            if (strlen($desc) > 200) {
                $desc = substr($desc, 0, 197).'...';
            }

            $price = $course->price && (float) $course->price > 0
                ? number_format((float) $course->price, 2).' '.($course->currency ?? 'USD')
                : 'Free';

            $lines[] = '';
            $lines[] = "### {$course->title}";
            $lines[] = "- URL: {$baseUrl}/en/courses/{$course->slug}";
            $lines[] = '- Difficulty: '.($course->difficulty?->value ?? 'N/A');
            $lines[] = "- Price: {$price}";
            if ($course->mentor) {
                $lines[] = "- Mentor: {$course->mentor->name}";
            }
            $lines[] = "- {$desc}";
        }

        // Published articles
        $articles = Article::query()
            ->published()
            ->select(['title', 'slug', 'excerpt', 'read_time_minutes', 'tags'])
            ->with('author:id,name')
            ->with('category:id,name')
            ->orderBy('published_at', 'desc')
            ->get();

        if ($articles->isNotEmpty()) {
            $lines[] = '';
            $lines[] = '## Knowledge Resources';

            foreach ($articles as $article) {
                $desc = $article->excerpt
                    ? trim($article->excerpt)
                    : "A {$article->read_time_minutes}-minute read.";

                $lines[] = '';
                $lines[] = "### {$article->title}";
                $lines[] = "- URL: {$baseUrl}/en/resources/{$article->slug}";
                if ($article->author) {
                    $lines[] = "- Author: {$article->author->name}";
                }
                if ($article->category) {
                    $lines[] = "- Category: {$article->category->name}";
                }
                if ($article->tags) {
                    $lines[] = '- Keywords: '.implode(', ', $article->tags);
                }
                $lines[] = "- {$desc}";
            }
        }

        $lines[] = '';
        $lines[] = '## Contact';
        $lines[] = "- Contact page: {$baseUrl}/en/contact";

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }
}
