import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/Admin/Forum/ForumAiMemberAdminController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ForumCategory } from '@/types/forum';

const COLOR_CLASSES: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

type TriggerOn = 'new_thread' | 'mention' | 'unanswered_after_hours';

interface TriggerConstraints {
    trigger_on?: TriggerOn[];
    categories?: string[];
    keywords?: string[];
    unanswered_after_minutes?: number;
}

interface AiMemberUser {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    is_ai: boolean;
}

interface AiMember {
    id: number;
    user_id: number;
    persona_prompt: string;
    description: string | null;
    is_active: boolean;
    is_moderator: boolean;
    trigger_constraints: TriggerConstraints | null;
    user: AiMemberUser;
    created_at: string;
    updated_at: string;
}

interface FormState {
    name: string;
    persona_prompt: string;
    description: string;
    is_active: boolean;
    is_moderator: boolean;
    trigger_on: TriggerOn[];
    category_slugs: string[];
    keywords_raw: string;
    unanswered_after_minutes: string;
}

interface Props {
    aiMembers: AiMember[];
    categories: Pick<ForumCategory, 'id' | 'slug' | 'name' | 'color'>[];
}

const TRIGGER_OPTIONS: { value: TriggerOn; label: string }[] = [
    { value: 'new_thread', label: 'New thread' },
    { value: 'mention', label: 'Mention (@username)' },
    { value: 'unanswered_after_hours', label: 'Unanswered threads' },
];

const emptyForm: FormState = {
    name: '',
    persona_prompt: '',
    description: '',
    is_active: true,
    is_moderator: false,
    trigger_on: [],
    category_slugs: [],
    keywords_raw: '',
    unanswered_after_minutes: '',
};

function buildConstraints(form: FormState): TriggerConstraints | null {
    const constraints: TriggerConstraints = {};

    if (form.trigger_on.length > 0) {
        constraints.trigger_on = form.trigger_on;
    }
    if (form.category_slugs.length > 0) {
        constraints.categories = form.category_slugs;
    }
    const keywords = form.keywords_raw.split(',').map((k) => k.trim()).filter(Boolean);
    if (keywords.length > 0) {
        constraints.keywords = keywords;
    }
    if (form.trigger_on.includes('unanswered_after_hours') && form.unanswered_after_minutes) {
        constraints.unanswered_after_minutes = parseInt(form.unanswered_after_minutes) || 30;
    }

    return Object.keys(constraints).length > 0 ? constraints : null;
}

function formFromMember(m: AiMember): FormState {
    const c = m.trigger_constraints ?? {};
    return {
        name: m.user.name,
        persona_prompt: m.persona_prompt,
        description: m.description ?? '',
        is_active: m.is_active,
        is_moderator: m.is_moderator,
        trigger_on: (c.trigger_on ?? []) as TriggerOn[],
        category_slugs: c.categories ?? [],
        keywords_raw: (c.keywords ?? []).join(', '),
        unanswered_after_minutes: c.unanswered_after_minutes?.toString() ?? '',
    };
}

