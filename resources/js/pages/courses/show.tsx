import { Head, Link, router, usePage } from '@inertiajs/react';
import { store as enrollStore } from '@/actions/App/Http/Controllers/EnrollmentController';
import { show as learnShow } from '@/actions/App/Http/Controllers/LearnController';
import { course as courseChatAction } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { PurchaseButton } from '@/components/payment/purchase-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import RichHtml from '@/components/rich-html';
import PublicLayout from '@/layouts/public-layout';
import type { Course, Enrollment } from '@/types';

interface Props {
    course: Course;
    enrollment: Enrollment | null;
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
    video: 'Video',
    article: 'Article',
    text: 'Text',
    document: 'Document',
    audio: 'Audio',
    image: 'Image',
    assignment: 'Assignment',
};

export default function CourseShow({ course, enrollment }: Props) {
    const { auth, locale } = usePage().props;
    const l = String(locale);
    const totalResources = course.resources_count ?? course.modules.reduce((sum, m) => sum + m.resources.length, 0);
    const durationText = course.estimated_duration
        ? course.estimated_duration >= 60
            ? `${Math.round(course.estimated_duration / 60)} hours`
            : `${course.estimated_duration} min`
        : null;

    function handleEnroll() {
        router.post(enrollStore.url({ locale: l, course: course.slug }));
    }

    const chatContext = {
        type: 'course' as const,
        key: `course-${course.id}`,
        label: course.title,
        endpoint: courseChatAction.url({ locale: l, course: course.slug }),
        historyEndpoint: chatHistory.url(l),
        locale: l,
    };

    return (
        <PublicLayout hidePlatformChat>
            <Head title={course.title}>
                <meta name="description" content={course.description} />
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    {/* Main content */}
                    <div className="min-w-0 flex-1">
                        {/* Breadcrumb */}
                        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <span
                                className="cursor-pointer transition-colors hover:text-foreground"
                                onClick={() => window.history.back()}
                            >
                                Courses
                            </span>
                            <span>/</span>
                            <span className="truncate text-foreground">
                                {course.title}
                            </span>
                        </div>

                        {/* Hero */}
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            {course.category && (
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300">
                                    {course.category.name}
                                </Badge>
                            )}
                            <Badge className="bg-amber-100 text-amber-700 capitalize hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300">
                                {course.difficulty}
                            </Badge>
                        </div>

                        <h1 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
                            {course.title}
                        </h1>

                        <div
                            className="prose prose-sm dark:prose-invert rich-html mb-5 max-w-none leading-relaxed text-muted-foreground"
                            dangerouslySetInnerHTML={{
                                __html: course.description,
                            }}
                        />

                        {/* Stats row */}
                        <div className="mb-8 flex flex-wrap gap-2">
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                                {course.modules.length} modules
                            </span>
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                {totalResources} lessons
                            </span>
                            {durationText && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                    {durationText} total
                                </span>
                            )}
                            {course.enrollments_count !== undefined && (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    {course.enrollments_count} enrolled
                                </span>
                            )}
                        </div>

                        {/* Thumbnail */}
                        {course.thumbnail && (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="mb-8 aspect-video w-full rounded-xl object-cover"
                            />
                        )}

                        {/* What you'll learn */}
                        {course.what_you_will_learn && (
                            <section className="mb-8 overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                                <div className="border-b border-indigo-200 bg-indigo-50/80 px-5 py-3 dark:border-indigo-800/60 dark:bg-indigo-950/40">
                                    <h2 className="font-semibold text-indigo-900 dark:text-indigo-100">
                                        What you will learn
                                    </h2>
                                </div>
                                <div className="bg-indigo-50/30 p-5 dark:bg-indigo-950/10">
                                    <RichHtml
                                        content={course.what_you_will_learn}
                                        className="leading-relaxed text-muted-foreground"
                                    />
                                </div>
                            </section>
                        )}

                        {/* Prerequisites */}
                        {course.prerequisites && (
                            <section className="mb-8 overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                                <div className="border-b border-indigo-200 bg-indigo-50/80 px-5 py-3 dark:border-indigo-800/60 dark:bg-indigo-950/40">
                                    <h2 className="font-semibold text-indigo-900 dark:text-indigo-100">
                                        Prerequisites
                                    </h2>
                                </div>
                                <div className="bg-indigo-50/30 p-5 dark:bg-indigo-950/10">
                                    <RichHtml
                                        content={course.prerequisites}
                                        className="leading-relaxed text-muted-foreground"
                                    />
                                </div>
                            </section>
                        )}

                        {/* Curriculum */}
                        <section className="mb-8">
                            <h2 className="mb-4 text-lg font-semibold">
                                Curriculum
                            </h2>
                            <div className="flex flex-col gap-3">
                                {course.modules.map((module) => (
                                    <div
                                        key={module.id}
                                        className="overflow-hidden rounded-xl border border-border bg-card"
                                    >
                                        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                                            <h3 className="font-semibold">
                                                {module.title}
                                            </h3>
                                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                                                {module.resources.length} lesson
                                                {module.resources.length !== 1
                                                    ? 's'
                                                    : ''}
                                            </span>
                                        </div>
                                        {module.description && (
                                            <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
                                                {module.description}
                                            </p>
                                        )}
                                        {module.resources.length > 0 && (
                                            <ul>
                                                {module.resources.map(
                                                    (resource, i) => (
                                                        <li
                                                            key={resource.id}
                                                            className={`flex items-start justify-between gap-3 px-4 py-2.5 text-sm ${i !== 0 ? 'border-t border-border' : ''}`}
                                                        >
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className="bg-sky-100 py-0 text-xs font-normal text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300">
                                                                        {RESOURCE_TYPE_LABELS[
                                                                            resource
                                                                                .type
                                                                        ] ??
                                                                            resource.type}
                                                                    </Badge>
                                                                    {resource.is_free ? (
                                                                        <Link
                                                                            href={`/${l}/courses/${course.slug}/learn/${resource.id}`}
                                                                            className="leading-snug font-medium text-blue-600 hover:text-primary hover:underline"
                                                                        >
                                                                            {
                                                                                resource.title
                                                                            }
                                                                        </Link>
                                                                    ) : (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="flex cursor-default items-center gap-1 font-medium leading-snug">
                                                                                    {resource.title} 🔒
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                Available for enrolled (full access) users
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                    {resource.is_free && (
                                                                        <Badge className="bg-emerald-100 py-0 text-xs text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                                            Free
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {resource.why_this_resource && (
                                                                    <RichHtml
                                                                        content={
                                                                            resource.why_this_resource
                                                                        }
                                                                        className="text-xs text-muted-foreground"
                                                                    />
                                                                )}
                                                            </div>
                                                            {resource.estimated_time && (
                                                                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                                    {
                                                                        resource.estimated_time
                                                                    }
                                                                    m
                                                                </span>
                                                            )}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Mentor */}
                        {course.mentor && (
                            <section className="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                                <div className="border-b border-emerald-200 bg-emerald-50/80 px-5 py-3 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                                    <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">
                                        About the mentor
                                    </h2>
                                </div>
                                <div className="bg-emerald-50/20 p-5 dark:bg-emerald-950/10">
                                    <div className="flex items-start gap-4">
                                        {course.mentor.avatar ? (
                                            <img
                                                src={course.mentor.avatar}
                                                alt={course.mentor.name}
                                                className="size-14 rounded-full object-cover ring-2 ring-emerald-200 dark:ring-emerald-800"
                                            />
                                        ) : (
                                            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                {course.mentor.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">
                                                {course.mentor.name}
                                            </p>
                                            {course.mentor.headline && (
                                                <p className="text-sm text-muted-foreground">
                                                    {course.mentor.headline}
                                                </p>
                                            )}
                                            {course.mentor.bio && (
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                                    {course.mentor.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Enrollment card — sticky sidebar on desktop */}
                    <aside className="lg:sticky lg:top-20 lg:w-80 lg:shrink-0">
                        <div className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-md">
                            <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3">
                                <p className="text-xs font-semibold tracking-widest text-primary/70 uppercase">
                                    Enroll in this course
                                </p>
                            </div>
                            <div className="p-6">
                                {/* Thumbnail preview on sidebar (desktop only, hidden if shown in main) */}
                                {course.thumbnail && (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="mb-4 hidden aspect-video w-full rounded-lg object-cover lg:block"
                                    />
                                )}

                                <div className="mb-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
                                    {course.modules.length > 0 && (
                                        <span>
                                            {course.modules.length} modules ·{' '}
                                            {totalResources} lessons
                                        </span>
                                    )}
                                    {durationText && (
                                        <span>{durationText} total</span>
                                    )}
                                    <span className="capitalize">
                                        {course.difficulty} level
                                    </span>
                                </div>

                                <EnrollmentCTA
                                    course={course}
                                    enrollment={enrollment}
                                    user={auth?.user ?? null}
                                    locale={l}
                                    onEnroll={handleEnroll}
                                />
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
            <FloatingChatButton context={chatContext} />
        </PublicLayout>
    );
}

function fmt(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function EnrollmentCTA({
    course,
    enrollment,
    user,
    locale,
    onEnroll,
}: {
    course: Course;
    enrollment: Enrollment | null;
    user: { id: number } | null;
    locale: string;
    onEnroll: () => void;
}) {
    const isPaid = course.price !== null && parseFloat(course.price) > 0;
    const price = isPaid ? parseFloat(course.price!) : 0;
    const isSubscription = course.billing_type === 'subscription';
    const priceLabel = isPaid
        ? isSubscription
            ? `${fmt(price, course.currency)}/month`
            : fmt(price, course.currency)
        : 'Free';

    if (!user) {
        return (
            <div className="flex flex-col gap-3">
                {isPaid && (
                    <div className="flex items-baseline justify-between rounded-lg bg-muted/50 px-4 py-3">
                        <span className="text-sm text-muted-foreground">{isSubscription ? 'Monthly' : 'One-time'}</span>
                        <span className="text-2xl font-bold">{priceLabel}</span>
                    </div>
                )}
                <Button variant="enroll" className="w-full" asChild>
                    <a href={`/register`}>Sign up free to start learning</a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    {isPaid ? 'Create a free account, then purchase to unlock full access.' : 'Free account — access preview lessons instantly'}
                </p>
            </div>
        );
    }

    if (!enrollment) {
        if (isPaid) {
            return (
                <div className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between rounded-lg bg-muted/50 px-4 py-3">
                        <span className="text-sm text-muted-foreground">{isSubscription ? 'Monthly' : 'One-time'}</span>
                        <span className="text-2xl font-bold">{priceLabel}</span>
                    </div>
                    <PurchaseButton course={course} locale={locale} label={`Buy Now — ${priceLabel}`} className="w-full" />
                    <p className="text-center text-xs text-muted-foreground">
                        Secure payment via PayPal · 30-day refund policy
                    </p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-3">
                <Button variant="enroll" className="w-full" onClick={onEnroll}>
                    Enroll — it's free
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    Observer access — see free lessons and course structure
                </p>
            </div>
        );
    }

    if (enrollment.access_level === 'full') {
        const firstResource = course.modules?.flatMap((m) => m.resources)[0];
        return (
            <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    You have full access to this course
                </div>
                {firstResource ? (
                    <Button variant="complete" className="w-full" asChild>
                        <Link href={learnShow.url({ locale, course: course.slug, resource: firstResource.id })}>
                            Continue learning
                        </Link>
                    </Button>
                ) : (
                    <Button variant="complete" className="w-full" disabled>
                        Continue learning
                    </Button>
                )}
            </div>
        );
    }

    // Observer on a paid course
    if (isPaid) {
        return (
            <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    <span className="font-medium">Enrolled as observer.</span> Upgrade to unlock all lessons.
                </div>
                <PurchaseButton course={course} locale={locale} label={`Upgrade — ${priceLabel}`} className="w-full" />
            </div>
        );
    }

    // Observer on a free course — promote to full via enrollment endpoint
    return (
        <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                <span className="font-medium">Enrolled as observer.</span> Get full access for free.
            </div>
            <Button variant="premium" className="w-full" onClick={onEnroll}>
                Unlock full access — Free
            </Button>
        </div>
    );
}
