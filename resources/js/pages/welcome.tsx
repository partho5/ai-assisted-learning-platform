import { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, CheckCircle, ChevronRight, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RotatingText } from '@/components/rotating-text';
import PublicLayout from '@/layouts/public-layout';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/CourseController';
import { index as forumIndex } from '@/actions/App/Http/Controllers/Forum/ForumController';
import { register } from '@/routes';

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
            target: `${appUrl}/en/courses?search={search_term_string}`,
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
    const { name: appName, appUrl: serverAppUrl } = usePage().props as Record<string, any>;
    const appUrl = String(serverAppUrl ?? '');

    const courses = featuredCourses ?? [];

    return (
        <PublicLayout isLandingPage hideFooter hidePlatformChat={false}>
            <Head title={`${String(appName)} — Learn, Prove, Get Hired`}>
                <meta
                    name="description"
                    content="Take mentor-led courses, complete real tests and assignments, and build a verified skill portfolio employers actually trust. Free to start."
                />
                <meta
                    name="keywords"
                    content="skill evidence, online courses, verified learning, skill portfolio, mentor courses, learn online"
                />
                <link rel="canonical" href={`${appUrl}/${l}/`} />
                <meta property="og:site_name" content={String(appName)} />
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content={`${String(appName)} — Learn, Prove, Get Hired`}
                />
                <meta
                    property="og:description"
                    content="Take mentor-led courses, complete real tests and assignments, and build a verified skill portfolio employers actually trust."
                />
                <meta property="og:url" content={`${appUrl}/${l}/`} />
                <meta property="og:image" content={`${appUrl}/og-image.png`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={`${String(appName)} — Learn, Prove, Get Hired`} />
                <meta property="og:locale" content="en_US" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content={`${String(appName)} — Learn, Prove, Get Hired`}
                />
                <meta
                    name="twitter:description"
                    content="Build a verified skill portfolio with real mentor-reviewed work."
                />
                <meta name="twitter:image" content={`${appUrl}/og-image.png`} />
                <SchemaOrg
                    courses={courses}
                    appUrl={appUrl}
                    appName={String(appName)}
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
                    className="pointer-events-none absolute -top-24 left-1/2 h-[440px] w-[640px] rounded-full blur-[110px]"
                    style={{ animation: 'blobFloat1 20s ease-in-out infinite' }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute right-10 bottom-0 h-72 w-72 rounded-full blur-[90px]"
                    style={{ animation: 'blobFloat2 25s ease-in-out infinite' }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/3 left-0 h-56 w-56 rounded-full blur-[80px]"
                    style={{ animation: 'blobFloat3 17s ease-in-out infinite' }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />

                <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28 lg:py-36">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-black px-4 py-1.5 text-sky-400 shadow-sm backdrop-blur-sm">
                            <span
                                className="h-1.5 w-1.5 rounded-full bg-green-400"
                                style={{
                                    animation:
                                        'badgePulse 2s ease-in-out infinite',
                                }}
                            />
                            Recruiters don't care about your certificates
                        </div>

                        <h1
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-4 text-4xl leading-tight font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl dark:text-gray-200"
                        >
                            Stop chasing certificates.{' '}
                            <span
                                className="bg-clip-text text-transparent"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(90deg, #0f172a, #2563eb, #0ea5e9, #6366f1, #0f172a)',
                                    backgroundSize: '300% auto',
                                    animation:
                                        'gradientFlow 6s ease-in-out infinite',
                                }}
                            >
                                Build real work that gets you hired.
                            </span>
                        </h1>

                        <p className="mx-auto mb-10 max-w-xl text-lg text-slate-600">
                            Complete real assignments, get them publicly
                            endorsed, that proves what you can{' '}
                            <i>actually do</i>.
                        </p>

                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            {canRegister && (
                                <Button
                                    asChild
                                    variant="hero"
                                    size="lg"
                                    className="bg-indigo-700 hover:bg-black"
                                >
                                    <Link href={register()}>Join now</Link>
                                </Button>
                            )}
                            <Button
                                asChild
                                size="lg"
                                className="group bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md hover:from-black hover:to-blue-700"
                            >
                                <Link href={coursesIndex.url(l)}>
                                    Browse courses
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>

                        <p className="mt-4 text-xs text-slate-400">
                            No credit card required
                        </p>
                    </div>
                </div>
            </section>

            {/* ── TRUST BAR ────────────────────────────────────────────── */}
            <div className="border-b border-border bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[
                            {
                                icon: <BookOpen className="h-5 w-5" />,
                                label: 'High-value courses',
                                color: 'bg-orange-50 text-orange-600 border-orange-100 text-sm md:text-lg',
                            },
                            {
                                icon: <CheckCircle className="h-5 w-5" />,
                                label: 'Mentor-endorsed work',
                                color: 'bg-indigo-50 text-indigo-600 border-indigo-100 text-sm md:text-lg',
                            },
                            {
                                icon: <Users className="h-5 w-5" />,
                                label: 'Public skill portfolio',
                                color: 'bg-violet-50 text-violet-600 border-violet-100 text-sm md:text-lg',
                            },
                        ].map(({ icon, label, color }) => (
                            <div
                                key={label}
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${color}`}
                            >
                                <span className="shrink-0">{icon}</span>
                                <span className="">{label}</span>
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
                            <div className="flex items-center gap-3 rounded-[10px] bg-white px-4 py-3">
                                <Sparkles
                                    className="h-5 w-5 shrink-0"
                                    style={{ color: '#4285F4' }}
                                />
                                <span className="text-sm font-medium text-slate-700 md:text-lg ">
                                    AI-native learning
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        How it works
                    </h2>
                    <p className="text-muted-foreground">
                        Three steps from enrolled to someone recruiters actually
                        call back.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {[
                        {
                            step: '01',
                            titleBefore: 'Pick a ',
                            rotatingWords: [
                                'skill gap',
                                'weak spot',
                                'blind spot',
                                'career gap',
                            ],
                            titleAfter: ' to close',
                            initialDelay: 0,
                            body: 'Not another course to add to your list — a real gap to close. Mentor-built content with videos, articles, and assignments designed around hireable outcomes.',
                            gradient: 'from-sky-500 to-cyan-400',
                            bg: 'bg-sky-50 dark:bg-sky-950/30',
                            border: 'border-sky-100 dark:border-sky-900',
                        },
                        {
                            step: '02',
                            titleBefore: 'Do work a ',
                            rotatingWords: [
                                'recruiter',
                                'hiring manager',
                                'client',
                                'CEO',
                            ],
                            titleAfter: ' can read',
                            initialDelay: 900,
                            body: "Assignments aren't busywork. They're portfolio pieces. Submit real work a hiring manager can open, read, and evaluate — not a multiple-choice score.",
                            gradient: 'from-indigo-500 to-violet-500',
                            bg: 'bg-indigo-50 dark:bg-indigo-950/30',
                            border: 'border-indigo-100 dark:border-indigo-900',
                        },
                        {
                            step: '03',
                            titleBefore: 'Get a ',
                            rotatingWords: [
                                "mentor's",
                                "expert's",
                                "professional's",
                            ],
                            titleAfter: ' public verdict',
                            initialDelay: 1800,
                            body: 'A real mentor reviews your submission and writes a public endorsement — permanently recorded on your portfolio. Not a certificate. A verdict from someone who knows.',
                            gradient: 'from-violet-500 to-fuchsia-500',
                            bg: 'bg-violet-50 dark:bg-violet-950/30',
                            border: 'border-violet-100 dark:border-violet-900',
                        },
                    ].map(
                        ({
                            step,
                            titleBefore,
                            rotatingWords,
                            titleAfter,
                            initialDelay,
                            body,
                            gradient,
                            bg,
                            border,
                        }) => (
                            <div
                                key={step}
                                className={`relative flex flex-col gap-4 rounded-2xl border p-8 ${bg} ${border}`}
                            >
                                <span
                                    style={{
                                        fontFamily:
                                            "'Bricolage Grotesque', sans-serif",
                                    }}
                                    className={`bg-gradient-to-r ${gradient} bg-clip-text text-6xl leading-none font-black text-transparent`}
                                >
                                    {step}
                                </span>
                                <h3 className="text-xl font-semibold text-foreground">
                                    {titleBefore}
                                    <RotatingText
                                        words={rotatingWords}
                                        initialDelay={initialDelay}
                                        className="text-primary"
                                    />
                                    {titleAfter}
                                </h3>
                                <p className="text-muted-foreground">{body}</p>
                            </div>
                        ),
                    )}
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
                                Recent courses
                            </h2>

                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            size="compact"
                            className="hidden md:flex"
                        >
                            <Link href={coursesIndex.url(l)}>
                                View all{' '}
                                <ChevronRight className="ml-1 h-4 w-4" />
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
                                  />
                              ))
                            : Array.from({ length: 3 }).map((_, i) => (
                                  <CourseSkeleton key={i} />
                              ))}
                    </div>

                    <div className="mt-8 text-center md:hidden">
                        <Button asChild variant="ghost">
                            <Link href={coursesIndex.url(l)}>
                                View all courses{' '}
                                <ChevronRight className="ml-1 h-4 w-4" />
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
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            A certificate says you sat through it.
                            <br />
                            This shows what you can actually do.
                        </h2>
                        <p className="mb-6 text-muted-foreground">
                            Every assignment a mentor endorses, every test you
                            pass — it's all publicly verified at{' '}
                            <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
                                {typeof window !== 'undefined'
                                    ? window.location.host
                                    : 'yoursite.com'}
                                /en/u/yourname
                            </code>
                            . One link. No PDFs. No "trust me."
                        </p>
                        <ul className="mb-8 space-y-3">
                            {[
                                'Recruiters see your actual work — not a completion badge',
                                'Mentors write public endorsements that vouch for your output',
                                'Pin your strongest pieces — up to 5 featured submissions',
                                'Share one URL in job applications, LinkedIn, anywhere',
                            ].map((item) => (
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
                                <Link href={register()}>
                                    Build your portfolio
                                </Link>
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
                                    Full-Stack Developer
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
                                                Endorsed
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
                            /en/u/alexjohnson
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
                            For mentors
                        </div>
                        <h2
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            Share what you know.
                            <br />
                            Earn from what you teach.
                        </h2>
                        <p className="mb-8 text-muted-foreground">
                            Build structured courses with modules, rich-text
                            lessons, videos, and real assignments. Review
                            student submissions, write endorsements, and set
                            your own price.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {canRegister && (
                                <Button asChild variant="enroll">
                                    <Link
                                        href={
                                            register().url + '?join_as=mentor'
                                        }
                                    >
                                        Start teaching
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="ghost">
                                <Link href={`/${l}/about-us`}>
                                    Our philosophy
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                title: 'Rich course builder',
                                body: 'Modules, lessons, videos, articles, and assignments — all in one editor.',
                            },
                            {
                                title: 'AI-assisted tests',
                                body: 'Auto-generate quiz questions and rubrics, then fine-tune to your standards.',
                            },
                            {
                                title: 'Submission review',
                                body: 'Review student work, leave written feedback, and endorse strong submissions.',
                            },
                            {
                                title: 'Flexible pricing',
                                body: 'Set one-time or subscription pricing. Offer coupon codes to your community.',
                            },
                        ].map(({ title, body }) => (
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

            {/* ── FOR FOUNDERS ─────────────────────────────────────────── */}
            <section id="for-founders" aria-label="For founders">
                <FadeIn className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            Start a business
                        </div>
                        <h2
                            style={{
                                fontFamily: "'Bricolage Grotesque', sans-serif",
                            }}
                            className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                        >
                            Build a business that runs on technology.
                        </h2>
                        <p className="mb-8 text-muted-foreground">
                            Not every learner wants a job. Some want clients.
                            These courses teach the skills that run a real
                            business — web apps, databases, systems, automation.
                            When you finish, you will be able to create or speed
                            up your own business.
                        </p>
                        {canRegister && (
                            <Button asChild variant="enroll">
                                <Link href={register()}>Start building</Link>
                            </Button>
                        )}
                    </div>

                    <div className="mt-14 grid gap-6 sm:grid-cols-3">
                        {[
                            {
                                title: 'Take client work',
                                body: 'Your portfolio shows real, endorsed work. Clients can see what you built — not just what you studied.',
                            },
                            {
                                title: 'Build and sell products',
                                body: 'Use your skills to build software products. Launch them, sell them, run them yourself.',
                            },
                            {
                                title: 'Hire and grow',
                                body: 'When your business grows, recruit people with verified skills. Or teach your own team on this platform.',
                            },
                        ].map(({ title, body }) => (
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
                            Simple pricing
                        </h2>
                        <p className="text-muted-foreground">
                            No subscriptions required. Pay for what you want.
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
                        {/* Free */}
                        <div className="flex flex-col rounded-2xl border border-border bg-card p-8">
                            <p className="mb-1 text-sm font-medium text-muted-foreground">
                                Free forever
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
                                {[
                                    'Browse full course catalog',
                                    'Access all free resources',
                                    'AI learning assistant',
                                    'Public portfolio page',
                                    'Chat with the platform AI',
                                ].map((item) => (
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
                                    <Link href={register()}>
                                        Get started free
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Per course */}
                        <div className="flex flex-col rounded-2xl border border-primary/50 bg-card p-8 shadow-sm ring-1 ring-primary/20">
                            <p className="mb-1 text-sm font-medium text-primary">
                                Per course
                            </p>
                            <p
                                style={{
                                    fontFamily:
                                        "'Bricolage Grotesque', sans-serif",
                                }}
                                className="mb-1 text-4xl font-bold text-foreground"
                            >
                                Mentor's price
                            </p>
                            <p className="mb-6 text-sm text-muted-foreground">
                                One-time or subscription, set by the mentor.
                            </p>
                            <ul className="mb-8 flex-1 space-y-3">
                                {[
                                    'Everything in Free',
                                    'Full course access',
                                    'Submit assignments',
                                    'Mentor review & endorsement',
                                    'Achievements on your portfolio',
                                    'Coupon codes accepted',
                                ].map((item) => (
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
                                <Link href={coursesIndex.url(l)}>
                                    Browse courses
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
                        Your next{' '}
                        <RotatingText
                            words={['job', 'business', 'career', 'client']}
                            className="text-primary"
                        />{' '}
                        should start here.
                    </h2>
                    <p className="mb-8 text-muted-foreground">
                        Stop attaching PDFs. Build a portfolio of
                        mentor-endorsed work and send one link that does the
                        talking for you.
                    </p>
                    {canRegister && (
                        <Button asChild variant="enroll" size="lg">
                            <Link href={register()}>
                                Sign up free{' '}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                        No credit card required.
                    </p>
                </FadeIn>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <footer role="contentinfo" className="mb-48 border-t border-border bg-background">
                <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
                    {/* Top: brand + columns */}
                    <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
                        {/* Brand */}
                        <div className="col-span-2 md:col-span-1">
                            <div className="mb-3 flex items-center gap-2">
                                <img src="/logo.png" alt={appName} width={24} height={24} className="h-6 w-6" />
                                <span className="text-sm font-semibold text-foreground">{appName}</span>
                            </div>
                            <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">
                                Skill-based learning with verified portfolios and AI-powered feedback.
                            </p>
                        </div>

                        {/* Platform */}
                        <div>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">Platform</p>
                            <ul className="space-y-3">
                                <li><Link href={coursesIndex.url(l)} className="text-sm text-muted-foreground hover:text-primary">Courses</Link></li>
                                <li><Link href={forumIndex.url(l)} className="text-sm text-muted-foreground hover:text-primary">Forum</Link></li>
                                <li><Link href={`/${l}/about-us`} className="text-sm text-muted-foreground hover:text-primary">About</Link></li>
                                {/*<li>*/}
                                {/*    <Link href={`/${l === 'en' ? 'bn' : 'en'}/`} className="text-sm text-muted-foreground hover:text-primary">*/}
                                {/*        {l === 'en' ? 'বাংলা' : 'English'}*/}
                                {/*    </Link>*/}
                                {/*</li>*/}
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">Support</p>
                            <ul className="space-y-3">
                                <li><Link href={`/${l}/contact`} className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
                                <li><Link href={`/${l}/refund-policy`} className="text-sm text-muted-foreground hover:text-primary">Refund Policy</Link></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">Legal</p>
                            <ul className="space-y-3">
                                <li><Link href={`/${l}/privacy-policy`} className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                                <li><Link href={`/${l}/terms`} className="text-sm text-muted-foreground hover:text-primary">Terms &amp; Conditions</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom: copyright */}
                    <div className="mt-12 border-t border-border pt-6">
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} {appName}. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </PublicLayout>
    );
}
