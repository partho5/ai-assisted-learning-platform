import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, Eye, FolderOpen, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';

interface PortfolioMessage {
    id: number;
    sender_name: string;
    sender_email: string;
    subject: string | null;
    is_read: boolean;
    created_at: string;
}

interface Props {
    portfolio: { id: number; is_published: boolean };
    stats: {
        totalProjects: number;
        totalVisits: number;
        visitsLast30: number;
        unreadMessages: number;
    };
    recentMessages: PortfolioMessage[];
    portfolioUrl: string | null;
}

export default function PortfolioBuilderIndex({ portfolio, stats, recentMessages, portfolioUrl }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const statCards = [
        { label: 'Projects', value: stats.totalProjects, icon: FolderOpen, color: 'text-blue-500' },
        { label: 'Total Visits', value: stats.totalVisits, icon: Eye, color: 'text-green-500' },
        { label: 'Last 30 Days', value: stats.visitsLast30, icon: BarChart3, color: 'text-purple-500' },
        { label: 'Unread Messages', value: stats.unreadMessages, icon: Mail, color: 'text-orange-500' },
    ];

    return (
        <PortfolioBuilderLayout breadcrumbs={[{ title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` }]}>
            <Head title="Portfolio Builder" />

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Portfolio Builder</h1>
                <div className="flex items-center gap-3">
                    {portfolio.is_published ? (
                        <Badge variant="default">Published</Badge>
                    ) : (
                        <Badge variant="secondary">Draft</Badge>
                    )}
                    {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">View Portfolio</Button>
                        </a>
                    )}
                </div>
            </div>

            {/* Stats grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                            <s.icon className={`h-4 w-4 ${s.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{s.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent messages */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Messages</CardTitle>
                    <Link href={`/${l}/dashboard/portfolio-builder/messages`}>
                        <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentMessages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No messages yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentMessages.map((msg) => (
                                <Link
                                    key={msg.id}
                                    href={`/${l}/dashboard/portfolio-builder/messages/${msg.id}`}
                                    className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                >
                                    <div className="min-w-0">
                                        <p className={`text-sm ${!msg.is_read ? 'font-semibold' : ''}`}>
                                            {msg.sender_name}
                                            {!msg.is_read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />}
                                        </p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {msg.subject || 'No subject'}
                                        </p>
                                    </div>
                                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                                        {new Date(msg.created_at).toLocaleDateString()}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </PortfolioBuilderLayout>
    );
}
