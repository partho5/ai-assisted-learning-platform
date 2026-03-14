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
import type { BillingType, BreadcrumbItem, Category, SelectOption } from '@/types';

interface Props {
    categories: Category[];
    difficulties: SelectOption[];
    languages: SelectOption[];
    isAdmin: boolean;
}

export default function CourseCreate({ categories, difficulties, languages, isAdmin }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: coursesIndex.url(l) },
        { title: 'New Course', href: '#' },
    ];

    const form = useForm({
        language: 'bn',
        title: '',
        subtitle: '',
        description: '',
        what_you_will_learn: '',
        prerequisites: '',
        difficulty: 'beginner',
        estimated_duration: '',
        category_id: '',
        thumbnail: '',
        is_featured: false,
        billing_type: 'one_time' as BillingType,
        price: '',
        currency: 'USD',
        subscription_duration_months: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(courseStore(l));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Course" />

            <div className="mx-auto mb-48 p-4 md:mx-20 md:p-6">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">
                    Create Course
                </h1>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    {/* ── Basic Info ─────────────────────────────────────── */}
                    <div className="flex flex-col gap-4 rounded-lg border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-800/50 dark:bg-sky-950/25">
                        <p className="text-[14px] font-semibold tracking-widest text-sky-600 dark:text-sky-400">
                            Basic Info
                            <span className="ml-4 font-normal text-red-500">
                                Course URL can't be changed in future
                            </span>
                            <span className="font-normal text-gray-800">
                                , others info can be edited
                            </span>
                        </p>

                        <Field label="Title" error={form.errors.title} required>
                            <Input
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                placeholder="Example: Automation for Beginners to Advanced "
                                disabled={form.processing}
                            />
                        </Field>

                        <Field label="Tagline" error={form.errors.subtitle}>
                            <Input
                                value={form.data.subtitle}
                                onChange={(e) =>
                                    form.setData('subtitle', e.target.value)
                                }
                                placeholder="Example: If you want to ........ , this course is for you"
                                disabled={form.processing}
                            />
                        </Field>

                        <Field
                            label="Description"
                            error={form.errors.description}
                            required
                        >
                            <RichTextEditor
                                value={form.data.description}
                                onChange={(val) =>
                                    form.setData('description', val)
                                }
                                placeholder="What is this course about?"
                                disabled={form.processing}
                            />
                        </Field>

                        <Field
                            label="What learners will achieve"
                            error={form.errors.what_you_will_learn}
                            required
                        >
                            <RichTextEditor
                                value={form.data.what_you_will_learn}
                                onChange={(val) =>
                                    form.setData('what_you_will_learn', val)
                                }
                                placeholder="List the outcomes learners can expect..."
                                disabled={form.processing}
                            />
                        </Field>

                        <Field
                            label="What learners need to know before this course"
                            error={form.errors.prerequisites}
                        >
                            <RichTextEditor
                                value={form.data.prerequisites}
                                onChange={(val) =>
                                    form.setData('prerequisites', val)
                                }
                                placeholder="Basic HTML knowledge, etc. (optional)"
                                disabled={form.processing}
                            />
                        </Field>
                    </div>

                    {/* ── Settings ───────────────────────────────────────── */}
                    <div className="flex flex-col gap-4 rounded-lg border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-700/60 dark:bg-amber-950/30">
                        <p className="text-[11px] font-semibold tracking-widest text-amber-700 dark:text-amber-400">
                            Settings
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Language"
                                error={form.errors.language}
                                required
                            >
                                <Select
                                    value={form.data.language}
                                    onChange={(e) =>
                                        form.setData('language', e.target.value)
                                    }
                                    options={languages}
                                    disabled={form.processing}
                                />
                            </Field>

                            <Field
                                label="Difficulty"
                                error={form.errors.difficulty}
                                required
                            >
                                <select
                                    value={form.data.difficulty}
                                    onChange={(e) =>
                                        form.setData(
                                            'difficulty',
                                            e.target.value,
                                        )
                                    }
                                    disabled={form.processing}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {difficulties.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Estimated Duration (minutes)"
                                error={form.errors.estimated_duration}
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.data.estimated_duration}
                                    onChange={(e) =>
                                        form.setData(
                                            'estimated_duration',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="120"
                                    disabled={form.processing}
                                />
                            </Field>
                        </div>

                        <Field label="Category" error={form.errors.category_id}>
                            <select
                                value={form.data.category_id}
                                onChange={(e) =>
                                    form.setData('category_id', e.target.value)
                                }
                                disabled={form.processing}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">No category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field
                            label="🔗 Thumbnail URL ( 16:9 )"
                            error={form.errors.thumbnail}
                        >
                            <Input
                                value={form.data.thumbnail}
                                onChange={(e) =>
                                    form.setData('thumbnail', e.target.value)
                                }
                                placeholder="https://..."
                                disabled={form.processing}
                            />
                        </Field>

                        {isAdmin && (
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_featured}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_featured',
                                            e.target.checked,
                                        )
                                    }
                                    disabled={form.processing}
                                    className="h-4 w-4 rounded border-input accent-primary"
                                />
                                <span className="text-sm font-medium">
                                    Featured on homepage
                                </span>
                            </label>
                        )}
                    </div>

                    {/* ── Pricing ────────────────────────────────────────── */}
                    <div className="flex flex-col gap-4 rounded-lg border border-emerald-300 bg-emerald-50/70 p-4 dark:border-emerald-700/60 dark:bg-emerald-950/30">
                        <p className="text-[11px] font-semibold tracking-widest text-emerald-700 dark:text-emerald-400">
                            Pricing
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Billing type"
                                error={form.errors.billing_type}
                                required
                            >
                                <Select
                                    value={form.data.billing_type}
                                    onChange={(e) =>
                                        form.setData(
                                            'billing_type',
                                            e.target.value as BillingType,
                                        )
                                    }
                                    options={[
                                        {
                                            value: 'one_time',
                                            label: 'One-time payment',
                                        },
                                        {
                                            value: 'subscription',
                                            label: 'Monthly subscription',
                                        },
                                    ]}
                                    disabled={form.processing}
                                />
                            </Field>
                            <Field
                                label="Currency"
                                error={form.errors.currency}
                                required
                            >
                                <Select
                                    value={form.data.currency}
                                    onChange={(e) =>
                                        form.setData('currency', e.target.value)
                                    }
                                    options={[
                                        {
                                            value: 'USD',
                                            label: 'USD — US Dollar',
                                        },
                                        { value: 'EUR', label: 'EUR — Euro' },
                                        {
                                            value: 'GBP',
                                            label: 'GBP — British Pound',
                                        },
                                        {
                                            value: 'INR',
                                            label: 'INR — Indian Rupee',
                                        },
                                        {
                                            value: 'BRL',
                                            label: 'BRL — Brazilian Real',
                                        },
                                        {
                                            value: 'MXN',
                                            label: 'MXN — Mexican Peso',
                                        },
                                        {
                                            value: 'JPY',
                                            label: 'JPY — Japanese Yen',
                                        },
                                        {
                                            value: 'AUD',
                                            label: 'AUD — Australian Dollar',
                                        },
                                        {
                                            value: 'CAD',
                                            label: 'CAD — Canadian Dollar',
                                        },
                                        {
                                            value: 'BDT',
                                            label: 'BDT — Bangladeshi Taka',
                                        },
                                    ]}
                                    disabled={form.processing}
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Price (leave blank = free)"
                                error={form.errors.price}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.data.price}
                                    onChange={(e) =>
                                        form.setData('price', e.target.value)
                                    }
                                    disabled={form.processing}
                                    placeholder="9.99"
                                />
                            </Field>
                            {form.data.billing_type === 'subscription' && (
                                <Field
                                    label="Duration (months)"
                                    error={
                                        form.errors.subscription_duration_months
                                    }
                                    required
                                >
                                    <Input
                                        type="number"
                                        min={1}
                                        max={36}
                                        value={
                                            form.data
                                                .subscription_duration_months
                                        }
                                        onChange={(e) =>
                                            form.setData(
                                                'subscription_duration_months',
                                                e.target.value,
                                            )
                                        }
                                        disabled={form.processing}
                                        placeholder="6"
                                    />
                                </Field>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Price of 0 or blank = free enrollment. Coupon codes
                            can be added after the course is created.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-sidebar-border pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => window.history.back()}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="enroll"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Creating...' : 'Create Course'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
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
