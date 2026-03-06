import { Head, Link, router, usePage } from '@inertiajs/react';
import { Award, BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';
import { show as portfolioShow } from '@/actions/App/Http/Controllers/PublicProfileController';
import { toggleShowcase } from '@/actions/App/Http/Controllers/PortfolioController';
import { Badge } from '@/components/ui/badge';
import PublicLayout from '@/layouts/public-layout';
import type { Category, PortfolioVisibility } from '@/types';

interface ProfileData {
    name: string;
    username: string;
    avatar: string | null;
    headline: string | null;
    bio: string | null;
    portfolio_visibility: PortfolioVisibility;
    joined_at: string | null;
}

interface Stats {
    courses_enrolled: number;
    courses_completed: number;
    assignments_endorsed: number;
}

interface EnrolledCourse {
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail: string | null;
        category: Category | null;
        mentor: { id: number; name: string; username: string } | null;
    };
    progress_percent: number;
    completed: boolean;
    enrolled_at: string;
}

interface ShowcasedAttempt {
    id: number;
    test_title: string | null;
    course_title: string | null;
    course_slug: string | null;
    score: number | null;
    mentor_feedback: string | null;
    endorsed_at: string | null;
}

interface Props {
    profile: ProfileData;
    stats: Stats | null;
    enrolledCourses: EnrolledCourse[];
    showcasedAttempts: ShowcasedAttempt[];
    isPrivate?: boolean;
}

export default function PublicPortfolio({ profile, stats, enrolledCourses, showcasedAttempts, isPrivate = false }: Props) {
    const { locale, auth } = usePage().props;
    const l = String(locale);

    const isOwner = auth?.user && (auth.user as { username?: string }).username === profile.username;

    if (isPrivate) {
        return (
            <PublicLayout>
                <Head title={`${profile.name} — Portfolio`} />
                <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
                    <div className="mb-3 text-4xl font-bold text-muted-foreground/30">🔒</div>
                    <h1 className="text-xl font-semibold">{profile.name}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">@{profile.username}</p>
                    <p className="mt-4 text-sm text-muted-foreground">This profile is set to private.</p>
                    {isOwner && (
                        <Link href="/settings/profile" className="mt-4 text-sm text-primary hover:underline">
                            Change visibility
                        </Link>
                    )}
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <Head title={`${profile.name} — Portfolio`}>
                <meta name="description" content={profile.headline ?? `${profile.name}'s learning portfolio on SkillEvidence.`} />
            </Head>

            {/* Profile header */}
            <section className="border-b border-border bg-muted/30 px-4 py-10 md:px-6 md:py-14">
                <div className="mx-auto max-w-4xl">
                    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                        {/* Avatar */}
                        {profile.avatar ? (
                            <img
                                src={profile.avatar}
                                alt={profile.name}
                                className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-border"
                            />
                        ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-border">
                                {profile.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
                                {profile.portfolio_visibility === 'unlisted' && (
                                    <Badge variant="outline" className="text-xs">Unlisted</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                            {profile.headline && (
                                <p className="mt-1 text-base text-foreground">{profile.headline}</p>
                            )}
                            {profile.bio && (
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-prose">{profile.bio}</p>
                            )}

                            {isOwner && (
                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href="/settings/profile"
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Edit profile
                                    </Link>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <Link
                                        href={portfolioShow.url({ locale: l, username: profile.username })}
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Copy link
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-8 grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
                        <StatItem value={stats.courses_enrolled} label="Enrolled" />
                        <StatItem value={stats.courses_completed} label="Completed" />
                        <StatItem value={stats.assignments_endorsed} label="Endorsed" />
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:px-6">
                {/* Showcased Assignments */}
                {showcasedAttempts.length > 0 && (
                    <section>
                        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Featured Assignments
                        </h2>

                        <div className="space-y-3">
                            {showcasedAttempts.map((attempt) => (
                                <ShowcasedAttemptCard
                                    key={attempt.id}
                                    attempt={attempt}
                                    locale={l}
                                    isOwner={!!isOwner}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Enrolled Courses */}
                <section>
                    <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Courses{enrolledCourses.length > 0 ? ` (${enrolledCourses.length})` : ''}
                    </h2>

                    {enrolledCourses.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border py-12 text-center">
                            <p className="text-sm text-muted-foreground">No courses yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {enrolledCourses.map((item) => (
                                <CourseProgressCard key={item.course.id} item={item} locale={l} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </PublicLayout>
    );
}

function StatItem({ value, label }: { value: number; label: string }) {
    return (
        <div className="text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function CourseProgressCard({ item, locale }: { item: EnrolledCourse; locale: string }) {
    return (
        <Link
            href={`/${locale}/courses/${item.course.slug}`}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm hover:-translate-y-0.5"
        >
            <div className="flex items-start gap-3">
                {item.course.thumbnail ? (
                    <img
                        src={item.course.thumbnail}
                        alt={item.course.title}
                        className="h-12 w-16 shrink-0 rounded-lg object-cover"
                    />
                ) : (
                    <div className="h-12 w-16 shrink-0 rounded-lg bg-muted" />
                )}

                <div className="flex-1 min-w-0">
                    <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary transition-colors">
                        {item.course.title}
                    </h3>
                    {item.course.mentor && (
                        <p className="mt-0.5 text-xs text-muted-foreground">by {item.course.mentor.name}</p>
                    )}
                </div>

                {item.completed && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                )}
            </div>

            {/* Progress bar */}
            <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{item.progress_percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${item.progress_percent}%` }}
                    />
                </div>
            </div>
        </Link>
    );
}

function ShowcasedAttemptCard({
    attempt,
    locale,
    isOwner,
}: {
    attempt: ShowcasedAttempt;
    locale: string;
    isOwner: boolean;
}) {
    function handleUnfeature(e: React.MouseEvent) {
        e.preventDefault();
        router.post(
            toggleShowcase.url({ locale, attempt: attempt.id }),
            {},
            { preserveState: true },
        );
    }

    return (
        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Award className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{attempt.test_title ?? 'Assignment'}</p>
                {attempt.course_title && (
                    <p className="text-xs text-muted-foreground">
                        {attempt.course_slug ? (
                            <Link href={`/${locale}/courses/${attempt.course_slug}`} className="hover:underline">
                                {attempt.course_title}
                            </Link>
                        ) : (
                            attempt.course_title
                        )}
                    </p>
                )}
                {attempt.mentor_feedback && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">"{attempt.mentor_feedback}"</p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {attempt.score !== null && <span>Score: {attempt.score}%</span>}
                    {attempt.endorsed_at && <span>· Endorsed {attempt.endorsed_at}</span>}
                </div>
            </div>

            {isOwner && (
                <button
                    onClick={handleUnfeature}
                    className="shrink-0 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove from portfolio"
                >
                    Remove
                </button>
            )}
        </div>
    );
}
