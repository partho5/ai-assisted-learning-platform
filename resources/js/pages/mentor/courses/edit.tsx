import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    approve as courseApprove,
    destroy as courseDestroy,
    index as coursesIndex,
    preview as coursePreview,
    reject as courseReject,
    submitForReview as courseSubmitForReview,
    update as courseUpdate,
} from '@/actions/App/Http/Controllers/CourseController';
import {
    store as couponStore,
    destroy as couponDestroy,
} from '@/actions/App/Http/Controllers/CouponCodeController';
import {
    store as authorStore,
    destroy as authorDestroy,
} from '@/actions/App/Http/Controllers/CourseAuthorController';
import {
    destroy as moduleDestroy,
    reorder as moduleReorder,
    store as moduleStore,
    update as moduleUpdate,
} from '@/actions/App/Http/Controllers/ModuleController';
import {
    destroy as resourceDestroy,
    reorder as resourceReorder,
    store as resourceStore,
    update as resourceUpdate,
} from '@/actions/App/Http/Controllers/ResourceController';
import { edit as testEdit } from '@/actions/App/Http/Controllers/TestController';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CloudinaryImageUpload from '@/components/cloudinary-image-upload';
import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BillingType, BreadcrumbItem, Category, Course, CourseDifficulty, CourseMentorWithRole, CouponCode, CourseModule, CourseResource, ResourceType, SelectOption } from '@/types';

interface Props {
    course: Course;
    categories: Category[];
    difficulties: SelectOption[];
    languages: SelectOption[];
    resourceTypes: SelectOption[];
    isAdmin: boolean;
    isLeadAuthor: boolean;
}

// ─── Course Details Form ─────────────────────────────────────────────────────

