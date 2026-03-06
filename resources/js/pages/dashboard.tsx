import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface EnrolledCourse {
    id: number;
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail: string | null;
    };
    access_level: string;
    total_resources: number;
    endorsed_count: number;
    pending_endorsement_count: number;
    progress_percent: number;
    enrolled_at: string;
}

interface Stats {
    total_enrolled: number;
    pending_endorsements: number;
    completed_courses: number;
}

interface Props {
    enrolledCourses: EnrolledCourse[];
    stats: Stats;
}

type StatColor = 'sky' | 'amber' | 'emerald';

const STAT_COLORS: Record<StatColor, { card: string; icon: string; value: string }> = {
    sky:     { card: 'border-sky-200 bg-sky-50/60 dark:border-sky-800/60 dark:bg-sky-950/25',         icon: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300',         value: 'text-sky-700 dark:text-sky-300' },
    amber:   { card: 'border-amber-200 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/25', icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300', value: 'text-amber-700 dark:text-amber-300' },
    emerald: { card: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-950/25', icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300', value: 'text-emerald-700 dark:text-emerald-300' },
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: StatColor }) {
    const c = STAT_COLORS[color];
    return (
        <div className={`flex items-center gap-4 rounded-xl border p-5 ${c.card}`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.icon}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

export default function Dashboard({ enrolledCourses, stats }: Props) {
    const { locale, ui } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ui.nav.dashboard, href: `/${l}/dashboard` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
                <div>
                    <h1 className="text-2xl font-bold">My Learning</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Track your progress and continue where you left off.</p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Courses enrolled" value={stats.total_enrolled} icon={BookOpen} color="sky" />
                    <StatCard label="Pending endorsements" value={stats.pending_endorsements} icon={Clock} color="amber" />
                    <StatCard label="Courses completed" value={stats.completed_courses} icon={CheckCircle} color="emerald" />
                </div>

                {/* Enrolled courses */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-base font-semibold">Enrolled Courses</h2>
                    </div>

                    {enrolledCourses.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card p-10 text-center">
                            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">You have not enrolled in any courses yet.</p>
                            <Link href={`/${l}/courses`} className="mt-4 inline-block text-sm text-primary hover:underline">
                                Browse courses
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {enrolledCourses.map((enrollment) => (
                                <div
                                    key={enrollment.id}
                                    className="flex items-center gap-4 overflow-hidden rounded-xl border border-indigo-200 bg-card transition-colors hover:bg-indigo-50/40 dark:border-indigo-800/50 dark:hover:bg-indigo-950/20"
                                >
                                    {/* Thumbnail */}
                                    <div className="my-3 h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                        {enrollment.course.thumbnail ? (
                                            <img
                                                src={enrollment.course.thumbnail}
                                                alt={enrollment.course.title}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <BookOpen className="h-5 w-5 text-indigo-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1 py-3">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate font-semibold">{enrollment.course.title}</p>
                                            {enrollment.access_level === 'observer' && (
                                                <Badge className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300">
                                                    Observer
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all"
                                                    style={{ width: `${enrollment.progress_percent}%` }}
                                                />
                                            </div>
                                            <span className="flex-shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                                {enrollment.endorsed_count}/{enrollment.total_resources}
                                            </span>
                                        </div>

                                        {enrollment.pending_endorsement_count > 0 && (
                                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                                {enrollment.pending_endorsement_count} waiting for endorsement
                                            </p>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="flex-shrink-0 pr-4">
                                        <Link
                                            href={`/${l}/courses/${enrollment.course.slug}`}
                                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                                        >
                                            {enrollment.progress_percent > 0 ? 'Continue' : 'Start'}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
