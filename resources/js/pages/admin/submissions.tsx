import { Head, Link, router, usePage } from '@inertiajs/react';
import { index as adminSubmissions } from '@/actions/App/Http/Controllers/Admin/SubmissionController';
import { show as showAttempt } from '@/actions/App/Http/Controllers/TestAttemptController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types';

interface SubmissionRow {
    id: number;
    attempt_number: number;
    status: string;
    score: number | null;
    submitted_at: string | null;
    user: { id: number; name: string; username: string; avatar: string | null };
    test: {
        testable: {
            id: number;
            title: string;
            type: string;
            module: {
                course: { id: number; title: string; slug: string } | null;
            } | null;
        } | null;
    } | null;
}

interface Props {
    submissions: Paginated<SubmissionRow>;
    filters: { status?: string };
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
    submitted: 'secondary',
    grading: 'secondary',
    graded: 'default',
    endorsed: 'default',
};

const STATUS_COLORS: Record<string, string> = {
    submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    grading: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    graded: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    endorsed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

function statusLabel(status: string) {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}

export default function AdminSubmissions({ submissions, filters }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: `/${l}/admin/dashboard` },
        { title: 'Submissions', href: adminSubmissions.url(l) },
    ];

    function filterByStatus(status: string | undefined) {
        router.get(adminSubmissions.url(l), { status: status ?? '' });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Submissions" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Submissions</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            All test &amp; assignment attempts across every course.
                        </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{submissions?.total ?? 0} total</span>
                </div>

                {/* Status filter */}
                <div className="flex flex-wrap gap-2">
                    {(['', 'submitted', 'grading', 'graded', 'endorsed'] as const).map((s) => (
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

                {submissions.data.length === 0 ? (
                    <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                        No submissions yet.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Learner</th>
                                    <th className="px-4 py-3">Course</th>
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
                                            <p className="font-medium">{row.user.name}</p>
                                            <p className="text-xs text-muted-foreground">@{row.user.username}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.test?.testable?.module?.course ? (
                                                <Link
                                                    href={`/${l}/courses/${row.test.testable.module.course.slug}/submissions`}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    {row.test.testable.module.course.title}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.test?.testable?.title ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">#{row.attempt_number}</td>
                                        <td className="px-4 py-3 text-center">
                                            {row.score !== null ? `${row.score}%` : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[row.status] ?? 'bg-muted text-muted-foreground'}`}
                                            >
                                                {statusLabel(row.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
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
