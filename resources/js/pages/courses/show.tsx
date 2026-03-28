import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { store as enrollStore } from '@/actions/App/Http/Controllers/EnrollmentController';
import { show as learnShow } from '@/actions/App/Http/Controllers/LearnController';
import { course as courseChatAction } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import { track as referralTrack } from '@/actions/App/Http/Controllers/PartnerReferralController';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { PurchaseButton } from '@/components/payment/purchase-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import MentorCard from '@/components/mentor-card';
import RichHtml from '@/components/rich-html';
import PublicLayout from '@/layouts/public-layout';
import { trackCourseView, trackEnroll } from '@/lib/analytics';
import { captureReferral } from '@/lib/referral';
import type { Course, Enrollment } from '@/types';

interface Props {
    course: Course;
    enrollment: Enrollment | null;
    ogUrl: string;
    isPreview?: boolean;
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

export default function CourseShow({ course, enrollment, ogUrl, isPreview = false }: Props) {
    const { auth, locale, name, appUrl: serverAppUrl } = usePage().props as Record<string, any>;
    const appUrl = String(serverAppUrl ?? '');
    const l = String(locale);
    const totalResources = course.resources_count ?? course.modules.reduce((sum, m) => sum + m.resources.length, 0);
    const durationText = course.estimated_duration
        ? course.estimated_duration >= 60
            ? `${Math.round(course.estimated_duration / 60)} hours`
            : `${course.estimated_duration} min`
        : null;

    useEffect(() => { trackCourseView(course.id, course.title); }, [course.id]);

    // Detect ?ref= query parameter for partner referral tracking
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (!refCode) return;

        // Strip ?ref= from URL for clean UX
        params.delete('ref');
        const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        history.replaceState(null, '', cleanUrl);

        // Track server-side + store in localStorage
        const csrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        fetch(referralTrack.url({ locale: l }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrf ? decodeURIComponent(csrf[1]) : '',
            },
            body: JSON.stringify({ code: refCode, course_slug: course.slug, referrer_url: document.referrer || null }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.valid) {
                    captureReferral(course.slug, refCode);
                }
            })
            .catch(() => {
                // Silent fail — best-effort tracking
            });
    }, []);

    function handleEnroll() {
        trackEnroll(course.id, course.title);
        router.post(enrollStore.url({ locale: l, course: course.slug }));
    }

    const chatContext = {
        type: 'course' as const,
        key: `course-${course.id}`,
        label: course.title,
        endpoint: courseChatAction.url({ locale: l, course: course.slug }),
        historyEndpoint: chatHistory.url(l),
        locale: l,
        autoTrigger: !!enrollment,
    };

    const ogDescription = course.subtitle
        ? course.subtitle.trim().slice(0, 160)
        : course.description
          ? course.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
          : '';
    const ogImage = course.thumbnail ?? '/logo.png';

    return (
        <PublicLayout hidePlatformChat>
            {isPreview && (
                <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 dark:bg-amber-500 dark:text-amber-950">
                    <span>👁 Preview mode — this course is not published yet</span>
                </div>
            )}
            <Head title={course.title}>
                <meta name="description" content={ogDescription} />
                <link rel="canonical" href={ogUrl} />
                <meta property="og:site_name" content={String(name)} />
                <meta property="og:title" content={`${course.title} | ${String(name)}`} />
                <meta property="og:description" content={ogDescription} />
                <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={course.title} />
                <meta property="og:url" content={ogUrl} />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="en_US" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${course.title} | ${String(name)}`} />
                <meta name="twitter:description" content={ogDescription} />
                <meta name="twitter:image" content={ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`} />
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Course',
                    name: course.title,
                    description: ogDescription,
                    url: ogUrl,
                    image: ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`,
                    provider: {
                        '@type': 'Organization',
                        name: String(name),
                        url: appUrl,
                    },
                    ...((course.authors && course.authors.length > 0) || course.mentor ? {
                        hasCourseInstance: {
                            '@type': 'CourseInstance',
                            courseMode: 'online',
                            instructor: course.authors && course.authors.length > 0
                                ? course.authors.map((a) => ({ '@type': 'Person', name: a.name }))
                                : { '@type': 'Person', name: course.mentor!.name },
                        },
                    } : {}),
                    ...(course.price != null && {
                        offers: {
                            '@type': 'Offer',
                            price: parseFloat(String(course.price)) > 0 ? String(course.price) : '0',
                            priceCurrency: course.currency ?? 'USD',
                            availability: 'https://schema.org/InStock',
                        },
                    }),
                })}</script>
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Courses', item: `${appUrl}/${l}/courses` },
                        { '@type': 'ListItem', position: 2, name: course.title, item: ogUrl },
                    ],
                })}</script>
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    {/* Main content */}
                    <article className="min-w-0 flex-1">
                        {/* Breadcrumb */}
                        <nav aria-label="Breadcrumb" className="mb-4">
                            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                                <li>
                                    <Link href={`/${l}/courses`} className="transition-colors hover:text-foreground">
                                        Courses
                                    </Link>
                                </li>
                                <li aria-hidden="true">/</li>
                                <li className="truncate text-foreground" aria-current="page">
                                    {course.title}
                                </li>
                            </ol>
                        </nav>

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

                        <h1 className="mb-2 text-2xl font-bold tracking-tight md:text-3xl">
                            {course.title}
                        </h1>

                        {course.subtitle && (
                            <p className="mb-4 text-lg font-medium text-blue-500 dark:text-indigo-400">
                                {course.subtitle}
                            </p>
                        )}

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
                            {course.updated_at && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
                                    Updated {new Date(course.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>

                        {/* Thumbnail */}
                        {course.thumbnail && (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                width={1280}
                                height={720}
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
                                        You need to know before this course
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
                                {course.modules.map((module, moduleIndex) => (
                                    <div
                                        key={module.id}
                                        className="overflow-hidden rounded-xl border border-border bg-card"
                                    >
                                        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                                            <h3 className="font-semibold">
                                                Module {moduleIndex + 1} — {module.title}
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
                                                            className={`flex items-start justify-between gap-3 px-4 py-2.5 text-lg ${i !== 0 ? 'border-t border-border' : ''}`}
                                                        >
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className="hidden bg-sky-100 py-0 text-xs font-normal text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300">
                                                                        {RESOURCE_TYPE_LABELS[
                                                                            resource
                                                                                .type
                                                                        ] ??
                                                                            resource.type}
                                                                    </Badge>
                                                                    {resource.is_free ||
                                                                    enrollment?.access_level ===
                                                                        'full' ? (
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
                                                                            <TooltipTrigger
                                                                                asChild
                                                                            >
                                                                                <span className="flex cursor-default items-center gap-1 leading-snug font-medium">
                                                                                    {
                                                                                        resource.title
                                                                                    }{' '}
                                                                                    🔒
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                Available
                                                                                for
                                                                                enrolled
                                                                                (full
                                                                                access)
                                                                                users
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

                        {/* Mentor(s) */}
                        {course.authors && course.authors.length > 0 ? (
                            <section className="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                                <div className="border-b border-emerald-200 bg-emerald-50/80 px-5 py-3 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                                    <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">
                                        About the mentor{course.authors.length > 1 ? 's' : ''}
                                    </h2>
                                </div>
                                <div className="divide-y divide-emerald-200 bg-emerald-50/20 dark:divide-emerald-800/60 dark:bg-emerald-950/10">
                                    {course.authors.map((author) => (
                                        <MentorCard key={author.id} mentor={author} locale={l} standalone={false} />
                                    ))}
                                </div>
                            </section>
                        ) : course.mentor ? (
                            <MentorCard mentor={course.mentor} locale={l} />
                        ) : null}
                    </article>

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
                                        width={320}
                                        height={180}
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
                                    isPreview={isPreview}
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
    isPreview = false,
}: {
    course: Course;
    enrollment: Enrollment | null;
    user: { id: number } | null;
    locale: string;
    onEnroll: () => void;
    isPreview?: boolean;
}) {
    if (isPreview) {
        const firstResource = course.modules?.flatMap((m) => m.resources)[0];
        return (
            <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <span className="font-medium">Preview mode.</span> Learners will see enrollment options here.
                </div>
                {firstResource && (
                    <Button variant="secondary" className="w-full" asChild>
                        <Link href={`/${locale}/courses/${course.slug}/learn/${firstResource.id}?preview=1`}>
                            Preview learning experience →
                        </Link>
                    </Button>
                )}
            </div>
        );
    }
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
