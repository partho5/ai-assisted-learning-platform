import { Head, router, usePage } from '@inertiajs/react';
import { show as showAttempt } from '@/actions/App/Http/Controllers/TestAttemptController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Course, Paginated } from '@/types';

interface SubmissionRow {
    id: number;
    attempt_number: number;
    status: string;
    score: number | null;
    submitted_at: string | null;
    user: { id: number; name: string; username: string; avatar: string | null };
    test: {
        testable: { id: number; title: string; type: string } | null;
    } | null;
}

interface Props {
    course: Course;
    submissions: Paginated<SubmissionRow>;
    filters: { resource_id?: string; status?: string };
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
    submitted: 'secondary',
    grading: 'secondary',
    graded: 'default',
    endorsed: 'default',
};

function statusLabel(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

export default function Submissions({ course, submissions, filters }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: `/${l}/courses` },
        { title: course.title, href: `/${l}/courses/${course.slug}/edit` },
        { title: 'Submissions', href: '#' },
    ];

    function filterByStatus(status: string | undefined) {
        router.get(`/${l}/courses/${course.slug}/submissions`, {
            ...filters,
            status: status ?? '',
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Submissions — ${course.title}`} />

            <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Submissions</h1>
                    <span className="text-sm text-muted-foreground">{submissions?.total ?? 0} total</span>
                </div>

                {/* Status filter */}
                <div className="flex flex-wrap gap-2">
                    {['', 'submitted', 'grading', 'graded', 'endorsed'].map((s) => (
                        <Button
                            key={s}
                            size="sm"
                            variant={(filters.status ?? '') === s ? 'default' : 'secondary'}
                            onClick={() => filterByStatus(s || undefined)}
                        >
                            {s ? statusLabel(s) : 'All'}
                        </Button>
                    ))}
                </div>

                {/* Table */}
                {submissions.data.length === 0 ? (
                    <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                        No submissions yet.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Learner</th>
                                    <th className="px-4 py-3">Resource</th>
                                    <th className="px-4 py-3">Attempt</th>
                                    <th className="px-4 py-3">Score</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Submitted</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {submissions.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3">
                                            <span className="font-medium">{row.user.name}</span>
                                            <span className="ml-1 text-xs text-muted-foreground">@{row.user.username}</span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.test?.testable?.title ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">#{row.attempt_number}</td>
                                        <td className="px-4 py-3 text-center">
                                            {row.score !== null ? `${row.score}%` : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={STATUS_VARIANTS[row.status] ?? 'secondary'}>
                                                {statusLabel(row.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {row.submitted_at
                                                ? new Date(row.submitted_at).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() =>
                                                    router.get(showAttempt.url({ locale: l, attempt: row.id }))
                                                }
                                                className="text-xs text-primary hover:underline"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {submissions && submissions.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {(submissions.links ?? []).map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
