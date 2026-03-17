<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PersonalNotesController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('notes/edit', [
            'personal_notes' => $user->personal_notes,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'personal_notes' => ['nullable', 'string'],
        ]);

        $request->user()->update($validated);

        return back()->with('success', 'Notes saved.');
    }
}
