import { Head, router, usePage } from '@inertiajs/react';
import { index, resolve, deleteContent } from '@/actions/App/Http/Controllers/Admin/Forum/ForumModerationController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types';
import type { ForumReport, ForumThread, ForumReply } from '@/types/forum';

const REASON_LABELS: Record<string, string> = {
    spam: 'Spam',
    misinformation: 'Misinformation',
    'off-topic': 'Off-topic',
    inappropriate: 'Inappropriate',
};

const REASON_VARIANT: Record<string, 'destructive' | 'secondary'> = {
    spam: 'secondary',
    misinformation: 'destructive',
    'off-topic': 'secondary',
    inappropriate: 'destructive',
};

function isThread(reportable: ForumThread | ForumReply | undefined): reportable is ForumThread {
    return !!reportable && 'title' in reportable;
}

function ContentPreview({ report }: { report: ForumReport }) {
    const { reportable } = report;

    if (!reportable) {
        return <span className="italic text-muted-foreground">Content unavailable</span>;
    }

    if (isThread(reportable)) {
        return (
            <div>
                <p className="font-medium text-sm">{reportable.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: reportable.body }}
                />
            </div>
        );
    }

    return (
        <p className="text-xs text-muted-foreground line-clamp-3"
            dangerouslySetInnerHTML={{ __html: reportable.body }}
        />
    );
}

interface Props {
    reports: Paginated<ForumReport>;
}

export default function ForumModerationAdmin({ reports }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: `/${l}/admin/dashboard` },
        { title: 'Forum Moderation', href: index.url(l) },
    ];

    function handleResolve(report: ForumReport) {
        router.post(resolve.url({ locale: l, forumReport: report.id }), {}, {
            preserveScroll: true,
        });
    }

    function handleDeleteContent(report: ForumReport) {
        const type = isThread(report.reportable) ? 'thread' : 'reply';
        if (!confirm(`Permanently delete this ${type}? This action cannot be undone.`)) return;
        router.delete(deleteContent.url({ locale: l, forumReport: report.id }), {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Forum Moderation" />

            <div className="mx-auto max-w-5xl p-4 md:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">Forum Moderation</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {reports.total} pending report{reports.total !== 1 ? 's' : ''}
                    </p>
                </div>

                {reports.data.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                        No pending reports. Everything looks clean.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.data.map((report) => (
                            <div key={report.id} className="rounded-xl border border-border bg-card p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <Badge variant={REASON_VARIANT[report.reason] ?? 'secondary'}>
                                                {REASON_LABELS[report.reason] ?? report.reason}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {isThread(report.reportable) ? 'Thread' : 'Reply'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                reported by @{report.reporter?.username ?? 'unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {report.created_at}
                                            </span>
                                        </div>

                                        <ContentPreview report={report} />
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleResolve(report)}
                                        >
                                            Dismiss
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteContent(report)}
                                        >
                                            Delete content
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {reports.last_page > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {reports.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url || link.active}
                                onClick={() => link.url && router.get(link.url)}
                                className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-muted/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                                data-active={link.active}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
