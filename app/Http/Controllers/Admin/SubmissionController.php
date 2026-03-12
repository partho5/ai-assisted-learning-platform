<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttemptStatus;
use App\Http\Controllers\Controller;
use App\Models\TestAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $submissions = TestAttempt::query()
            ->where('status', '!=', AttemptStatus::InProgress->value)
            ->with([
                'user:id,name,username,avatar',
                'test.testable:id,title,type',
                'test.testable.module.course:id,title,slug',
            ])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderByDesc('submitted_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/submissions', [
            'submissions' => $submissions,
            'filters' => $request->only(['status']),
        ]);
    }
}
