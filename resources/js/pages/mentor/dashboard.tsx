import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface CourseStat {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    status: string;
    total_resources: number;
    enrollments_count: number;
    created_at: string;
}

interface Stats {
    total_courses: number;
    total_enrollments: number;
    pending_submissions: number;
    active_learners_this_week: number;
}

interface Props {
    stats: Stats;
    courses: CourseStat[];
}

function StatCard({ label, value, icon: Icon, highlight }: { label: string; value: number; icon: React.ElementType; highlight?: boolean }) {
    return (
        <div className={`flex items-center gap-4 rounded-xl border p-5 ${highlight && value > 0 ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30' : 'border-border bg-card'}`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${highlight && value > 0 ? 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-300' : 'bg-primary/10 text-primary'}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

export default function MentorDashboard({ stats, courses }: Props) {
    const { locale, ui } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ui.nav.dashboard, href: `/${l}/mentor/dashboard` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mentor Dashboard" />

            <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Overview of your courses and learner activity.</p>
                    </div>
                    <Button asChild>
                        <Link href={`/${l}/courses/create`}>New Course</Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total courses" value={stats.total_courses} icon={BookOpen} />
                    <StatCard label="Total enrollments" value={stats.total_enrollments} icon={Users} />
                    <StatCard label="Pending submissions" value={stats.pending_submissions} icon={ClipboardList} highlight />
                    <StatCard label="Active learners (7d)" value={stats.active_learners_this_week} icon={TrendingUp} />
                </div>

                {/* Pending submissions CTA */}
                {stats.pending_submissions > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 dark:border-amber-700 dark:bg-amber-950/30">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            {stats.pending_submissions} submission{stats.pending_submissions !== 1 ? 's' : ''} waiting for your review.
                        </p>
                    </div>
                )}

                {/* Courses */}
                <div>
                    <h2 className="mb-4 text-base font-semibold">Your Courses</h2>

                    {courses.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card p-10 text-center">
                            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">You have not created any courses yet.</p>
                            <Link
                                href={`/${l}/courses/create`}
                                className="mt-4 inline-block text-sm text-primary hover:underline"
                            >
                                Create your first course
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3">Course</th>
                                        <th className="px-4 py-3 text-center">Resources</th>
                                        <th className="px-4 py-3 text-center">Enrollments</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {courses.map((course) => (
                                        <tr key={course.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{course.title}</p>
                                                <p className="text-xs text-muted-foreground">{course.created_at}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">
                                                {course.total_resources}
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium">
                                                {course.enrollments_count}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                                                    {course.status === 'published' ? 'Published' : 'Draft'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={`/${l}/courses/${course.slug}/edit`}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <Link
                                                        href={`/${l}/courses/${course.slug}/submissions`}
                                                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                                                    >
                                                        Submissions
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
