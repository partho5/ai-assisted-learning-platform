import { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, CheckCircle, ChevronRight, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/CourseController';
import { register } from '@/routes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeaturedCourse {
    id: number;
    title: string;
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

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    const { ref, inView } = useInView();

    return (
        <section
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out ${inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
        >
            {children}
        </section>
    );
}

// ─── Schema JSON-LD ──────────────────────────────────────────────────────────

function SchemaOrg({ courses, appUrl, appName }: { courses: FeaturedCourse[]; appUrl: string; appName: string }) {
    const org = {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: appName,
        url: appUrl,
        logo: `${appUrl}/logo.png`,
        description: 'Mentor-led online courses with verified skill portfolios. Learn, prove, and showcase your skills.',
    };

    const website = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: appName,
        url: appUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${appUrl}/en/courses?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    const courseSchemas = courses.map((c) => ({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: c.title,
        description: c.description,
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

function CourseCard({ course, locale }: { course: FeaturedCourse; locale: string }) {
    return (
        <Link
            href={`/${locale}/courses/${course.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
        >
            {course.thumbnail ? (
                <img
                    src={course.thumbnail}
                    alt={course.title}
                    width={600}
                    height={340}
                    loading="lazy"
                    className="mb-4 h-40 w-full rounded-lg object-cover"
                />
            ) : (
                <div className="mb-4 flex h-40 w-full items-center justify-center rounded-lg bg-muted">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
            )}

            <div className="flex flex-1 flex-col">
                <div className="mb-2 flex items-center gap-2">
                    {course.difficulty && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                            {course.difficulty}
                        </span>
                    )}
                    <span className="ml-auto text-sm font-semibold text-foreground">{course.price}</span>
                </div>

                <h3 className="mb-2 font-semibold leading-snug text-foreground group-hover:text-primary">{course.title}</h3>

                <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{stripHtml(course.description ?? '')}</p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {course.mentor_name && <span>by {course.mentor_name}</span>}
                    {course.resources_count > 0 && (
                        <>
                            <span>·</span>
                            <span>{course.resources_count} resources</span>
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
    const appName = import.meta.env.VITE_APP_NAME ?? 'SkillEvidence';
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const courses = featuredCourses ?? [];

    return (
        <PublicLayout isLandingPage hidePlatformChat={false}>
            <Head title={`${appName} — Learn, Prove, Get Hired`}>
                <meta
                    name="description"
                    content="Take mentor-led courses, complete real tests and assignments, and build a verified skill portfolio employers actually trust. Free to start."
                />
                <meta name="keywords" content="skill evidence, online courses, verified learning, skill portfolio, mentor courses, learn online" />
                <link rel="canonical" href={`${appUrl}/${l}/`} />
                <link rel="alternate" hrefLang="en" href={`${appUrl}/en/`} />
                <link rel="alternate" hrefLang="bn" href={`${appUrl}/bn/`} />
                <link rel="alternate" hrefLang="x-default" href={`${appUrl}/en/`} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${appName} — Learn, Prove, Get Hired`} />
                <meta
                    property="og:description"
                    content="Take mentor-led courses, complete real tests and assignments, and build a verified skill portfolio employers actually trust."
                />
                <meta property="og:url" content={`${appUrl}/${l}/`} />
                <meta property="og:image" content={`${appUrl}/og-image.png`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:locale" content="en_US" />
                <meta property="og:locale:alternate" content="bn_BD" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${appName} — Learn, Prove, Get Hired`} />
                <meta name="twitter:description" content="Build a verified skill portfolio with real mentor-reviewed work." />
                <meta name="twitter:image" content={`${appUrl}/og-image.png`} />
                <SchemaOrg courses={courses} appUrl={appUrl} appName={appName} />
            </Head>

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <section aria-label="Hero" className="relative overflow-hidden border-b border-border">
                {/* subtle grid bg */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 dark:opacity-20"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

                <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28 lg:py-36">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Mentor-verified skill evidence
                        </div>

                        <h1
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            className="mb-3 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
                        >
                            Learn. Prove.{' '}
                            <span className="text-primary">Get Hired.</span>
                        </h1>

                        <p
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                                background: 'linear-gradient(to right, #10ffb5, #6366f1, #f97316)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                            className="mb-6 text-xl font-semibold md:text-2xl"
                        >
                            Or build your own business as a 2nd income source.
                        </p>

                        <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
                            Stop listing skills on a resume. Build a portfolio of real, mentor-reviewed work that employers can actually verify.
                        </p>

                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            {canRegister && (
                                <Button asChild variant="enroll" size="lg">
                                    <Link href={register()}>
                                        Start for free
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="ghost" size="lg">
                                <Link href={coursesIndex.url(l)}>Browse courses</Link>
                            </Button>
                        </div>

                        <p className="mt-4 text-xs text-muted-foreground">No credit card required</p>
                    </div>
                </div>
            </section>

            {/* ── TRUST BAR ────────────────────────────────────────────── */}
            <div className="border-b border-border bg-muted/40">
                <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground">
                        {[
                            { icon: <BookOpen className="h-4 w-4" />, label: 'Structured courses' },
                            { icon: <CheckCircle className="h-4 w-4" />, label: 'Mentor-endorsed work' },
                            { icon: <Users className="h-4 w-4" />, label: 'Public skill portfolio' },
                            { icon: <Clock className="h-4 w-4" />, label: 'AI-assisted learning' },
                        ].map(({ icon, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-primary">{icon}</span>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
            <FadeIn id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                <div className="mb-14 text-center">
                    <h2
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                    >
                        How it works
                    </h2>
                    <p className="text-muted-foreground">Three steps from enrolled to evidenced.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {[
                        {
                            step: '01',
                            title: 'Pick a course',
                            body: 'Mentors build structured courses with videos, articles, and assignments. Browse the catalog and enroll in minutes.',
                        },
                        {
                            step: '02',
                            title: 'Do the work',
                            body: 'Complete resources, take knowledge tests, and submit assignments. An AI assistant helps you along the way.',
                        },
                        {
                            step: '03',
                            title: 'Earn your evidence',
                            body: 'Mentors review and endorse your submissions. Every endorsement is permanently recorded on your public portfolio.',
                        },
                    ].map(({ step, title, body }) => (
                        <div key={step} className="relative flex flex-col gap-4">
                            <span
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                className="text-5xl font-bold text-primary/20 leading-none"
                            >
                                {step}
                            </span>
                            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                            <p className="text-muted-foreground">{body}</p>
                        </div>
                    ))}
                </div>
            </FadeIn>

            {/* ── FEATURED COURSES ─────────────────────────────────────── */}
            <section aria-label="Courses" className="border-t border-border bg-muted/30">
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mb-10 flex items-end justify-between">
                        <div>
                            <h2
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                            >
                                Live courses
                            </h2>
                            <p className="text-muted-foreground">Real content, built by real mentors.</p>
                        </div>
                        <Button asChild variant="ghost" size="compact" className="hidden md:flex">
                            <Link href={coursesIndex.url(l)}>
                                View all <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.length > 0
                            ? courses.map((course) => <CourseCard key={course.id} course={course} locale={l} />)
                            : Array.from({ length: 3 }).map((_, i) => <CourseSkeleton key={i} />)}
                    </div>

                    <div className="mt-8 text-center md:hidden">
                        <Button asChild variant="ghost">
                            <Link href={coursesIndex.url(l)}>
                                View all courses <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </FadeIn>
            </section>

            {/* ── PORTFOLIO ANGLE ───────────────────────────────────────── */}
            <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <div>
                        <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            Your public portfolio
                        </div>
                        <h2
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            Not a certificate.
                            <br />A living record.
                        </h2>
                        <p className="mb-6 text-muted-foreground">
                            Every course you complete, every test you pass, every assignment a mentor endorses — it all lives at{' '}
                            <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
                                {typeof window !== 'undefined' ? window.location.host : 'yoursite.com'}/en/u/yourname
                            </code>
                        </p>
                        <ul className="mb-8 space-y-3">
                            {[
                                'Employers see exactly what you learned and how you scored',
                                'Mentors leave written endorsements visible on your profile',
                                'You choose which achievements to feature — up to 5',
                                'Share one link. No PDFs, no screenshots.',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                    <span className="text-muted-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>
                        {canRegister && (
                            <Button asChild variant="enroll">
                                <Link href={register()}>Build your portfolio</Link>
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
                                <p className="font-semibold text-foreground">Alex Johnson</p>
                                <p className="text-sm text-muted-foreground">Full-Stack Developer</p>
                            </div>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-2">
                            {['React', 'Laravel', 'TypeScript', 'PostgreSQL'].map((skill) => (
                                <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {[
                                { course: 'Advanced Laravel', score: '94%', endorsed: true },
                                { course: 'React Patterns', score: '88%', endorsed: true },
                                { course: 'TypeScript Deep Dive', score: '91%', endorsed: false },
                            ].map(({ course, score, endorsed }) => (
                                <div key={course} className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
                                    <span className="text-sm font-medium text-foreground">{course}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{score}</span>
                                        {endorsed && (
                                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                                                Endorsed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            {typeof window !== 'undefined' ? window.location.host : 'yoursite.com'}/en/u/alexjohnson
                        </p>
                    </div>
                </div>
            </FadeIn>

            {/* ── FOR MENTORS ──────────────────────────────────────────── */}
            <section aria-label="For mentors" id="for-mentors" className="border-t border-border bg-muted/30">
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            For mentors
                        </div>
                        <h2
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            Share what you know.
                            <br />Earn from what you teach.
                        </h2>
                        <p className="mb-8 text-muted-foreground">
                            Build structured courses with modules, rich-text lessons, videos, and real assignments. Review student submissions, write endorsements, and set your own price.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {canRegister && (
                                <Button asChild variant="enroll">
                                    <Link href={register()}>Start teaching</Link>
                                </Button>
                            )}
                            <Button asChild variant="ghost">
                                <Link href={`/${l}/about-us`}>Our philosophy</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { title: 'Rich course builder', body: 'Modules, lessons, videos, articles, and assignments — all in one editor.' },
                            { title: 'AI-assisted tests', body: 'Auto-generate quiz questions and rubrics, then fine-tune to your standards.' },
                            { title: 'Submission review', body: 'Review student work, leave written feedback, and endorse strong submissions.' },
                            { title: 'Flexible pricing', body: 'Set one-time or subscription pricing. Offer coupon codes to your community.' },
                        ].map(({ title, body }) => (
                            <div key={title} className="rounded-xl border border-border bg-card p-5">
                                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                                <p className="text-sm text-muted-foreground">{body}</p>
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
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            Simple pricing
                        </h2>
                        <p className="text-muted-foreground">No subscriptions required. Pay for what you want.</p>
                    </div>

                    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
                        {/* Free */}
                        <div className="flex flex-col rounded-2xl border border-border bg-card p-8">
                            <p className="mb-1 text-sm font-medium text-muted-foreground">Free forever</p>
                            <p
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                className="mb-6 text-4xl font-bold text-foreground"
                            >
                                $0
                            </p>
                            <ul className="mb-8 flex-1 space-y-3">
                                {[
                                    'Browse full course catalog',
                                    'Access all free resources',
                                    'AI learning assistant',
                                    'Public portfolio page',
                                    'Chat with the platform AI',
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            {canRegister && (
                                <Button asChild variant="secondary" className="w-full">
                                    <Link href={register()}>Get started free</Link>
                                </Button>
                            )}
                        </div>

                        {/* Per course */}
                        <div className="flex flex-col rounded-2xl border border-primary/50 bg-card p-8 shadow-sm ring-1 ring-primary/20">
                            <p className="mb-1 text-sm font-medium text-primary">Per course</p>
                            <p
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                className="mb-1 text-4xl font-bold text-foreground"
                            >
                                Mentor's price
                            </p>
                            <p className="mb-6 text-sm text-muted-foreground">One-time or subscription, set by the mentor.</p>
                            <ul className="mb-8 flex-1 space-y-3">
                                {[
                                    'Everything in Free',
                                    'Full course access',
                                    'Submit assignments',
                                    'Mentor review & endorsement',
                                    'Achievements on your portfolio',
                                    'Coupon codes accepted',
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Button asChild variant="enroll" className="w-full">
                                <Link href={coursesIndex.url(l)}>Browse courses</Link>
                            </Button>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* ── FINAL CTA ─────────────────────────────────────────────── */}
            <section aria-label="Get started" className="border-t border-border bg-primary/5">
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 text-center md:px-6 md:py-24">
                    <h2
                        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                    >
                        Start building your evidence portfolio today.
                    </h2>
                    <p className="mb-8 text-muted-foreground">
                        Join learners who prove their skills with real work — not just certificates.
                    </p>
                    {canRegister && (
                        <Button asChild variant="enroll" size="lg">
                            <Link href={register()}>
                                Sign up free <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">No credit card required.</p>
                </FadeIn>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <footer role="contentinfo" className="border-t border-border bg-background">
                <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt={appName} width={24} height={24} className="h-6 w-6" />
                            <span className="text-sm font-semibold text-foreground">{appName}</span>
                        </div>

                        <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <Link href={coursesIndex.url(l)} className="hover:text-foreground">Courses</Link>
                            <Link href={`/${l}/about-us`} className="hover:text-foreground">About</Link>
                            <Link href={`/${l === 'en' ? 'bn' : 'en'}/`} className="hover:text-foreground">
                                {l === 'en' ? 'বাংলা' : 'English'}
                            </Link>
                        </nav>

                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} {appName}
                        </p>
                    </div>
                </div>
            </footer>
        </PublicLayout>
    );
}