export default function ForumAiMembersAdmin({ aiMembers, categories }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const [editing, setEditing] = useState<AiMember | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: `/${l}/admin/dashboard` },
        { title: 'AI Members', href: index.url(l) },
    ];

    function openCreate() {
        setForm(emptyForm);
        setEditing(null);
        setCreating(true);
    }

    function openEdit(m: AiMember) {
        setForm(formFromMember(m));
        setCreating(false);
        setEditing(m);
    }

    function handleSubmit() {
        const payload = {
            name: form.name,
            persona_prompt: form.persona_prompt,
            description: form.description || null,
            is_active: form.is_active,
            is_moderator: form.is_moderator,
            trigger_constraints: buildConstraints(form),
        };

        if (editing) {
            router.put(update.url({ locale: l, aiMember: editing.id }), payload, {
                onSuccess: () => setEditing(null),
            });
        } else {
            router.post(store.url(l), payload, {
                onSuccess: () => setCreating(false),
            });
        }
    }

    function handleDestroy(m: AiMember) {
        if (!confirm(`Delete AI member "${m.user.name}"? Their posts will remain but the user account will be removed.`)) return;
        router.delete(destroy.url({ locale: l, aiMember: m.id }));
    }

    function toggleTrigger(t: TriggerOn) {
        setForm((f) => ({
            ...f,
            trigger_on: f.trigger_on.includes(t)
                ? f.trigger_on.filter((x) => x !== t)
                : [...f.trigger_on, t],
        }));
    }

    function toggleCategory(slug: string) {
        setForm((f) => ({
            ...f,
            category_slugs: f.category_slugs.includes(slug)
                ? f.category_slugs.filter((s) => s !== slug)
                : [...f.category_slugs, slug],
        }));
    }

    const showForm = creating || editing !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Forum Members" />

            <div className="md:mx-2 p-4 md:p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">AI Forum Members</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Manage AI personas that participate in forum discussions.</p>
                    </div>
                    <Button variant="enroll" onClick={openCreate}>New AI Member</Button>
                </div>

                {showForm && (
                    <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-5">
                        <h2 className="font-semibold">{editing ? 'Edit AI Member' : 'New AI Member'}</h2>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>Name</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Aria"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Description (optional)</Label>
                                <Input
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Short bio shown to users"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Persona prompt</Label>
                            <textarea
                                value={form.persona_prompt}
                                onChange={(e) => setForm((f) => ({ ...f, persona_prompt: e.target.value }))}
                                rows={5}
                                placeholder="You are Aria, a helpful learning assistant…"
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                    className="h-4 w-4 rounded border-input"
                                />
                                <span className="text-sm">Active</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_moderator}
                                    onChange={(e) => setForm((f) => ({ ...f, is_moderator: e.target.checked }))}
                                    className="h-4 w-4 rounded border-input"
                                />
                                <span className="text-sm">AI moderator (auto-flags content)</span>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <Label>Trigger on</Label>
                            <p className="text-xs text-muted-foreground">Leave unchecked to trigger on all events.</p>
                            <div className="flex flex-wrap gap-3">
                                {TRIGGER_OPTIONS.map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.trigger_on.includes(opt.value)}
                                            onChange={() => toggleTrigger(opt.value)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <span className="text-sm">{opt.label}</span>
                                    </label>
                                ))}
                            </div>

                            {form.trigger_on.includes('unanswered_after_hours') && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Label className="whitespace-nowrap">After (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={form.unanswered_after_minutes}
                                        onChange={(e) => setForm((f) => ({ ...f, unanswered_after_minutes: e.target.value }))}
                                        placeholder="30"
                                        className="w-24"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Active in categories</Label>
                            <p className="text-xs text-muted-foreground">Leave unchecked to be active in all categories.</p>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        onClick={() => toggleCategory(cat.slug)}
                                        className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize border-2 transition-all ${COLOR_CLASSES[cat.color] ?? COLOR_CLASSES.gray} ${form.category_slugs.includes(cat.slug) ? 'border-foreground' : 'border-transparent'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-xs text-muted-foreground">No categories yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Keywords (comma-separated)</Label>
                            <Input
                                value={form.keywords_raw}
                                onChange={(e) => setForm((f) => ({ ...f, keywords_raw: e.target.value }))}
                                placeholder="python, django, api"
                            />
                            <p className="text-xs text-muted-foreground">AI member replies only when these keywords appear in the thread.</p>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button onClick={handleSubmit}>{editing ? 'Save Changes' : 'Create'}</Button>
                            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
                        </div>
                    </div>
                )}

                {aiMembers.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                        No AI members yet. Create one to get started.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Triggers</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {aiMembers.map((m) => {
                                    const c = m.trigger_constraints ?? {};
                                    return (
                                        <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{m.user.name}</p>
                                                <p className="text-xs text-muted-foreground">@{m.user.username}</p>
                                                {m.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                <div className="flex flex-wrap gap-1">
                                                    {(c.trigger_on ?? []).map((t) => (
                                                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                                    ))}
                                                    {!c.trigger_on?.length && (
                                                        <span className="italic">all events</span>
                                                    )}
                                                </div>
                                                {c.categories && c.categories.length > 0 && (
                                                    <p className="mt-1">Categories: {c.categories.join(', ')}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={m.is_active ? 'default' : 'secondary'}>
                                                        {m.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    {m.is_moderator && (
                                                        <Badge variant="secondary" className="text-xs">Moderator</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => openEdit(m)}>Edit</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDestroy(m)}>Delete</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
