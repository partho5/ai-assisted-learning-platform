import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/Admin/Forum/ForumCategoryAdminController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ForumCategory } from '@/types/forum';

const COLOR_OPTIONS = [
    'indigo', 'amber', 'violet', 'emerald', 'sky', 'rose', 'orange', 'gray',
];

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

interface CategoryWithCount extends ForumCategory {
    threads_count: number;
}

interface Props {
    categories: CategoryWithCount[];
}

interface FormState {
    name: string;
    description: string;
    color: string;
    sort_order: number;
}

const emptyForm: FormState = { name: '', description: '', color: 'indigo', sort_order: 0 };

export default function ForumCategoriesAdmin({ categories }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const [editing, setEditing] = useState<CategoryWithCount | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: `/${l}/admin/dashboard` },
        { title: 'Forum Categories', href: index.url(l) },
    ];

    function openCreate() {
        setForm(emptyForm);
        setEditing(null);
        setCreating(true);
    }

    function openEdit(cat: CategoryWithCount) {
        setForm({ name: cat.name, description: cat.description ?? '', color: cat.color, sort_order: cat.sort_order });
        setCreating(false);
        setEditing(cat);
    }

    function handleSubmit() {
        if (editing) {
            router.put(update.url({ locale: l, forumCategory: editing.slug }), form, {
                onSuccess: () => setEditing(null),
            });
        } else {
            router.post(store.url(l), form, {
                onSuccess: () => setCreating(false),
            });
        }
    }

    function handleDestroy(cat: CategoryWithCount) {
        if (!confirm(`Delete "${cat.name}"? Threads will be orphaned.`)) return;
        router.delete(destroy.url({ locale: l, forumCategory: cat.slug }));
    }

    const showForm = creating || editing !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Forum Categories" />

            <div className="md:mx-2 p-4 md:p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Forum Categories</h1>
                    <Button variant="enroll" onClick={openCreate}>New Category</Button>
                </div>

                {showForm && (
                    <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-4">
                        <h2 className="font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>

                        <div className="space-y-1">
                            <Label>Name</Label>
                            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Course Help" />
                        </div>

                        <div className="space-y-1">
                            <Label>Description (optional)</Label>
                            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
                        </div>

                        <div className="space-y-1">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {COLOR_OPTIONS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, color: c }))}
                                        className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize border-2 transition-all ${COLOR_CLASSES[c]} ${form.color === c ? 'border-foreground' : 'border-transparent'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Sort Order</Label>
                            <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-24" />
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button onClick={handleSubmit}>{editing ? 'Save Changes' : 'Create'}</Button>
                            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
                        </div>
                    </div>
                )}

                {categories.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                        No forum categories yet. Create one to get started.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Threads</th>
                                    <th className="px-4 py-3">Order</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium mr-2 ${COLOR_CLASSES[cat.color] ?? COLOR_CLASSES.gray}`}>
                                                {cat.color}
                                            </span>
                                            <span className="font-medium">{cat.name}</span>
                                            {cat.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{cat.threads_count}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{cat.sort_order}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>Edit</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDestroy(cat)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
