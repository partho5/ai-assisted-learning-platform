import { Head, useForm, usePage } from '@inertiajs/react';
import {
    index as coursesIndex,
    store as courseStore,
} from '@/actions/App/Http/Controllers/CourseController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, SelectOption } from '@/types';

interface Props {
    categories: Category[];
    difficulties: SelectOption[];
}

export default function CourseCreate({ categories, difficulties }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: coursesIndex.url(l) },
        { title: 'New Course', href: '#' },
    ];

    const form = useForm({
        title: '',
        description: '',
        what_you_will_learn: '',
        prerequisites: '',
        difficulty: 'beginner',
        estimated_duration: '',
        category_id: '',
        thumbnail: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(courseStore(l));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Course" />

            <div className="mx-auto max-w-3xl p-4 md:p-6">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create Course</h1>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <Field label="Title" error={form.errors.title} required>
                        <Input
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            placeholder="e.g. Mastering Laravel"
                            disabled={form.processing}
                        />
                    </Field>

                    <Field label="Description" error={form.errors.description} required>
                        <RichTextEditor
                            content={form.data.description}
                            onChange={(val) => form.setData('description', val)}
                            placeholder="What is this course about?"
                            disabled={form.processing}
                        />
                    </Field>

                    <Field label="What learners will achieve" error={form.errors.what_you_will_learn} required>
                        <RichTextEditor
                            content={form.data.what_you_will_learn}
                            onChange={(val) => form.setData('what_you_will_learn', val)}
                            placeholder="List the outcomes learners can expect..."
                            disabled={form.processing}
                        />
                    </Field>

                    <Field label="Prerequisites" error={form.errors.prerequisites}>
                        <Input
                            value={form.data.prerequisites}
                            onChange={(e) => form.setData('prerequisites', e.target.value)}
                            placeholder="Basic HTML knowledge, etc. (optional)"
                            disabled={form.processing}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Difficulty" error={form.errors.difficulty} required>
                            <select
                                value={form.data.difficulty}
                                onChange={(e) => form.setData('difficulty', e.target.value)}
                                disabled={form.processing}
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {difficulties.map((d) => (
                                    <option key={d.value} value={d.value}>
                                        {d.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Estimated Duration (minutes)" error={form.errors.estimated_duration}>
                            <Input
                                type="number"
                                min={1}
                                value={form.data.estimated_duration}
                                onChange={(e) => form.setData('estimated_duration', e.target.value)}
                                placeholder="120"
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
                            placeholder="https://..."
                            disabled={form.processing}
                        />
                    </Field>

                    <div className="flex items-center justify-end gap-3 border-t border-sidebar-border pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => window.history.back()}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="enroll" disabled={form.processing}>
                            {form.processing ? 'Creating...' : 'Create Course'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

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
