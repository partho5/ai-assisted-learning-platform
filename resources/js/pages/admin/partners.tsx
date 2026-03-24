import { Head, Link, router, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types';

interface Overview {
    total_partners: number;
    active_partners: number;
    total_confirmed: number;
    total_pending: number;
    total_revoked: number;
}

interface PartnerRow {
    id: number;
    user_name: string;
    user_email: string;
    code: string;
    is_active: boolean;
    created_at: string;
    referral_count: number;
    commission_count: number;
    total_earned: number;
    pending_amount: number;
}

interface PendingCommission {
    id: number;
    partner_name: string;
    partner_code: string;
    course_title: string;
    purchaser_name: string;
    commission_amount: number;
    created_at: string;
}

interface Props {
    overview: Overview;
    partners: PartnerRow[];
    pendingCommissions: Paginated<PendingCommission>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Partners', href: '#' },
];

function fmt(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function AdminPartners({ overview, partners, pendingCommissions }: Props) {
    const { locale } = usePage().props as Record<string, string>;

    function confirmCommission(id: number) {
        router.post(`/${locale}/admin/partners/commissions/${id}/confirm`, {}, { preserveScroll: true });
    }

    function revokeCommission(id: number) {
        router.post(`/${locale}/admin/partners/commissions/${id}/revoke`, {}, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Partner Management" />
            <div className="space-y-6 p-4 md:p-6">

                {/* Overview Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard label="Total Partners" value={String(overview.total_partners)} />
                    <StatCard label="Active" value={String(overview.active_partners)} />
                    <StatCard label="Confirmed Payouts" value={fmt(overview.total_confirmed)} />
                    <StatCard label="Pending Payouts" value={fmt(overview.total_pending)} accent />
                    <StatCard label="Revoked" value={fmt(overview.total_revoked)} variant="destructive" />
                </div>

                {/* Pending Commissions — Action Queue */}
                <div className="rounded-xl border bg-card">
                    <div className="border-b px-4 py-3">
                        <h3 className="font-semibold">Pending Commissions</h3>
                        <p className="text-xs text-muted-foreground">Review and confirm payouts or revoke fraudulent commissions.</p>
                    </div>
                    {pendingCommissions.data.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No pending commissions to review.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-4 py-2 font-medium">Date</th>
                                            <th className="px-4 py-2 font-medium">Partner</th>
                                            <th className="px-4 py-2 font-medium">Course</th>
                                            <th className="px-4 py-2 font-medium">Purchaser</th>
                                            <th className="px-4 py-2 font-medium text-right">Amount</th>
                                            <th className="px-4 py-2 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingCommissions.data.map((c) => (
                                            <tr key={c.id} className="border-b last:border-0">
                                                <td className="px-4 py-2 text-xs text-muted-foreground">
                                                    {new Date(c.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span>{c.partner_name}</span>
                                                    <span className="ml-1.5 text-xs text-muted-foreground">({c.partner_code})</span>
                                                </td>
                                                <td className="px-4 py-2">{c.course_title}</td>
                                                <td className="px-4 py-2">{c.purchaser_name}</td>
                                                <td className="px-4 py-2 text-right font-medium">{fmt(c.commission_amount)}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="compact"
                                                            variant="complete"
                                                            onClick={() => confirmCommission(c.id)}
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            size="compact"
                                                            variant="danger"
                                                            onClick={() => revokeCommission(c.id)}
                                                        >
                                                            Revoke
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {pendingCommissions.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 border-t px-4 py-3">
                                    {pendingCommissions.links.map((link, i) => (
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
                        </>
                    )}
                </div>

                {/* All Partners */}
                <div className="rounded-xl border bg-card">
                    <div className="border-b px-4 py-3">
                        <h3 className="font-semibold">All Partners</h3>
                    </div>
                    {partners.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No partners have joined yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="px-4 py-2 font-medium">Partner</th>
                                        <th className="px-4 py-2 font-medium">Code</th>
                                        <th className="px-4 py-2 font-medium">Status</th>
                                        <th className="px-4 py-2 font-medium text-right">Referrals</th>
                                        <th className="px-4 py-2 font-medium text-right">Sales</th>
                                        <th className="px-4 py-2 font-medium text-right">Earned</th>
                                        <th className="px-4 py-2 font-medium text-right">Pending</th>
                                        <th className="px-4 py-2 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partners.map((p) => (
                                        <tr key={p.id} className="border-b last:border-0">
                                            <td className="px-4 py-2">
                                                <div>
                                                    <span className="font-medium">{p.user_name}</span>
                                                    <span className="ml-1.5 block text-xs text-muted-foreground">{p.user_email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{p.code}</code>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Badge variant={p.is_active ? 'default' : 'secondary'}>
                                                    {p.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2 text-right">{p.referral_count}</td>
                                            <td className="px-4 py-2 text-right">{p.commission_count}</td>
                                            <td className="px-4 py-2 text-right font-medium">{fmt(p.total_earned)}</td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {p.pending_amount > 0 ? (
                                                    <span className="text-amber-600 dark:text-amber-400">{fmt(p.pending_amount)}</span>
                                                ) : (
                                                    fmt(0)
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-muted-foreground">
                                                {new Date(p.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
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

function StatCard({ label, value, variant, accent }: { label: string; value: string; variant?: 'destructive'; accent?: boolean }) {
    return (
        <div className="rounded-xl border bg-card px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${variant === 'destructive' ? 'text-destructive' : accent ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                {value}
            </p>
        </div>
    );
}
