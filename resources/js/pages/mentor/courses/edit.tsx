import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    destroy as courseDestroy,
    index as coursesIndex,
    update as courseUpdate,
} from '@/actions/App/Http/Controllers/CourseController';
import {
    destroy as moduleDestroy,
    store as moduleStore,
    update as moduleUpdate,
} from '@/actions/App/Http/Controllers/ModuleController';
import {
    destroy as resourceDestroy,
    store as resourceStore,
    update as resourceUpdate,
} from '@/actions/App/Http/Controllers/ResourceController';
import { edit as testEdit } from '@/actions/App/Http/Controllers/TestController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, Course, CourseDifficulty, CourseModule, CourseResource, ResourceType, SelectOption } from '@/types';

interface Props {
    course: Course;
    categories: Category[];
    difficulties: SelectOption[];
    resourceTypes: SelectOption[];
}

// ─── Course Details Form ─────────────────────────────────────────────────────

function CourseDetailsForm({
    course,
    categories,
    difficulties,
    locale,
}: {
    course: Course;
    categories: Category[];
    difficulties: SelectOption[];
    locale: string;
}) {
    const form = useForm({
        title: course.title,
        description: course.description,
        what_you_will_learn: course.what_you_will_learn,
        prerequisites: course.prerequisites ?? '',
        difficulty: course.difficulty,
        estimated_duration: String(course.estimated_duration ?? ''),
        category_id: String(course.category_id ?? ''),
        thumbnail: course.thumbnail ?? '',
        status: course.status,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(courseUpdate({ locale, course: course.slug }));
    }

    function togglePublish() {
        const newStatus = course.status === 'published' ? 'draft' : 'published';
        router.put(
            courseUpdate.url({ locale, course: course.slug }),
            {
                title: course.title,
                description: course.description,
                what_you_will_learn: course.what_you_will_learn,
                prerequisites: course.prerequisites,
                difficulty: course.difficulty,
                estimated_duration: course.estimated_duration,
                category_id: course.category_id,
                thumbnail: course.thumbnail,
                status: newStatus,
            },
            { preserveScroll: true },
        );
    }

    function deleteCourse() {
        if (!confirm('Delete this course? This cannot be undone.')) { return; }
        router.delete(courseDestroy.url({ locale, course: course.slug }));
    }

    return (
        <section className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
            {/* Section header */}
            <div className="flex items-center justify-between border-b border-sidebar-border/70 bg-muted/40 px-5 py-3 dark:border-sidebar-border">
                <div>
                    <h2 className="font-semibold">Course Details</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                        {course.status}
                    </Badge>
                    <Button type="button" variant="secondary" size="compact" onClick={togglePublish}>
                        {course.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button type="button" variant="danger" size="compact" onClick={deleteCourse}>
                        Delete
                    </Button>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5 p-5">
                {/* ── Basic Info ─────────────────────────────────────── */}
                <div className="flex flex-col gap-4 rounded-lg border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-800/50 dark:bg-sky-950/25">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">Basic Info</p>
                    <Field label="Title" error={form.errors.title} required>
                        <Input
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            disabled={form.processing}
                        />
                    </Field>
                    <Field label="Description" error={form.errors.description} required>
                        <RichTextEditor
                            value={form.data.description}
                            onChange={(content) => form.setData('description', content)}
                            disabled={form.processing}
                            placeholder="Describe this course..."
                        />
                    </Field>
                </div>

                {/* ── Learning Content ───────────────────────────────── */}
                <div className="flex flex-col gap-4 rounded-lg border border-indigo-300 bg-indigo-50/70 p-4 dark:border-indigo-700/60 dark:bg-indigo-950/35">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Learning Content</p>
                    <Field label="What learners will achieve" error={form.errors.what_you_will_learn} required>
                        <RichTextEditor
                            value={form.data.what_you_will_learn}
                            onChange={(content) => form.setData('what_you_will_learn', content)}
                            disabled={form.processing}
                            placeholder="What will learners achieve by the end of this course?"
                        />
                    </Field>
                    <Field label="Prerequisites" error={form.errors.prerequisites}>
                        <Input
                            value={form.data.prerequisites}
                            onChange={(e) => form.setData('prerequisites', e.target.value)}
                            disabled={form.processing}
                        />
                    </Field>
                </div>

                {/* ── Settings ───────────────────────────────────────── */}
                <div className="flex flex-col gap-4 rounded-lg border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-700/60 dark:bg-amber-950/30">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Settings</p>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Difficulty" error={form.errors.difficulty} required>
                            <Select
                                value={form.data.difficulty}
                                onChange={(e) => form.setData('difficulty', e.target.value as CourseDifficulty)}
                                options={difficulties}
                                disabled={form.processing}
                            />
                        </Field>
                        <Field label="Duration (minutes)" error={form.errors.estimated_duration}>
                            <Input
                                type="number"
                                min={1}
                                value={form.data.estimated_duration}
                                onChange={(e) => form.setData('estimated_duration', e.target.value)}
                                disabled={form.processing}
                            />
                        </Field>
                    </div>
                    <Field label="Category" error={form.errors.category_id}>
                        <select
                            value={form.data.category_id}
                            onChange={(e) => form.setData('category_id', e.target.value)}
                            disabled={form.processing}
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">No category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Thumbnail URL" error={form.errors.thumbnail}>
                        <Input
                            value={form.data.thumbnail}
                            onChange={(e) => form.setData('thumbnail', e.target.value)}
                            disabled={form.processing}
                        />
                    </Field>
                </div>

                <div className="flex justify-end border-t border-sidebar-border pt-4">
                    <Button type="submit" variant="progress" disabled={form.processing}>
                        {form.processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </section>
    );
}

// ─── Resource Form ───────────────────────────────────────────────────────────

function ResourceForm({
    moduleId,
    courseSlug,
    locale,
    resourceTypes,
    existing,
    onDone,
}: {
    moduleId: number;
    courseSlug: string;
    locale: string;
    resourceTypes: SelectOption[];
    existing?: CourseResource;
    onDone: () => void;
}) {
    const form = useForm({
        title: existing?.title ?? '',
        type: existing?.type ?? 'video',
        url: existing?.url ?? '',
        content: existing?.content ?? '',
        source: existing?.source ?? '',
        estimated_time: String(existing?.estimated_time ?? ''),
        mentor_note: existing?.mentor_note ?? '',
        why_this_resource: existing?.why_this_resource ?? '',
        is_free: existing?.is_free ?? false,
        order: String(existing?.order ?? 0),
    });

    const needsUrl = ['video', 'article', 'document', 'audio', 'image'].includes(form.data.type);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const target = existing
            ? resourceUpdate({ locale, course: courseSlug, module: moduleId, resource: existing.id })
            : resourceStore({ locale, course: courseSlug, module: moduleId });

        form.submit(target, { preserveScroll: true, onSuccess: onDone });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-3 overflow-hidden rounded-lg border border-violet-200 bg-card dark:border-violet-800/50">
            {/* Resource form header */}
            <div className="border-b border-violet-200 bg-violet-50/60 px-4 py-2.5 dark:border-violet-800/50 dark:bg-violet-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    {existing ? 'Edit Resource' : 'New Resource'}
                </p>
            </div>

            <div className="flex flex-col gap-3 p-4">
                {/* ── Resource Info ── */}
                <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800/40 dark:bg-sky-950/20">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">Resource Info</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Title" error={form.errors.title} required>
                            <Input
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                disabled={form.processing}
                                placeholder="Resource title"
                            />
                        </Field>
                        <Field label="Type" error={form.errors.type} required>
                            <Select
                                value={form.data.type}
                                onChange={(e) => form.setData('type', e.target.value as ResourceType)}
                                options={resourceTypes}
                                disabled={form.processing}
                            />
                        </Field>
                    </div>
                    {needsUrl && (
                        <Field label="URL" error={form.errors.url} required>
                            <Input
                                value={form.data.url}
                                onChange={(e) => form.setData('url', e.target.value)}
                                disabled={form.processing}
                                placeholder="https://..."
                            />
                        </Field>
                    )}
                    {form.data.type === 'text' && (
                        <Field label="Content" error={form.errors.content}>
                            <RichTextEditor
                                value={form.data.content}
                                onChange={(content) => form.setData('content', content)}
                                disabled={form.processing}
                                placeholder="Write your content here..."
                            />
                        </Field>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Source" error={form.errors.source}>
                            <Input
                                value={form.data.source}
                                onChange={(e) => form.setData('source', e.target.value)}
                                disabled={form.processing}
                                placeholder="YouTube, Medium…"
                            />
                        </Field>
                        <Field label="Estimated time (min)" error={form.errors.estimated_time}>
                            <Input
                                type="number"
                                min={1}
                                value={form.data.estimated_time}
                                onChange={(e) => form.setData('estimated_time', e.target.value)}
                                disabled={form.processing}
                                placeholder="15"
                            />
                        </Field>
                    </div>
                </div>

                {/* ── Guidance ── */}
                <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Guidance for Learners</p>
                    <Field label="Why this resource?" error={form.errors.why_this_resource} required>
                        <RichTextEditor
                            value={form.data.why_this_resource}
                            onChange={(content) => form.setData('why_this_resource', content)}
                            disabled={form.processing}
                            placeholder="Why did you choose this specific resource?"
                        />
                    </Field>
                    <Field label="Mentor note (optional)" error={form.errors.mentor_note}>
                        <Input
                            value={form.data.mentor_note}
                            onChange={(e) => form.setData('mentor_note', e.target.value)}
                            disabled={form.processing}
                            placeholder="What should learners focus on?"
                        />
                    </Field>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_free"
                            checked={form.data.is_free}
                            onChange={(e) => form.setData('is_free', e.target.checked)}
                            className="h-4 w-4 rounded border"
                            disabled={form.processing}
                        />
                        <Label htmlFor="is_free" className="cursor-pointer text-sm">
                            Free preview (visible without subscription)
                        </Label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-sidebar-border pt-3">
                    <Button type="button" variant="ghost" size="compact" onClick={onDone} disabled={form.processing}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="progress" size="compact" disabled={form.processing}>
                        {form.processing ? 'Saving...' : existing ? 'Update Resource' : 'Add Resource'}
                    </Button>
                </div>
            </div>
        </form>
    );
}

// ─── Module Panel ────────────────────────────────────────────────────────────

function ModulePanel({
    module,
    courseSlug,
    locale,
    resourceTypes,
}: {
    module: CourseModule;
    courseSlug: string;
    locale: string;
    resourceTypes: SelectOption[];
}) {
    const [editingModule, setEditingModule] = useState(false);
    const [addingResource, setAddingResource] = useState(false);
    const [editingResourceId, setEditingResourceId] = useState<number | null>(null);

    const moduleForm = useForm({ title: module.title, description: module.description ?? '', order: String(module.order) });

    function saveModule(e: React.FormEvent) {
        e.preventDefault();
        moduleForm.submit(moduleUpdate({ locale, course: courseSlug, module: module.id }), {
            preserveScroll: true,
            onSuccess: () => setEditingModule(false),
        });
    }

    function deleteModule() {
        if (!confirm('Delete this module and all its resources?')) { return; }
        router.delete(moduleDestroy.url({ locale, course: courseSlug, module: module.id }), { preserveScroll: true });
    }

    function deleteResource(resourceId: number) {
        if (!confirm('Delete this resource?')) { return; }
        router.delete(resourceDestroy.url({ locale, course: courseSlug, module: module.id, resource: resourceId }), {
            preserveScroll: true,
        });
    }

    return (
        <div className="overflow-hidden rounded-xl border border-violet-200 bg-card dark:border-violet-800/50">
            {/* Module header */}
            <div className="flex items-center justify-between border-b border-violet-200 bg-violet-50/60 px-4 py-3 dark:border-violet-800/50 dark:bg-violet-950/25">
                {editingModule ? (
                    <form onSubmit={saveModule} className="flex flex-1 items-center gap-2">
                        <Input
                            value={moduleForm.data.title}
                            onChange={(e) => moduleForm.setData('title', e.target.value)}
                            className="h-8"
                            disabled={moduleForm.processing}
                            autoFocus
                        />
                        <Button type="submit" size="compact" variant="progress" disabled={moduleForm.processing}>
                            Save
                        </Button>
                        <Button type="button" size="compact" variant="ghost" onClick={() => setEditingModule(false)}>
                            Cancel
                        </Button>
                    </form>
                ) : (
                    <>
                        <h3 className="font-semibold text-violet-900 dark:text-violet-100">{module.title}</h3>
                        <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="compact" onClick={() => setEditingModule(true)}>
                                Edit
                            </Button>
                            <Button type="button" variant="ghost" size="compact" onClick={deleteModule} className="text-destructive hover:text-destructive">
                                Delete
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-2 p-4">
                {module.resources.map((resource) =>
                    editingResourceId === resource.id ? (
                        <ResourceForm
                            key={resource.id}
                            moduleId={module.id}
                            courseSlug={courseSlug}
                            locale={locale}
                            resourceTypes={resourceTypes}
                            existing={resource}
                            onDone={() => setEditingResourceId(null)}
                        />
                    ) : (
                        <div
                            key={resource.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/40"
                        >
                            <div className="flex min-w-0 items-center gap-2.5">
                                <Badge variant="outline" className="shrink-0 capitalize text-xs">
                                    {resource.type}
                                </Badge>
                                <span className="truncate text-sm font-medium">{resource.title}</span>
                                {resource.is_free && (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                        Free
                                    </Badge>
                                )}
                            </div>
                            <div className="ml-2 flex shrink-0 items-center gap-1">
                                {(resource.type === 'assignment' || resource.test) && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="compact"
                                        onClick={() =>
                                            router.get(
                                                testEdit.url({ locale, course: courseSlug, module: module.id, resource: resource.id }),
                                            )
                                        }
                                    >
                                        {resource.test ? 'Edit Test' : 'Add Test'}
                                    </Button>
                                )}
                                <Button type="button" variant="ghost" size="compact" onClick={() => setEditingResourceId(resource.id)}>
                                    Edit
                                </Button>
                                <Button type="button" variant="ghost" size="compact" onClick={() => deleteResource(resource.id)} className="text-destructive hover:text-destructive">
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ),
                )}

                {addingResource ? (
                    <ResourceForm
                        moduleId={module.id}
                        courseSlug={courseSlug}
                        locale={locale}
                        resourceTypes={resourceTypes}
                        onDone={() => setAddingResource(false)}
                    />
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        size="compact"
                        onClick={() => setAddingResource(true)}
                        className="mt-1 justify-start text-violet-600 hover:text-violet-700 dark:text-violet-400"
                    >
                        + Add Resource
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Add Module Form ─────────────────────────────────────────────────────────

function AddModuleForm({ courseSlug, locale }: { courseSlug: string; locale: string }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ title: '', description: '', order: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(moduleStore({ locale, course: courseSlug }), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    }

    if (!open) {
        return (
            <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
                + Add Module
            </Button>
        );
    }

    return (
        <form onSubmit={submit} className="overflow-hidden rounded-xl border border-violet-200 bg-card dark:border-violet-800/50">
            <div className="border-b border-violet-200 bg-violet-50/60 px-4 py-2.5 dark:border-violet-800/50 dark:bg-violet-950/25">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">New Module</h3>
            </div>
            <div className="flex flex-col gap-3 p-4">
                <Field label="Title" error={form.errors.title} required>
                    <Input
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        disabled={form.processing}
                        autoFocus
                        placeholder="Module title"
                    />
                </Field>
                <Field label="Description (optional)" error={form.errors.description}>
                    <Input
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                        disabled={form.processing}
                        placeholder="Brief module description"
                    />
                </Field>
                <div className="flex justify-end gap-2 border-t border-sidebar-border pt-3">
                    <Button type="button" variant="ghost" size="compact" onClick={() => setOpen(false)} disabled={form.processing}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="progress" size="compact" disabled={form.processing}>
                        {form.processing ? 'Adding...' : 'Add Module'}
                    </Button>
                </div>
            </div>
        </form>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CourseEdit({ course, categories, difficulties, resourceTypes }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: coursesIndex.url(l) },
        { title: course.title, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${course.title}`} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <CourseDetailsForm
                    course={course}
                    categories={categories}
                    difficulties={difficulties}
                    locale={l}
                />

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold">Curriculum</h2>

                    {course.modules.map((module) => (
                        <ModulePanel
                            key={module.id}
                            module={module}
                            courseSlug={course.slug}
                            locale={l}
                            resourceTypes={resourceTypes}
                        />
                    ))}

                    <AddModuleForm courseSlug={course.slug} locale={l} />
                </section>
            </div>
        </AppLayout>
    );
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function Field({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label>
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function Textarea({
    rows = 3,
    ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { rows?: number }) {
    return (
        <textarea
            rows={rows}
            {...props}
            className={
                'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ' +
                (props.className ?? '')
            }
        />
    );
}

function Select({
    options,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
    return (
        <select
            {...props}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}
