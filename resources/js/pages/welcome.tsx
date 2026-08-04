import { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, CheckCircle, ChevronRight, RefreshCw, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RotatingText } from '@/components/rotating-text';
import PublicLayout from '@/layouts/public-layout';
import { trackLandingCta } from '@/lib/analytics';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/CourseController';
import { register } from '@/routes';
import { inLanguage, ogLocale } from '@/lib/locale';
import { landingCopy } from '@/lib/landing-copy';
import { courseSchema } from '@/lib/schema';
import { BRAND_EXPANSION, BRAND_FULL, BRAND_NAME } from '@/lib/brand';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedCourse {
    id: number;
    title: string;
    subtitle: string | null;
    slug: string;
    description: string;
    thumbnail: string | null;
    difficulty: string | null;
    resources_count: number;
    /** Display string ("Free", "$10.00/month") — use the raw fields below for JSON-LD. */
    price: string;
    raw_price: string | null;
    currency: string | null;
    billing_type: string | null;
    subscription_duration_months: number | null;
    estimated_duration: number | null;
    mentor_name: string | null;
    mentor_username: string | null;
}

interface Props {
    canRegister: boolean;
    featuredCourses: FeaturedCourse[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── useInView hook ───────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
    const ref = useRef<HTMLElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    obs.disconnect();
                }
            },
            { threshold },
        );

        obs.observe(el);

        return () => obs.disconnect();
    }, [threshold]);

    return { ref, inView };
}

function FadeIn({ children, className = '', delay = 0, id }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
    const { ref, inView } = useInView();

    return (
        <section
            id={id}
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out ${inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
        >
            {children}
        </section>
    );
}

// ─── Small vector face avatars ───────────────────────────────────────────────
// Flat, brand-toned illustrations used to give a couple of quote-like moments
// a human face instead of a decorative border.

function FaceAvatar({ variant, className = '' }: { variant: 'skeptical' | 'confident'; className?: string }) {
    const isSkeptical = variant === 'skeptical';

    return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden>
            <path
                d="M4 56c0-11 10.7-18 24-18s24 7 24 18"
                className={isSkeptical ? 'fill-slate-200 dark:fill-slate-800' : 'fill-indigo-200 dark:fill-indigo-900/50'}
            />
            <circle
                cx="28"
                cy="24"
                r="17"
                className={isSkeptical ? 'fill-slate-100 dark:fill-slate-800/70' : 'fill-indigo-100 dark:fill-indigo-950/60'}
            />
            <path
                d="M11 22c0-10 8-16 17-16s17 6 17 16c-2-3-7-5-11-4-3-8-13-8-16-1-3 0-6 2-7 5z"
                className={isSkeptical ? 'fill-slate-300 dark:fill-slate-600' : 'fill-indigo-300 dark:fill-indigo-700'}
            />
            {isSkeptical ? (
                <>
                    <path d="M17 20.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-slate-500 dark:text-slate-400" />
                    <path d="M33 17.5c2-1.4 4.4-1.4 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" className="text-slate-500 dark:text-slate-400" />
                    <circle cx="20" cy="24.5" r="1.6" className="fill-slate-600 dark:fill-slate-300" />
                    <path d="M35 24.2c1.6-.8 3.4-.8 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" className="text-slate-600 dark:text-slate-300" />
                    <path d="M22 32c2 1.4 8 1.8 11-.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" className="text-slate-500 dark:text-slate-400" />
                </>
            ) : (
                <>
                    <path d="M17 20.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-indigo-500 dark:text-indigo-300" />
                    <path d="M33 20.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-indigo-500 dark:text-indigo-300" />
                    <circle cx="20" cy="25" r="1.7" className="fill-indigo-600 dark:fill-indigo-300" />
                    <circle cx="36" cy="25" r="1.7" className="fill-indigo-600 dark:fill-indigo-300" />
                    <path d="M21 31.5c3 2.6 11 2.6 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" className="text-indigo-500 dark:text-indigo-300" />
                </>
            )}
        </svg>
    );
}