function CourseDetailsForm({
    course,
    categories,
    difficulties,
    languages,
    locale,
    isAdmin,
}: {
    course: Course;
    categories: Category[];
    difficulties: SelectOption[];
    languages: SelectOption[];
    locale: string;
    isAdmin: boolean;
}) {
    const form = useForm({
        language: course.language,
        title: course.title,
        subtitle: course.subtitle ?? '',
        description: course.description,
        what_you_will_learn: course.what_you_will_learn,
        prerequisites: course.prerequisites ?? '',
        difficulty: course.difficulty,
        estimated_duration: String(course.estimated_duration ?? ''),
        category_id: String(course.category_id ?? ''),
        thumbnail: course.thumbnail ?? '',
        is_featured: course.is_featured,
        status: course.status,
        billing_type: course.billing_type ?? 'one_time',
        price: course.price ?? '',
        currency: course.currency ?? 'USD',
        subscription_duration_months: String(course.subscription_duration_months ?? ''),
        partner_commission_rate: course.partner_commission_rate ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(courseUpdate({ locale, course: course.slug }));
    }

    function unpublish() {
        router.put(
            courseUpdate.url({ locale, course: course.slug }),
            {
                language: course.language,
                title: course.title,
                subtitle: course.subtitle,
                description: course.description,
                what_you_will_learn: course.what_you_will_learn,
                prerequisites: course.prerequisites,
                difficulty: course.difficulty,
                estimated_duration: course.estimated_duration,
                category_id: course.category_id,
                thumbnail: course.thumbnail,
                status: 'draft',
            },
            { preserveScroll: true },
        );
    }

    function submitForReview() {
        router.post(courseSubmitForReview.url({ locale, course: course.slug }), {}, { preserveScroll: true });
    }

    function approve() {
        router.post(courseApprove.url({ locale, course: course.slug }), {}, { preserveScroll: true });
    }

    function reject() {
        const reason = prompt('Rejection reason (required):');
        if (!reason?.trim()) { return; }
        router.post(courseReject.url({ locale, course: course.slug }), { rejection_reason: reason }, { preserveScroll: true });
    }

    function deleteCourse() {
        if (!confirm('Delete this course? This cannot be undone.')) { return; }
        router.delete(courseDestroy.url({ locale, course: course.slug }));
    }

    return (
        <section className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
            {/* Section header */}
            <div className="flex items-center justify-between border-b border-sidebar-border/70 bg-muted/40 px-2 md:px-5 py-3 dark:border-sidebar-border">
                <div>
                    <h2 className="font-semibold">Course Details</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={course.status === 'published' ? 'default' : 'secondary'}
                        className={`capitalize ${course.status === 'pending_review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : ''}`}
                    >
                        {course.status === 'pending_review' ? 'Pending Review' : course.status}
                    </Badge>
                    <Link href={coursePreview.url({ locale, course: course.slug })}>
                        <Button type="button" variant="utility" size="compact">
                            Preview
                        </Button>
                    </Link>
                    {course.status === 'published' && (
                        <Button type="button" variant="secondary" size="compact" onClick={unpublish}>
                            Unpublish
                        </Button>
                    )}
                    {course.status === 'draft' && !isAdmin && (
                        <Button type="button" variant="enroll" size="compact" onClick={submitForReview}>
                            Submit for Review
                        </Button>
                    )}
                    {course.status === 'draft' && isAdmin && (
                        <Button type="button" variant="enroll" size="compact" onClick={approve}>
                            Publish
                        </Button>
                    )}
                    {course.status === 'pending_review' && isAdmin && (
                        <>
                            <Button type="button" variant="complete" size="compact" onClick={approve}>
                                Approve
                            </Button>
                            <Button type="button" variant="danger" size="compact" onClick={reject}>
                                Reject
                            </Button>
                        </>
                    )}
                    <Button
                        type="button"
                        variant="danger"
                        size="compact"
                        onClick={deleteCourse}
                    >
                        Delete
                    </Button>
                </div>
            </div>

            {course.rejection_reason && course.status === 'draft' && (
                <div className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/30">
                    <p className="mb-1 text-sm font-semibold text-red-700 dark:text-red-400">Rejected — revise and resubmit</p>
                    <p className="text-sm text-red-600 dark:text-red-300">Message admin panel: {course.rejection_reason}</p>
                </div>
            )}
            {course.status === 'pending_review' && (
                <div className="mx-5 mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Under review — editing is locked</p>
                    <p className="text-sm text-amber-600 dark:text-amber-300">An admin will review and approve or provide feedback.</p>
                </div>
            )}
            <form onSubmit={submit} className="flex flex-col gap-5 p-0 md:p-5">
                {/* ── Basic Info ─────────────────────────────────────── */}
                <div className="flex flex-col gap-4 md:rounded-lg border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-800/50 dark:bg-sky-950/25">
                    <p className="text-[14px] font-semibold tracking-widest text-sky-600 dark:text-sky-400">
                        Basic Info
                    </p>
                    <Field label="Title" error={form.errors.title} required>
                        <Input
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            disabled={form.processing}
                        />
                    </Field>
                    <Field label="Tagline" error={form.errors.subtitle}>
                        <Input
                            value={form.data.subtitle}
                            onChange={(e) =>
                                form.setData('subtitle', e.target.value)
                            }
                            placeholder="A short tagline for this course"
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
                            onChange={(content) =>
                                form.setData('description', content)
                            }
                            disabled={form.processing}
                            placeholder="Describe this course..."
                        />
                    </Field>
                </div>

                {/* ── Learning Content ───────────────────────────────── */}
                <div className="flex flex-col gap-4 rounded-lg border border-indigo-300 bg-indigo-50/70 p-4 dark:border-indigo-700/60 dark:bg-indigo-950/35">
                    <p className="text-[14px] font-semibold tracking-widest text-indigo-600 dark:text-indigo-400">
                        Learning Content
                    </p>
                    <Field
                        label="What learners will achieve"
                        error={form.errors.what_you_will_learn}
                        required
                    >
                        <RichTextEditor
                            value={form.data.what_you_will_learn}
                            onChange={(content) =>
                                form.setData('what_you_will_learn', content)
                            }
                            disabled={form.processing}
                            placeholder="What will learners achieve by the end of this course?"
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
                            <Select
                                value={form.data.difficulty}
                                onChange={(e) =>
                                    form.setData(
                                        'difficulty',
                                        e.target.value as CourseDifficulty,
                                    )
                                }
                                options={difficulties}
                                disabled={form.processing}
                            />
                        </Field>
                        <Field
                            label="Duration (minutes)"
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
                        label="Thumbnail"
                        error={form.errors.thumbnail}
                    >
                        <CloudinaryImageUpload
                            value={form.data.thumbnail}
                            onChange={(url) => form.setData('thumbnail', url)}
                            disabled={form.processing}
                            aspectHint="16:9"
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
                                    { value: 'USD', label: 'USD — US Dollar' },
                                    { value: 'EUR', label: 'EUR — Euro' },
                                    { value: 'GBP', label: 'GBP — British Pound' },
                                    { value: 'AUD', label: 'AUD — Australian Dollar' },
                                    { value: 'CAD', label: 'CAD — Canadian Dollar' },
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
                                error={form.errors.subscription_duration_months}
                                required
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    max={36}
                                    value={
                                        form.data.subscription_duration_months
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
                        <Field
                            label="Partner Commission (%)"
                            error={form.errors.partner_commission_rate}
                        >
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={form.data.partner_commission_rate}
                                onChange={(e) =>
                                    form.setData(
                                        'partner_commission_rate',
                                        e.target.value,
                                    )
                                }
                                disabled={form.processing}
                                placeholder="e.g. 10"
                            />
                        </Field>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Price of 0 or blank = free enrollment. Set a partner
                        commission rate to enable the affiliate program for this
                        course.
                    </p>
                </div>

                <div className="flex justify-end border-t border-sidebar-border pt-4">
                    <Button
                        type="submit"
                        variant="progress"
                        disabled={form.processing || course.status === 'pending_review'}
                    >
                        {form.processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </section>
    );
}

// ─── Co-Author Manager ────────────────────────────────────────────────────────

function CoAuthorManager({
    course,
    locale,
    isLeadAuthor,
}: {
    course: Course;
    locale: string;
    isLeadAuthor: boolean;
}) {
    const authors: CourseMentorWithRole[] = course.authors ?? [];
    const [identifier, setIdentifier] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!identifier.trim()) return;

        setAdding(true);
        setError(null);

        router.post(
            authorStore.url({ locale, course: course.slug }),
            { identifier: identifier.trim() },
            {
                preserveScroll: true,
                onError: (errors) => {
                    setError(errors.identifier ?? errors.error ?? 'Something went wrong.');
                },
                onSuccess: () => setIdentifier(''),
                onFinish: () => setAdding(false),
            },
        );
    }

    function handleRemove(author: CourseMentorWithRole) {
        router.delete(
            authorDestroy.url({ locale, course: course.slug, author: author.id! }),
            { preserveScroll: true },
        );
    }

    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
                <h2 className="font-semibold">Co-authors</h2>
            </div>
            <div className="p-5">
                {/* Current authors list */}
                <div className="mb-4 flex flex-col gap-2">
                    {authors.map((author) => (
                        <div
                            key={author.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2.5"
                        >
                            <div className="flex items-center gap-3">
                                {author.avatar ? (
                                    <img
                                        src={author.avatar}
                                        alt={author.name}
                                        className="size-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                        {author.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm font-medium">{author.name}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">@{author.username}</span>
                                </div>
                                {author.pivot?.role === 'lead' && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                        Lead
                                    </span>
                                )}
                            </div>
                            {isLeadAuthor && author.pivot?.role !== 'lead' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleRemove(author)}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add co-author form */}
                <form onSubmit={handleAdd} className="flex gap-2">
                    <Input
                        placeholder="Email or username"
                        value={identifier}
                        onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                        className="flex-1"
                    />
                    <Button type="submit" variant="secondary" disabled={adding}>
                        {adding ? 'Adding…' : 'Add'}
                    </Button>
                </form>
                {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
            </div>
        </section>
    );
}

// ─── Coupon Code Manager ─────────────────────────────────────────────────────

function CouponCodeManager({ course, locale }: { course: Course; locale: string }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        code: '',
        discount_percent: '',
        usage_limit: '',
        expires_at: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(couponStore({ locale, course: course.slug }), {
            preserveScroll: true,
            onSuccess: () => { form.reset(); setOpen(false); },
        });
    }

    function deleteCoupon(coupon: CouponCode) {
        if (!confirm(`Delete coupon "${coupon.code}"?`)) { return; }
        router.delete(couponDestroy.url({ locale, course: course.slug, couponCode: coupon.id }), { preserveScroll: true });
    }

    const coupons = course.coupon_codes ?? [];

    return (
        <section className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
            <div className="flex items-center justify-between border-b border-sidebar-border/70 bg-muted/40 px-2 md:px-5 py-3 dark:border-sidebar-border">
                <div>
                    <h2 className="font-semibold">Coupon Codes</h2>
                    <p className="text-xs text-muted-foreground">Affiliate & discount codes for this course</p>
                </div>
                {!open && (
                    <Button type="button" variant="secondary" size="compact" onClick={() => setOpen(true)}>
                        + New Code
                    </Button>
                )}
            </div>

            <div className="p-5 flex flex-col gap-4">
                {open && (
                    <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/25">
                        <p className="text-[11px] font-semibold tracking-widest text-emerald-700 dark:text-emerald-400">New Coupon</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Code (auto-generated if blank)" error={form.errors.code}>
                                <Input
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                    disabled={form.processing}
                                    placeholder="FRIEND2024"
                                    className="font-mono tracking-wider uppercase"
                                />
                            </Field>
                            <Field label="Discount %" error={form.errors.discount_percent} required>
                                <Input
                                    type="number"
                                    min={5}
                                    max={100}
                                    value={form.data.discount_percent}
                                    onChange={(e) => form.setData('discount_percent', e.target.value)}
                                    disabled={form.processing}
                                    placeholder="100"
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Usage limit (blank = unlimited)" error={form.errors.usage_limit}>
                                <Input
                                    type="number"
                                    min={1}
                                    value={form.data.usage_limit}
                                    onChange={(e) => form.setData('usage_limit', e.target.value)}
                                    disabled={form.processing}
                                    placeholder="1"
                                />
                            </Field>
                            <Field label="Expires at (blank = never)" error={form.errors.expires_at}>
                                <Input
                                    type="date"
                                    value={form.data.expires_at}
                                    onChange={(e) => form.setData('expires_at', e.target.value)}
                                    disabled={form.processing}
                                />
                            </Field>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-emerald-200 pt-3 dark:border-emerald-800/50">
                            <Button type="button" variant="ghost" size="compact" onClick={() => setOpen(false)} disabled={form.processing}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="progress" size="compact" disabled={form.processing}>
                                {form.processing ? 'Creating...' : 'Create Code'}
                            </Button>
                        </div>
                    </form>
                )}

                {coupons.length === 0 && !open ? (
                    <p className="text-sm text-muted-foreground">No coupon codes yet. Create one to give discounts or free access.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {coupons.map((coupon) => (
                            <div key={coupon.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-semibold tracking-wider">{coupon.code}</span>
                                    <Badge className={`text-xs ${coupon.discount_percent >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                                        {coupon.discount_percent === 100 ? 'Free (100%)' : `${coupon.discount_percent}% off`}
                                    </Badge>
                                    {!coupon.is_active && (
                                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''} uses</span>
                                    {coupon.expires_at && <span>Expires {new Date(coupon.expires_at).toLocaleDateString()}</span>}
                                    <Button type="button" variant="ghost" size="compact" onClick={() => deleteCoupon(coupon)} className="text-destructive hover:text-destructive">
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
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
        caption: existing?.caption ?? '',
        estimated_time: String(existing?.estimated_time ?? ''),
        mentor_note: existing?.mentor_note ?? '',
        why_this_resource: existing?.why_this_resource ?? '',
        is_free: existing?.is_free ?? false,
        order: String(existing?.order ?? 0),
    });

    const needsUrl = ['video', 'article', 'document', 'audio'].includes(form.data.type);

    const [ytEmbedBlocked, setYtEmbedBlocked] = useState<boolean>(false);
    useEffect(() => {
        if (form.data.type !== 'video') { setYtEmbedBlocked(false); return; }
        const match = form.data.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
        if (!match) { setYtEmbedBlocked(false); return; }
        const videoId = match[1];
        const timer = setTimeout(() => {
            fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
                .then((res) => setYtEmbedBlocked(!res.ok))
                .catch(() => setYtEmbedBlocked(false));
        }, 600);
        return () => clearTimeout(timer);
    }, [form.data.url, form.data.type]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const target = existing
            ? resourceUpdate({ locale, course: courseSlug, module: moduleId, resource: existing.id })
            : resourceStore({ locale, course: courseSlug, module: moduleId });

        form.submit(target, { preserveScroll: true, onSuccess: onDone });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-3 overflow-hidden rounded-lg border border-violet-200 bg-card dark:border-violet-800/50">
            {/* Lesson form header */}
            <div className="border-b border-violet-200 bg-violet-50/60 px-4 py-2.5 dark:border-violet-800/50 dark:bg-violet-950/30">
                <p className="text-[11px] font-semibold tracking-widest text-violet-600 dark:text-violet-400">
                    {existing ? 'Edit Lesson' : 'New Lesson'}
                </p>
            </div>

            <div className="flex flex-col gap-3 p-4">
                {/* ── Resource Info ── */}
                <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800/40 dark:bg-sky-950/20">
                    <p className="text-[14px] font-semibold tracking-widest text-sky-600 dark:text-sky-400">Lesson Info</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Lesson Title" error={form.errors.title} required>
                            <Input
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                disabled={form.processing}
                                placeholder="Example: Creating Acount / Security Best Practices / Tricks to Do ...."
                            />
                        </Field>
                        <Field label="Resource Type" error={form.errors.type} required>
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
                            {ytEmbedBlocked && (
                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                    ⚠ This video has embedding disabled. Learners will see a "Watch on YouTube" link instead of an inline player.
                                </p>
                            )}
                        </Field>
                    )}
                    {form.data.type === 'image' && (
                        <Field label="Image" error={form.errors.url} required>
                            <CloudinaryImageUpload
                                value={form.data.url}
                                onChange={(url) => form.setData('url', url)}
                                disabled={form.processing}
                            />
                        </Field>
                    )}
                    <Field label="Importance of this lesson (why it's helpful)" error={form.errors.why_this_resource} required>
                        <span className="text-red-500">Keep as short as possible</span>
                        <RichTextEditor
                            value={form.data.why_this_resource}
                            onChange={(content) => form.setData('why_this_resource', content)}
                            disabled={form.processing}
                            placeholder="Why did you choose this specific lesson?"
                        />
                    </Field>
                    {form.data.type === 'text' && (
                        <Field label="Content" error={form.errors.content} required>
                            <RichTextEditor
                                value={form.data.content}
                                onChange={(content) => form.setData('content', content)}
                                disabled={form.processing}
                                placeholder="Write your content here..."
                            />
                        </Field>
                    )}
                    <Field label="Estimated time to complete this lesson (minutes)" error={form.errors.estimated_time}>
                        <Input
                            type="number"
                            min={1}
                            value={form.data.estimated_time}
                            onChange={(e) => form.setData('estimated_time', e.target.value)}
                            disabled={form.processing}
                            placeholder="15"
                        />
                    </Field>
                    {form.data.type !== 'text' && (
                        <Field label="Write about this resource (optional)" error={form.errors.caption}>
                            <RichTextEditor
                                value={form.data.caption}
                                onChange={(content) => form.setData('caption', content)}
                                disabled={form.processing}
                                placeholder="Add context, notes, or a description about this resource…"
                            />
                        </Field>
                    )}
                </div>

                {/* ── Guidance ── */}
                <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                    <p className="text-[14px] font-semibold tracking-widest text-emerald-600 dark:text-emerald-400">Guidance for Learners</p>
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
                            Free preview (accessible without subscription)
                        </Label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-sidebar-border pt-3">
                    <Button type="button" variant="ghost" size="compact" onClick={onDone} disabled={form.processing}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="progress" size="compact" disabled={form.processing}>
                        {form.processing ? 'Saving...' : existing ? 'Update Lesson' : 'Add Lesson'}
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
    dragHandleProps,
}: {
    module: CourseModule;
    courseSlug: string;
    locale: string;
    resourceTypes: SelectOption[];
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
    const [editingModule, setEditingModule] = useState(false);
    const [addingResource, setAddingResource] = useState(false);
    const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
    const [resources, setResources] = useState<CourseResource[]>(module.resources);

    useEffect(() => setResources(module.resources), [module.resources]);

    const sensors = useSensors(useSensor(PointerSensor));

    function handleResourceDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) { return; }

        const oldIndex = resources.findIndex((r) => r.id === active.id);
        const newIndex = resources.findIndex((r) => r.id === over.id);
        const reordered = arrayMove(resources, oldIndex, newIndex);

        setResources(reordered);
        router.post(
            resourceReorder.url({ locale, course: courseSlug, module: module.id }),
            { order: reordered.map((r) => r.id) },
            { preserveScroll: true, preserveState: true },
        );
    }

    const moduleForm = useForm({ title: module.title, description: module.description ?? '', order: String(module.order) });

    function saveModule(e: React.FormEvent) {
        e.preventDefault();
        moduleForm.submit(moduleUpdate({ locale, course: courseSlug, module: module.id }), {
            preserveScroll: true,
            onSuccess: () => setEditingModule(false),
        });
    }

    function deleteModule() {
        if (!confirm('Delete this module and all its lessons?')) { return; }
        router.delete(moduleDestroy.url({ locale, course: courseSlug, module: module.id }), { preserveScroll: true });
    }

    function deleteResource(resourceId: number) {
        if (!confirm('Delete this lesson?')) { return; }
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
                        <div className="flex min-w-0 items-center gap-2">
                            <button
                                type="button"
                                className="shrink-0 cursor-grab touch-none text-violet-400 hover:text-violet-600 active:cursor-grabbing dark:text-violet-600 dark:hover:text-violet-400"
                                aria-label="Drag to reorder module"
                                {...dragHandleProps}
                            >
                                <GripVertical className="h-4 w-4" />
                            </button>
                            <h3 className="truncate font-semibold text-violet-900 dark:text-violet-100">{module.title}</h3>
                        </div>
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
                <DndContext sensors={sensors} onDragEnd={handleResourceDragEnd}>
                    <SortableContext
                        items={resources.filter((r) => r.id !== editingResourceId).map((r) => r.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {resources.map((resource) =>
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
                                <SortableResourceRow
                                    key={resource.id}
                                    resource={resource}
                                    locale={locale}
                                    courseSlug={courseSlug}
                                    moduleId={module.id}
                                    onEdit={() => setEditingResourceId(resource.id)}
                                    onDelete={() => deleteResource(resource.id)}
                                />
                            ),
                        )}
                    </SortableContext>
                </DndContext>

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
                        + Add Lesson
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
                <Field label="Module Title" error={form.errors.title} required>
                    <Input
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        disabled={form.processing}
                        autoFocus
                        placeholder="Example: Understanding Customer Psychology"
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

export default function CourseEdit({ course, categories, difficulties, languages, resourceTypes, isAdmin, isLeadAuthor }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const [modules, setModules] = useState<CourseModule[]>(course.modules);
    useEffect(() => setModules(course.modules), [course.modules]);

    const sensors = useSensors(useSensor(PointerSensor));

    function handleModuleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) { return; }

        const oldIndex = modules.findIndex((m) => m.id === active.id);
        const newIndex = modules.findIndex((m) => m.id === over.id);
        const reordered = arrayMove(modules, oldIndex, newIndex);

        setModules(reordered);
        router.post(
            moduleReorder.url({ locale: l, course: course.slug }),
            { order: reordered.map((m) => m.id) },
            { preserveScroll: true, preserveState: true },
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: coursesIndex.url(l) },
        { title: course.title, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${course.title}`} />

            <div className="flex flex-col gap-6 p-2 md:p-6 mb-48">
                <CourseDetailsForm
                    course={course}
                    categories={categories}
                    difficulties={difficulties}
                    languages={languages}
                    locale={l}
                    isAdmin={isAdmin}
                />

                <CoAuthorManager course={course} locale={l} isLeadAuthor={isLeadAuthor} />

                <CouponCodeManager course={course} locale={l} />

                <section className="flex flex-col gap-4">
                    <h2 className="font-semibold">Curriculum</h2>

                    <DndContext sensors={sensors} onDragEnd={handleModuleDragEnd}>
                        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                            {modules.map((module) => (
                                <SortableModulePanel
                                    key={module.id}
                                    module={module}
                                    courseSlug={course.slug}
                                    locale={l}
                                    resourceTypes={resourceTypes}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <AddModuleForm courseSlug={course.slug} locale={l} />
                </section>
            </div>
        </AppLayout>
    );
}

// ─── Sortable wrappers ───────────────────────────────────────────────────────

function SortableModulePanel(props: React.ComponentProps<typeof ModulePanel>) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.module.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <ModulePanel {...props} dragHandleProps={{ ...attributes, ...listeners }} />
        </div>
    );
}

function SortableResourceRow({
    resource,
    locale,
    courseSlug,
    moduleId,
    onEdit,
    onDelete,
}: {
    resource: CourseResource;
    locale: string;
    courseSlug: string;
    moduleId: number;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: resource.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/40"
        >
            <div className="flex min-w-0 items-center gap-2.5">
                <button
                    type="button"
                    className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder lesson"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <Badge variant="outline" className="shrink-0 text-xs capitalize">
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
                        onClick={() => router.get(testEdit.url({ locale, course: courseSlug, module: moduleId, resource: resource.id }))}
                    >
                        {resource.test ? 'Edit Questions' : 'Set/Edit Questions'}
                    </Button>
                )}
                <Button type="button" variant="ghost" size="compact" onClick={onEdit}>
                    Edit
                </Button>
                <Button type="button" variant="ghost" size="compact" onClick={onDelete} className="text-destructive hover:text-destructive">
                    Delete
                </Button>
            </div>
        </div>
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
