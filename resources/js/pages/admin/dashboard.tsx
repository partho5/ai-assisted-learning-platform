import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, BookText, Users, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface RecentUser {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    tier: number;
    avatar: string | null;
    joined_at: string;
}

interface RecentCourse {
    id: number;
    title: string;
    slug: string;
    status: string;
    mentor: { name: string; username: string };
    created_at: string;
}

interface Stats {
    total_learners: number;
    total_mentors: number;
    published_courses: number;
    draft_courses: number;
    total_enrollments: number;
    new_users_this_week: number;
}

interface Props {
    stats: Stats;
    recentUsers: RecentUser[];
    recentCourses: RecentCourse[];
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
    admin: 'default',
    mentor: 'secondary',
    learner: 'secondary',
};

export default function AdminDashboard({ stats, recentUsers, recentCourses }: Props) {
    const { locale, ui } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ui.nav.dashboard, href: `/${l}/admin/dashboard` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Platform overview and management.</p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Learners" value={stats.total_learners} icon={Users} />
                    <StatCard label="Mentors" value={stats.total_mentors} icon={Users} />
                    <StatCard label="New users (7d)" value={stats.new_users_this_week} icon={UserPlus} />
                    <StatCard label="Published courses" value={stats.published_courses} icon={BookOpen} />
                    <StatCard label="Draft courses" value={stats.draft_courses} icon={BookText} />
                    <StatCard label="Total enrollments" value={stats.total_enrollments} icon={Users} />
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Recent Users */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold">Recent Users</h2>
                            <Link href={`/${l}/admin/users`} className="text-xs text-primary hover:underline">
                                View all
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            {recentUsers.length === 0 ? (
                                <p className="p-6 text-center text-sm text-muted-foreground">No users yet.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">User</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={ROLE_VARIANT[user.role] ?? 'secondary'}>
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                                    {user.joined_at}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Recent Courses */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold">Recent Courses</h2>
                            <Link href={`/${l}/courses`} className="text-xs text-primary hover:underline">
                                View all
                            </Link>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card">
                            {recentCourses.length === 0 ? (
                                <p className="p-6 text-center text-sm text-muted-foreground">No courses yet.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="px-4 py-3">Course</th>
                                            <th className="px-4 py-3">Mentor</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {recentCourses.map((course) => (
                                            <tr key={course.id} className="hover:bg-muted/20">
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/${l}/courses/${course.slug}/edit`}
                                                        className="font-medium hover:text-primary hover:underline"
                                                    >
                                                        {course.title}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">{course.created_at}</p>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {course.mentor.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                                                        {course.status === 'published' ? 'Published' : 'Draft'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
