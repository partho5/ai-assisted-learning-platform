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
    price: string;
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

// ─── Schema JSON-LD ──────────────────────────────────────────────────────────

function SchemaOrg({
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
}) {
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

    const courseSchemas = courses.map((c) => ({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: c.title,
        description: c.description,
        inLanguage: inLanguage(locale),
        provider: { '@type': 'Person', name: c.mentor_name ?? appName },
        offers: {
            '@type': 'Offer',
            price: c.price === 'Free' ? '0' : c.price.replace(/[^0-9.]/g, ''),
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
        },
    }));

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
            {courseSchemas.map((s, i) => (
                <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
            ))}
        </>
    );
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
        { icon: <BookOpen className="h-5 w-5" />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { icon: <RefreshCw className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        { icon: <Users className="h-5 w-5" />, color: 'bg-violet-50 text-violet-600 border-violet-100' },
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
                <SchemaOrg
                    courses={courses}
                    appUrl={appUrl}
                    appName={String(appName)}
                    locale={l}
                    description={c.meta.schemaDescription}
                />
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
            <div className="border-b border-border bg-white">
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
                            <div className="flex h-full items-center gap-3 rounded-[10px] bg-white px-4 py-3">
                                <Sparkles
                                    className="h-5 w-5 shrink-0"
                                    style={{ color: '#4285F4' }}
                                />
                                <span className="text-sm font-medium text-slate-700 md:text-lg">
                                    {c.trust[3]}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── THE BROKEN SYSTEM ────────────────────────────────────── */}
            <section aria-label="Why Jovoc" id="why" className="border-b border-border">
                <FadeIn className="mx-auto max-w-5xl px-4 py-20 md:px-6 md:py-24">
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
                                className="rounded-xl border border-border bg-card p-6"
                            >
                                <p className="mb-2 text-sm font-semibold tracking-wide text-destructive/80 uppercase">
                                    {label}
                                </p>
                                <p className="leading-relaxed text-muted-foreground">{body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
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
                className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24"
            >
                <div className="mb-14 text-center">
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
                className="border-t border-border bg-muted/30"
            >
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
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
            <section id="two-years" aria-label="Two years, not twenty" className="border-t border-border">
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
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
                        <p className="mb-8 border-l-2 border-primary pl-4 text-left text-lg font-medium text-foreground italic">
                            {c.timeline.callout}
                        </p>
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

            {/* ── PORTFOLIO ANGLE ───────────────────────────────────────── */}
            <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <div>
                        <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {c.portfolio.badge}
                        </div>
                        <h2
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            {c.portfolio.headlineTop}
                            <br />
                            {c.portfolio.headlineBottom}
                        </h2>
                        <p className="mb-6 text-muted-foreground">
                            {c.portfolio.bodyBefore}
                            <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
                                {typeof window !== 'undefined'
                                    ? window.location.host
                                    : 'yoursite.com'}
                                /{l}/u/yourname
                            </code>
                            {c.portfolio.bodyAfter}
                        </p>
                        <ul className="mb-8 space-y-3">
                            {c.portfolio.points.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-3"
                                >
                                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                    <span className="text-muted-foreground">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {canRegister && (
                            <Button asChild variant="enroll">
                                <Link href={register()}>{c.portfolio.cta}</Link>
                            </Button>
                        )}
                    </div>

                    {/* Portfolio card mock */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
                        <div className="mb-5 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                                A
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">
                                    Alex Johnson
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {c.portfolio.mockRole}
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-2">
                            {[
                                'React',
                                'Laravel',
                                'TypeScript',
                                'PostgreSQL',
                            ].map((skill) => (
                                <span
                                    key={skill}
                                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    course: 'Advanced Laravel',
                                    score: '94%',
                                    endorsed: true,
                                },
                                {
                                    course: 'React Patterns',
                                    score: '88%',
                                    endorsed: true,
                                },
                                {
                                    course: 'TypeScript Deep Dive',
                                    score: '91%',
                                    endorsed: false,
                                },
                            ].map(({ course, score, endorsed }) => (
                                <div
                                    key={course}
                                    className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3"
                                >
                                    <span className="text-sm font-medium text-foreground">
                                        {course}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {score}
                                        </span>
                                        {endorsed && (
                                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                                                {c.portfolio.mockEndorsed}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            {typeof window !== 'undefined'
                                ? window.location.host
                                : 'yoursite.com'}
                            /{l}/u/alexjohnson
                        </p>
                    </div>
                </div>
            </FadeIn>

            {/* ── FOR MENTORS ──────────────────────────────────────────── */}
            <section
                aria-label="For mentors"
                id="for-mentors"
                className="border-t border-border bg-muted/30"
            >
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
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
            <section aria-label="Pricing" id="pricing">
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
