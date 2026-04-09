import { Head, usePage } from '@inertiajs/react';
import { BarChart3, Eye, Mail, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';

interface DayVisit {
    date: string;
    count: number;
}

interface TopProject {
    project_id: number;
    visits: number;
    project: { id: number; title: string; slug: string } | null;
}

interface RecentVisitor {
    date: string;
    referer: string | null;
    page: string;
}

interface Props {
    totalVisits: number;
    visitsLast30Days: DayVisit[];
    topProjects: TopProject[];
    recentVisitors: RecentVisitor[];
    messageCount: number;
}

export default function PortfolioAnalytics({ totalVisits, visitsLast30Days, topProjects, recentVisitors, messageCount }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);
    const maxCount = Math.max(...visitsLast30Days.map((d) => d.count), 1);

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Analytics', href: `/${l}/dashboard/portfolio-builder/analytics` },
        ]}>
            <Head title="Portfolio Analytics" />

            <h1 className="mb-6 text-2xl font-bold">Analytics</h1>

            {/* Summary cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
                        <Eye className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalVisits}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Last 30 Days</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{visitsLast30Days.reduce((s, d) => s + d.count, 0)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
                        <Mail className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{messageCount}</div></CardContent>
                </Card>
            </div>

            {/* Visits chart (simple bar chart) */}
            <Card className="mb-8">
                <CardHeader><CardTitle>Visits — Last 30 Days</CardTitle></CardHeader>
                <CardContent>
                    {visitsLast30Days.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No visit data yet.</p>
                    ) : (
                        <div className="flex h-40 items-end gap-0.5">
                            {visitsLast30Days.map((d) => (
                                <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count} visits`}>
                                    <div
                                        className="rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                                        style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '0px' }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top projects */}
                <Card>
                    <CardHeader><CardTitle>Top Projects by Views</CardTitle></CardHeader>
                    <CardContent>
                        {topProjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No project visits yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {topProjects.map((tp) => (
                                    <div key={tp.project_id} className="flex items-center justify-between">
                                        <span className="truncate text-sm">{tp.project?.title ?? 'Deleted project'}</span>
                                        <span className="ml-2 text-sm font-semibold">{tp.visits}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent visitors */}
                <Card>
                    <CardHeader><CardTitle>Recent Visitors</CardTitle></CardHeader>
                    <CardContent>
                        {recentVisitors.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No visitors yet.</p>
                        ) : (
                            <div className="max-h-64 space-y-2 overflow-y-auto">
                                {recentVisitors.slice(0, 20).map((v, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="min-w-0 flex-1">
                                            <span className="font-medium">{v.page}</span>
                                            {v.referer && (
                                                <span className="ml-2 truncate text-muted-foreground">from {v.referer}</span>
                                            )}
                                        </div>
                                        <span className="ml-2 shrink-0 text-muted-foreground">{v.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PortfolioBuilderLayout>
    );
}
