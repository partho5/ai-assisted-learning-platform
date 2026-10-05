<?php

namespace App\Http\Controllers;

use App\Services\Tools\ToolRegistry;
use Inertia\Inertia;
use Inertia\Response;

class ToolController extends Controller
{
    public function __construct(protected ToolRegistry $registry) {}

    public function index(): Response
    {
        $tools = array_map(fn ($tool): array => [
            'slug' => $tool->slug(),
            'name' => $tool->name(),
            'description' => $tool->description(),
        ], $this->registry->all());

        return Inertia::render('tools/index', [
            'tools' => $tools,
            'meta' => [
                'title' => 'Free Online Tools',
                'description' => 'Free, instant browser-based tools for text styling and more. No sign-up required.',
                'image' => config('seo.og_image'),
                'url' => url()->current(),
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $tool = $this->registry->find($slug) ?? abort(404);

        return Inertia::render($tool->component(), [
            'meta' => [
                ...$tool->meta(),
                'image' => config('seo.og_image'),
                'url' => url()->current(),
            ],
        ]);
    }
}
