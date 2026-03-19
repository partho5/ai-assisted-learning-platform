<?php

namespace App\Http\Controllers\Admin\Forum;

use App\Http\Controllers\Controller;
use App\Models\AiMember;
use App\Models\ForumCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ForumAiMemberAdminController extends Controller
{
    public function index(): Response
    {
        $aiMembers = AiMember::query()
            ->with('user:id,name,username,avatar,is_ai')
            ->orderByDesc('created_at')
            ->get();

        $categories = ForumCategory::orderBy('sort_order')->get(['id', 'slug', 'name', 'color']);

        return Inertia::render('admin/forum/ai-members', [
            'aiMembers' => $aiMembers,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'persona_prompt' => ['required', 'string'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'is_moderator' => ['boolean'],
            'trigger_constraints' => ['nullable', 'array'],
        ]);

        $username = $this->uniqueUsername($validated['name']);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $username,
            'email' => $username.'@ai.internal',
            'password' => bcrypt(Str::random(32)),
            'is_ai' => true,
        ]);

        AiMember::create([
            'user_id' => $user->id,
            'persona_prompt' => $validated['persona_prompt'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'is_moderator' => $validated['is_moderator'] ?? false,
            'trigger_constraints' => $validated['trigger_constraints'] ?? null,
        ]);

        return redirect()->route('admin.forum.ai-members.index', [
            'locale' => $request->route('locale', 'en'),
        ]);
    }

    public function update(Request $request, AiMember $aiMember): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'persona_prompt' => ['required', 'string'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'is_moderator' => ['boolean'],
            'trigger_constraints' => ['nullable', 'array'],
        ]);

        $aiMember->user->update(['name' => $validated['name']]);

        $aiMember->update([
            'persona_prompt' => $validated['persona_prompt'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? $aiMember->is_active,
            'is_moderator' => $validated['is_moderator'] ?? $aiMember->is_moderator,
            'trigger_constraints' => $validated['trigger_constraints'] ?? null,
        ]);

        return redirect()->route('admin.forum.ai-members.index', [
            'locale' => $request->route('locale', 'en'),
        ]);
    }

    public function destroy(Request $request, AiMember $aiMember): RedirectResponse
    {
        $user = $aiMember->user;
        $aiMember->delete();
        $user->delete();

        return redirect()->route('admin.forum.ai-members.index', [
            'locale' => $request->route('locale', 'en'),
        ]);
    }

    private function uniqueUsername(string $name): string
    {
        $base = 'ai_'.Str::slug($name, '_');
        $username = $base;
        $i = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base.'_'.$i++;
        }

        return $username;
    }
}