function FaceAvatarBadge({ variant, className = '' }: { variant: 'skeptical' | 'confident'; className?: string }) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-border dark:bg-card ${className}`}
        >
            <FaceAvatar variant={variant} className="h-full w-full" />
        </div>
    );
}

// ─── Schema JSON-LD ──────────────────────────────────────────────────────────

/**
 * Returns the landing page's JSON-LD documents as plain objects.
 *
 * Deliberately not a component. Inertia's `<Head>` does not render React —
 * it stringifies each child's `type` straight into a tag name, so a custom
 * component inside `<Head>` emits its own source code into the document.
 * `<Head>` may only ever contain plain elements.
 */
function landingSchemas({
    courses,
    appUrl,
    appName,
    locale,
    description,
}: {
    courses: FeaturedCourse[];
    appUrl: string;
    appName: string;
    locale: string;
    description: string;
}): Record<string, unknown>[] {
    const org = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: BRAND_NAME,
        alternateName: BRAND_EXPANSION,
        url: appUrl,
        logo: `${appUrl}/logo.png`,
        description,
    };

    const website = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: BRAND_NAME,
        alternateName: BRAND_EXPANSION,
        url: appUrl,
        inLanguage: inLanguage(locale),
        potentialAction: {
            '@type': 'SearchAction',
            target: `${appUrl}/${locale}/courses?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    const courseSchemas = courses.map((c) =>
        courseSchema({
            title: c.title,
            description: c.description,
            url: `${appUrl}/${locale}/courses/${c.slug}`,
            locale,
            image: c.thumbnail ?? `${appUrl}/logo.png`,
            appName,
            appUrl,
            price: c.raw_price,
            currency: c.currency,
            billingType: c.billing_type,
            subscriptionDurationMonths: c.subscription_duration_months,
            estimatedDuration: c.estimated_duration,
            difficulty: c.difficulty,
            instructorNames: c.mentor_name ? [c.mentor_name] : [],
        }),
    );

    return [org, website, ...courseSchemas];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CourseCard({
    course,
    locale,
    byLabel,
    resourcesLabel,
}: {
    course: FeaturedCourse;
    locale: string;
    byLabel: string;
    resourcesLabel: string;
}) {
    return (
        <Link
            href={`/${locale}/courses/${course.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md"
        >
            {course.thumbnail ? (
                <img
                    src={course.thumbnail}
                    alt={course.title}
                    width={600}
                    height={340}
                    loading="lazy"
                    className="aspect-video w-full rounded-t-xl object-contain bg-muted"
                />
            ) : (
                <div className="aspect-video w-full flex items-center justify-center rounded-t-xl bg-muted">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
            )}

            <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center gap-2">
                    {course.difficulty && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                            {course.difficulty}
                        </span>
                    )}
                    <span className="ml-auto text-sm font-semibold text-foreground">{course.price}</span>
                </div>

                <h3 className="mb-1 font-semibold leading-snug text-foreground group-hover:text-primary">{course.title}</h3>

                {course.subtitle && (
                    <p className="mb-2 text-sm font-medium text-blue-500 dark:text-indigo-400">{course.subtitle}</p>
                )}

                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{stripHtml(course.description ?? '')}</p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {course.mentor_name && (
                        <span>
                            {byLabel} {course.mentor_name}
                        </span>
                    )}
                    {course.resources_count > 0 && (
                        <>
                            <span>·</span>
                            <span>
                                {course.resources_count}
                                {resourcesLabel}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}

function CourseSkeleton() {
    return (
        <div className="flex flex-col rounded-xl border border-border bg-card p-6">
            <div className="mb-4 h-40 w-full animate-pulse rounded-lg bg-muted" />
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Welcome({ canRegister, featuredCourses }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);
    const { name: appName, appUrl: serverAppUrl } = usePage().props as Record<string, any>;
    const appUrl = String(serverAppUrl ?? '');

    const courses = featuredCourses ?? [];
    const c = landingCopy(l);

    const trustIcons = [
        { icon: <BookOpen className="h-5 w-5" />, color: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900' },
        { icon: <RefreshCw className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900' },
        { icon: <Users className="h-5 w-5" />, color: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900' },
    ];

    return (
        <PublicLayout isLandingPage hidePlatformChat={false}>
            <Head title={`${BRAND_FULL} | ${c.meta.titleSuffix}`}>
                <meta name="description" content={c.meta.description} />
                <meta name="keywords" content={c.meta.keywords} />
                <link rel="canonical" href={`${appUrl}/${l}/`} />
                <meta property="og:site_name" content={BRAND_NAME} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${BRAND_FULL} | ${c.meta.ogTitleSuffix}`} />
                <meta property="og:description" content={c.meta.ogDescription} />
                <meta property="og:url" content={`${appUrl}/${l}/`} />
                <meta property="og:image" content={`${appUrl}/og-image.png`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={`${BRAND_FULL} | ${c.meta.ogTitleSuffix}`} />
                <meta property="og:locale" content={ogLocale(l)} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${BRAND_FULL} | ${c.meta.ogTitleSuffix}`} />
                <meta name="twitter:description" content={c.meta.twitterDescription} />
                <meta name="twitter:image" content={`${appUrl}/og-image.png`} />
                {landingSchemas({
                    courses,
                    appUrl,
                    appName: String(appName),
                    locale: l,
                    description: c.meta.schemaDescription,
                }).map((schema, i) => (
                    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
                ))}
            </Head>

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <style>{`
                @keyframes blobFloat1 {
                    0%,100% { transform: translateX(-50%) translateY(0px)   scale(1);    background-color: rgba(125,211,252,0.40); }
                    35%     { transform: translateX(-50%) translateY(-32px)  scale(1.06); background-color: rgba(253,186,116,0.38); }
                    70%     { transform: translateX(-50%) translateY(18px)   scale(0.96); background-color: rgba(251,113,133,0.30); }
                }
                @keyframes blobFloat2 {
                    0%,100% { transform: translate(0px,   0px)   scale(1);   background-color: rgba(103,232,249,0.30); }
                    50%     { transform: translate(-44px,-28px)  scale(1.10); background-color: rgba(253,164,175,0.38); }
                }
                @keyframes blobFloat3 {
                    0%,100% { transform: translate(0px,  0px)   scale(1);    background-color: rgba(94,234,212,0.25); }
                    40%     { transform: translate(32px,-22px)   scale(1.06); background-color: rgba(252,211,77, 0.32); }
                    80%     { transform: translate(-20px,16px)   scale(0.94); background-color: rgba(253,186,116,0.28); }
                }
                @keyframes gradientFlow {
                    0%, 100% { background-position: 0% 50%; }
                    50%       { background-position: 100% 50%; }
                }
                @keyframes badgePulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.5; transform: scale(0.75); }
                }
                @media (min-width: 768px) {
                    .hero-blob1        { animation: blobFloat1 20s ease-in-out infinite; }
                    .hero-blob2        { animation: blobFloat2 25s ease-in-out infinite; }
                    .hero-blob3        { animation: blobFloat3 17s ease-in-out infinite; }
                    .hero-gradient-text{ animation: gradientFlow 6s ease-in-out infinite; }
                    .hero-badge-dot    { animation: badgePulse 2s ease-in-out infinite; }
                }
            `}</style>
            <section
                aria-label="Hero"
                className="relative overflow-hidden border-b border-border bg-[#e8f4fd] dark:bg-background"
            >
                {/* subtle grid */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:48px_48px]"
                />
                {/* ocean glow blobs — animated */}
                <div
                    aria-hidden
                    className="hero-blob1 pointer-events-none absolute -top-24 left-1/2 h-[440px] w-[640px] rounded-full blur-[110px]"
                />
                <div
                    aria-hidden
                    className="hero-blob2 pointer-events-none absolute right-10 bottom-0 h-72 w-72 rounded-full blur-[90px]"
                />
                <div
                    aria-hidden
                    className="hero-blob3 pointer-events-none absolute top-1/3 left-0 h-56 w-56 rounded-full blur-[80px]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />

                <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28 lg:py-36">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-black px-4 py-1.5 text-sky-400 shadow-sm backdrop-blur-sm">
                            <span className="hero-badge-dot h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                            {c.hero.badge}
                        </div>

                        {/* Each sentence owns its own line: the two halves are a
                            problem/promise pair and must never wrap into each other. */}
                        <h1
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-5 text-4xl leading-[1.15] font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl dark:text-gray-200"
                        >
                            <span className="block">{c.hero.titleStatic}</span>
                            <span
                                className="hero-gradient-text mt-1 block bg-clip-text text-transparent"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(90deg, #0f172a, #2563eb, #0ea5e9, #6366f1, #0f172a)',
                                    backgroundSize: '300% auto',
                                }}
                            >
                                {c.hero.titleGradient}
                            </span>
                        </h1>

                        <p className="mx-auto mb-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
                            {c.hero.subtitle}
                        </p>

                        {/* The brand is an acronym; spell it out once, prominently. */}
                        <p className="mb-9 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{BRAND_NAME}</span>
                            {' — '}
                            {BRAND_EXPANSION}
                        </p>

                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="group bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md hover:from-black hover:to-blue-700"
                            >
                                <Link href={coursesIndex.url(l)} onClick={() => trackLandingCta('hero_browse_courses')}>
                                    {c.hero.cta}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>

                        <p className="mt-4 text-xs text-slate-400">{c.hero.note}</p>
                    </div>
                </div>
            </section>

            {/* ── TRUST BAR ────────────────────────────────────────────── */}
            <div className="border-b border-border bg-sky-50/60 dark:bg-sky-950/10">
                <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {trustIcons.map(({ icon, color }, i) => (
                            <div
                                key={c.trust[i]}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm md:text-lg ${color}`}
                            >
                                <span className="shrink-0">{icon}</span>
                                <span>{c.trust[i]}</span>
                            </div>
                        ))}
                        {/* AI card — Google-style rainbow gradient border */}
                        <div
                            className="rounded-xl p-[2px]"
                            style={{
                                background:
                                    'linear-gradient(135deg, #4285F4, #EA4335, #FBBC04, #34A853)',
                            }}
                        >
                            <div className="flex h-full items-center gap-3 rounded-[10px] bg-white px-4 py-3 dark:bg-gray-950">
                                <Sparkles
                                    className="h-5 w-5 shrink-0"
                                    style={{ color: '#4285F4' }}
                                />
                                <span className="text-sm font-medium text-slate-700 md:text-lg dark:text-slate-200">
                                    {c.trust[3]}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── THE BROKEN SYSTEM ────────────────────────────────────── */}
            <section aria-label="Why Jovoc" id="why" className="relative overflow-hidden border-b border-border bg-slate-50 dark:bg-slate-900/20">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-16 -right-24 h-72 w-72 rounded-full bg-rose-200/30 blur-[100px] dark:bg-rose-900/20"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/30 blur-[100px] dark:bg-sky-900/15"
                />
                <FadeIn className="relative mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {c.problem.badge}
                        </div>
                        <h2
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            {c.problem.headline}
                        </h2>
                        <p className="text-muted-foreground">{c.problem.lead}</p>
                    </div>

                    <div className="mt-12 grid gap-4 sm:grid-cols-2">
                        {c.problem.points.map(({ label, body }) => (
                            <div
                                key={label}
                                className="rounded-xl border border-border bg-card p-6 shadow-sm"
                            >
                                <p className="mb-2 text-sm font-semibold tracking-wide text-destructive/80 uppercase">
                                    {label}
                                </p>
                                <p className="leading-relaxed text-muted-foreground">{body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
                        <FaceAvatarBadge variant="confident" className="mx-auto mb-4 h-14 w-14 ring-primary/30 md:h-16 md:w-16" />
                        <p
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            className="mb-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
                        >
                            {c.problem.punchline}
                        </p>
                        <p className="mx-auto max-w-2xl text-muted-foreground">{c.problem.punchlineSub}</p>
                    </div>
                </FadeIn>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
            <FadeIn
                id="how-it-works"
                className="relative mx-auto max-w-7xl overflow-hidden px-4 py-20 md:px-6 md:py-24"
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-10 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-200/20 blur-[120px] dark:bg-sky-900/10"
                />
                <div className="relative mb-14 text-center">
                    <h2
                        style={{
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}
                        className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                    >
                        {c.how.headline}
                    </h2>
                    <p className="text-muted-foreground">{c.how.subtitle}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {c.how.steps.map(({ step, titleBefore, rotatingWords, titleAfter, body }, i) => {
                        const theme = [
                            {
                                gradient: 'from-sky-500 to-cyan-400',
                                bg: 'bg-sky-50 dark:bg-sky-950/30',
                                border: 'border-sky-100 dark:border-sky-900',
                            },
                            {
                                gradient: 'from-indigo-500 to-violet-500',
                                bg: 'bg-indigo-50 dark:bg-indigo-950/30',
                                border: 'border-indigo-100 dark:border-indigo-900',
                            },
                            {
                                gradient: 'from-violet-500 to-fuchsia-500',
                                bg: 'bg-violet-50 dark:bg-violet-950/30',
                                border: 'border-violet-100 dark:border-violet-900',
                            },
                        ][i];

                        return (
                            <div
                                key={step}
                                className={`relative flex flex-col gap-4 rounded-2xl border p-8 ${theme.bg} ${theme.border}`}
                            >
                                <span
                                    style={{
                                        fontFamily:
                                            "'Bricolage Grotesque', sans-serif",
                                    }}
                                    className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-6xl leading-none font-black text-transparent`}
                                >
                                    {step}
                                </span>
                                <h3 className="text-xl font-semibold text-foreground">
                                    {titleBefore}
                                    <RotatingText
                                        words={rotatingWords}
                                        initialDelay={i * 900}
                                        className="text-primary"
                                    />
                                    {titleAfter}
                                </h3>
                                <p className="text-muted-foreground">{body}</p>
                            </div>
                        );
                    })}
                </div>
            </FadeIn>

            {/* ── FEATURED COURSES ─────────────────────────────────────── */}
            <section
                aria-label="Courses"
                className="relative overflow-hidden border-t border-border bg-indigo-50/50 dark:bg-indigo-950/10"
            >
                <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-60 dark:opacity-20">
                    <defs>
                        <pattern id="dot-grid-courses" width="28" height="28" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                        </pattern>
                        <radialGradient id="dot-fade-courses" cx="50%" cy="0%" r="75%">
                            <stop offset="0%" stopColor="white" stopOpacity="1" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                        <mask id="dot-mask-courses">
                            <rect width="100%" height="100%" fill="url(#dot-fade-courses)" />
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="url(#dot-grid-courses)"
                        mask="url(#dot-mask-courses)"
                        className="text-indigo-300 dark:text-indigo-700"
                    />
                </svg>
                <FadeIn className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mb-10 flex items-end justify-between">
                        <div>
                            <h2
                                style={{
                                    fontFamily:
                                        "'Bricolage Grotesque', sans-serif",
                                }}
                                className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                            >
                                {c.recentCourses}
                            </h2>
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            size="compact"
                            className="hidden md:flex"
                        >
                            <Link href={coursesIndex.url(l)}>
                                {c.viewAll} <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.length > 0
                            ? courses.map((course) => (
                                  <CourseCard
                                      key={course.id}
                                      course={course}
                                      locale={l}
                                      byLabel={c.by}
                                      resourcesLabel={c.resourcesCount}
                                  />
                              ))
                            : Array.from({ length: 3 }).map((_, i) => (
                                  <CourseSkeleton key={i} />
                              ))}
                    </div>

                    <div className="mt-8 text-center md:hidden">
                        <Button asChild variant="ghost">
                            <Link href={coursesIndex.url(l)}>
                                {c.viewAllLong} <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </FadeIn>
            </section>

            {/* ── 2 YEARS, NOT 20 ──────────────────────────────────────── */}
            <section id="two-years" aria-label="Two years, not twenty" className="relative overflow-hidden border-t border-border bg-violet-50/50 dark:bg-violet-950/10">
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-0 right-1/4 h-80 w-80 -translate-y-1/2 rounded-full bg-violet-300/25 blur-[110px] dark:bg-violet-800/20"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 translate-y-1/2 rounded-full bg-indigo-300/20 blur-[100px] dark:bg-indigo-800/15"
                />
                <FadeIn className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {c.timeline.badge}
                        </div>
                        <h2
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            {c.timeline.headline}
                        </h2>
                        <p className="mb-6 text-muted-foreground">{c.timeline.body}</p>
                        <div className="mb-8 flex items-start gap-4 text-left">
                            <FaceAvatarBadge variant="skeptical" className="h-14 w-14 md:h-16 md:w-16" />
                            <p className="pt-1 text-lg font-medium text-foreground italic">
                                {c.timeline.callout}
                            </p>
                        </div>
                        <Button asChild variant="enroll">
                            <Link href={coursesIndex.url(l)} onClick={() => trackLandingCta('two_years_curriculum')}>
                                {c.timeline.cta}
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-3">
                        {c.timeline.cards.map(({ title, body }) => (
                            <div
                                key={title}
                                className="rounded-xl border border-border bg-card p-5"
                            >
                                <h3 className="mb-2 font-semibold text-foreground">
                                    {title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </FadeIn>
            </section>

            {/* ── FOR MENTORS ──────────────────────────────────────────── */}
            <section
                aria-label="For mentors"
                id="for-mentors"
                className="relative overflow-hidden border-t border-border bg-sky-50/60 dark:bg-sky-950/10"
            >
                <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-60 dark:opacity-20">
                    <defs>
                        <pattern id="dot-grid-mentors" width="28" height="28" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                        </pattern>
                        <radialGradient id="dot-fade-mentors" cx="50%" cy="100%" r="75%">
                            <stop offset="0%" stopColor="white" stopOpacity="1" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                        <mask id="dot-mask-mentors">
                            <rect width="100%" height="100%" fill="url(#dot-fade-mentors)" />
                        </mask>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="url(#dot-grid-mentors)"
                        mask="url(#dot-mask-mentors)"
                        className="text-sky-300 dark:text-sky-700"
                    />
                </svg>
                <FadeIn className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {c.mentors.badge}
                        </div>
                        <h2
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            {c.mentors.headlineTop}
                            <br />
                            {c.mentors.headlineBottom}
                        </h2>
                        <p className="mb-8 text-muted-foreground">{c.mentors.body}</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {canRegister && (
                                <Button asChild variant="enroll">
                                    <Link
                                        href={
                                            register().url + '?join_as=mentor'
                                        }
                                    >
                                        {c.mentors.ctaTeach}
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="ghost">
                                <Link href={`/${l}/about-us`}>
                                    {c.mentors.ctaPhilosophy}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {c.mentors.cards.map(({ title, body }) => (
                            <div
                                key={title}
                                className="rounded-xl border border-border bg-card p-5"
                            >
                                <h3 className="mb-2 font-semibold text-foreground">
                                    {title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </FadeIn>
            </section>

            {/* ── PRICING ──────────────────────────────────────────────── */}
            <section aria-label="Pricing" id="pricing" className="border-t border-border">
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mb-12 text-center">
                        <h2
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            {c.pricing.headline}
                        </h2>
                        <p className="text-muted-foreground">{c.pricing.subtitle}</p>
                    </div>

                    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
                        {/* Free */}
                        <div className="flex flex-col rounded-2xl border border-border bg-card p-8">
                            <p className="mb-1 text-sm font-medium text-muted-foreground">
                                {c.pricing.freeLabel}
                            </p>
                            <p
                                style={{
                                    fontFamily:
                                        "'Bricolage Grotesque', sans-serif",
                                }}
                                className="mb-6 text-4xl font-bold text-foreground"
                            >
                                $0
                            </p>
                            <ul className="mb-8 flex-1 space-y-3">
                                {c.pricing.freePoints.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-3 text-sm text-muted-foreground"
                                    >
                                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            {canRegister && (
                                <Button
                                    asChild
                                    variant="secondary"
                                    className="w-full"
                                >
                                    <Link href={register()} onClick={() => trackLandingCta('pricing_get_started')}>
                                        {c.pricing.freeCta}
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Per course */}
                        <div className="flex flex-col rounded-2xl border border-primary/50 bg-card p-8 shadow-sm ring-1 ring-primary/20">
                            <p className="mb-1 text-sm font-medium text-primary">
                                {c.pricing.paidLabel}
                            </p>
                            <p
                                style={{
                                    fontFamily:
                                        "'Bricolage Grotesque', sans-serif",
                                }}
                                className="mb-1 text-4xl font-bold text-foreground"
                            >
                                {c.pricing.paidPrice}
                            </p>
                            <p className="mb-6 text-sm text-muted-foreground">
                                {c.pricing.paidNote}
                            </p>
                            <ul className="mb-8 flex-1 space-y-3">
                                {c.pricing.paidPoints.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-3 text-sm text-muted-foreground"
                                    >
                                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Button asChild variant="enroll" className="w-full">
                                <Link href={coursesIndex.url(l)} onClick={() => trackLandingCta('pricing_browse_courses')}>
                                    {c.pricing.paidCta}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* ── FINAL CTA ─────────────────────────────────────────────── */}
            <section
                aria-label="Get started"
                className="border-t border-border bg-primary/5"
            >
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 text-center md:px-6 md:py-24">
                    <h2
                        style={{
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                        }}
                        className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                    >
                        {c.final.headlineBefore}
                        <RotatingText
                            words={c.final.rotatingWords}
                            className="text-primary"
                        />
                        {c.final.headlineAfter}
                    </h2>
                    <p className="mb-8 text-muted-foreground">{c.final.body}</p>
                    {canRegister && (
                        <Button asChild variant="enroll" size="lg">
                            <Link href={register()} onClick={() => trackLandingCta('final_sign_up')}>
                                {c.final.cta} <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                        {c.final.note}
                    </p>
                </FadeIn>
            </section>

        </PublicLayout>
    );
}
