import { Head, Link, router, usePage } from '@inertiajs/react';
import { Copy, Handshake } from 'lucide-react';
import { useMemo, useState } from 'react';
import { store as partnerStore } from '@/actions/App/Http/Controllers/PartnerController';
import { show as courseShow } from '@/actions/App/Http/Controllers/CourseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types';

interface Partner {
    id: number;
    code: string;
    effective_days: number;
    is_active: boolean;
}

interface CommissionSummary {
    total_earned: number;
    total_pending: number;
    total_revoked: number;
}

interface CourseBreakdown {
    course_id: number;
    course_title: string;
    course_slug: string;
    referral_count: number;
    conversion_count: number;
    total_earned: number;
}

interface RecentCommission {
    id: number;
    course_title: string;
    course_id: number;
    purchaser_name: string;
    commission_amount: number;
    status: string;
    created_at: string;
    referrer_url: string | null;
}

interface PartnerCourse {
    id: number;
    title: string;
    slug: string;
    partner_commission_rate: number;
}

interface Props {
    partner: Partner | null;
    summary: CommissionSummary;
    courseBreakdowns: CourseBreakdown[];
    recentCommissions: Paginated<RecentCommission> | null;
    partnerCourses: PartnerCourse[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Partner Program', href: '#' }];

function fmt(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
    const variant = status === 'pending' ? 'secondary' : status === 'revoked' ? 'destructive' : 'default';
    return <Badge variant={variant}>{status}</Badge>;
}

function parseSource(url: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

export default function PartnerDashboard({ partner, summary, courseBreakdowns, recentCommissions, partnerCourses }: Props) {
    const { locale, appUrl: serverAppUrl } = usePage().props as Record<string, any>;
    const appUrl = String(serverAppUrl ?? `${window.location.protocol}//${window.location.host}`);
    const l = String(locale);

    const groupedCommissions = useMemo(() => {
        if (!recentCommissions?.data.length) return [];
        const map = new Map<number, { course_title: string; course_id: number; items: RecentCommission[] }>();
        for (const c of recentCommissions.data) {
            if (!map.has(c.course_id)) {
                map.set(c.course_id, { course_title: c.course_title, course_id: c.course_id, items: [] });
            }
            map.get(c.course_id)!.items.push(c);
        }
        return Array.from(map.values());
    }, [recentCommissions]);

    if (!partner) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Partner Program" />
                <div className="flex flex-1 items-center justify-center p-6">
                    <div className="max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Handshake className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold">Partner Program</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Share courses with your audience and earn a commission on every purchase made through your referral link.
                        </p>
                        <Button
                            className="mt-6"
                            onClick={() => router.post(partnerStore.url({ locale: l }))}
                        >
                            Become a Partner
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Partner Program" />
            <div className="space-y-6 p-4 md:p-6">

                {/* Referral Code */}
                <ReferralCodeCard code={partner.code} />

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Total Earned" value={fmt(summary.total_earned)} />
                    <StatCard label="Pending" value={fmt(summary.total_pending)} />
                    <StatCard label="Revoked" value={fmt(summary.total_revoked)} variant="destructive" />
                </div>

                {/* Referral Links — Course Cards */}
                <div>
                    <h3 className="mb-3 font-semibold">Referral Links</h3>
                    {partnerCourses.length === 0 ? (
                        <div className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                            No courses have the partner program enabled yet.
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {partnerCourses.map((course) => (
                                <CourseReferralCard
                                    key={course.id}
                                    course={course}
                                    code={partner.code}
                                    appUrl={appUrl}
                                    locale={l}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Per-Course Breakdown */}
                {courseBreakdowns.length > 0 && (
                    <div className="rounded-xl border bg-card">
                        <div className="border-b px-4 py-3">
                            <h3 className="font-semibold">Per-Course Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="px-4 py-2 font-medium">Course</th>
                                        <th className="px-4 py-2 font-medium text-right">Referrals</th>
                                        <th className="px-4 py-2 font-medium text-right">Conversions</th>
                                        <th className="px-4 py-2 font-medium text-right">Earned</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseBreakdowns.map((cb) => (
                                        <tr key={cb.course_id} className="border-b last:border-0">
                                            <td className="px-4 py-2">
                                                <Link
                                                    href={courseShow.url({ locale: l, course: cb.course_slug })}
                                                    className="text-primary hover:underline"
                                                >
                                                    {cb.course_title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 text-right">{cb.referral_count}</td>
                                            <td className="px-4 py-2 text-right">{cb.conversion_count}</td>
                                            <td className="px-4 py-2 text-right font-medium">{fmt(cb.total_earned)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Commissions Grouped by Course */}
                {groupedCommissions.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold">Commission History</h3>
                        {groupedCommissions.map((group) => (
                            <div key={group.course_id} className="rounded-xl border bg-card">
                                <div className="border-b px-4 py-3">
                                    <h4 className="text-sm font-medium">{group.course_title}</h4>
                                </div>
                                <ul className="divide-y">
                                    {group.items.map((c) => {
                                        const source = parseSource(c.referrer_url);
                                        return (
                                            <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        {new Date(c.created_at).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                    <span className="truncate">{c.purchaser_name}</span>
                                                    {source && (
                                                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                            via {source}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-3">
                                                    <span className="font-medium">{fmt(c.commission_amount)}</span>
                                                    <StatusBadge status={c.status} />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                        {recentCommissions && recentCommissions.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 py-2">
                                {recentCommissions.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        className={`rounded px-3 py-1 text-xs ${link.active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveScroll
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {courseBreakdowns.length === 0 && groupedCommissions.length === 0 && (
                    <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                        No commissions yet. Share your referral links to start earning!
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function StatCard({ label, value, variant }: { label: string; value: string; variant?: 'destructive' }) {
    return (
        <div className="rounded-xl border bg-card px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${variant === 'destructive' ? 'text-destructive' : ''}`}>{value}</p>
        </div>
    );
}

function ReferralCodeCard({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    function copyCode() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="rounded-xl border bg-card px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">Your Referral Code</p>
            <div className="relative mt-2 flex items-center gap-3">
                <code className="rounded bg-muted px-3 py-1.5 font-mono text-lg font-bold tracking-widest">{code}</code>
                <Button size="sm" variant="outline" onClick={copyCode} className="gap-1.5">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                </Button>
                {copied && (
                    <span className="absolute -top-6 left-16 animate-fade-up text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Link copied
                    </span>
                )}
            </div>
        </div>
    );
}

function CourseReferralCard({
    course,
    code,
    appUrl,
    locale,
}: {
    course: PartnerCourse;
    code: string;
    appUrl: string;
    locale: string;
}) {
    const [copied, setCopied] = useState(false);
    const refUrl = `${appUrl}/${locale}/courses/${course.slug}?ref=${code}`;

    function copyLink() {
        navigator.clipboard.writeText(refUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="relative flex flex-col justify-between rounded-xl border bg-card px-4 py-4">
            <div>
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{course.title}</p>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {course.partner_commission_rate}%
                    </span>
                </div>
                <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">{refUrl}</p>
            </div>
            <div className="relative mt-3">
                <Button size="sm" variant="outline" onClick={copyLink} className="w-full gap-1.5">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                </Button>
                {copied && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 animate-fade-up text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Link copied
                    </span>
                )}
            </div>
        </div>
    );
}
