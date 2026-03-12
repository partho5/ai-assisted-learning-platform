import { Head, usePage } from '@inertiajs/react';
import { Zap, BarChart3, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface StatRow {
    model: string;
    method: string;
    call_count: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_usd: number;
    first_call_at: string;
    last_call_at: string;
}

interface Props {
    stats: StatRow[];
    summary: {
        total_calls: number;
        total_cost_usd: number;
        total_input_tokens: number;
        total_output_tokens: number;
    };
    costByModel: Record<string, number>;
    costByMethod: Record<string, number>;
}

function SummaryCard({
    label,
    value,
    icon: Icon,
    unit,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    unit?: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-bold">
                    {value}
                    {unit && <span className="ml-1 text-sm">{unit}</span>}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
}

export default function AiStats({ stats, summary, costByModel, costByMethod }: Props) {
    const { locale, ui } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ui.nav.admin, href: `/${l}/admin/dashboard` },
        { title: 'AI Statistics', href: `/${l}/admin/ai-stats` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Statistics" />

            <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
                <div>
                    <h1 className="text-3xl font-bold">AI API Usage & Costs</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Track token consumption and costs across all AI features
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <SummaryCard
                        label="Total API Calls"
                        value={formatNumber(summary.total_calls)}
                        icon={TrendingUp}
                    />
                    <SummaryCard
                        label="Total Cost"
                        value={`$${summary.total_cost_usd.toFixed(2)}`}
                        icon={Zap}
                    />
                    <SummaryCard
                        label="Input Tokens"
                        value={formatNumber(summary.total_input_tokens)}
                        icon={BarChart3}
                    />
                    <SummaryCard
                        label="Output Tokens"
                        value={formatNumber(summary.total_output_tokens)}
                        icon={BarChart3}
                    />
                </div>

                {/* Cost by Model */}
                {Object.keys(costByModel).length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">Cost by Model</h2>
                        <div className="space-y-3">
                            {Object.entries(costByModel).map(([model, cost]) => (
                                <div key={model} className="flex items-center justify-between">
                                    <span className="font-mono text-sm">{model}</span>
                                    <Badge variant="secondary">${cost.toFixed(4)}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cost by Method */}
                {Object.keys(costByMethod).length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold">Cost by Method</h2>
                        <div className="space-y-3">
                            {Object.entries(costByMethod).map(([method, cost]) => (
                                <div key={method} className="flex items-center justify-between">
                                    <span className="capitalize font-mono text-sm">{method}</span>
                                    <Badge variant="secondary">${cost.toFixed(4)}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detailed Table */}
                {stats.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="px-4 py-3 text-left font-semibold">Model</th>
                                    <th className="px-4 py-3 text-left font-semibold">Method</th>
                                    <th className="px-4 py-3 text-right font-semibold">Calls</th>
                                    <th className="px-4 py-3 text-right font-semibold">Input Tokens</th>
                                    <th className="px-4 py-3 text-right font-semibold">Output Tokens</th>
                                    <th className="px-4 py-3 text-right font-semibold">Cost</th>
                                    <th className="px-4 py-3 text-left font-semibold">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((row, idx) => (
                                    <tr
                                        key={`${row.model}-${row.method}`}
                                        className={idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'}
                                    >
                                        <td className="border-b border-border/50 px-4 py-3">
                                            <Badge variant="outline">{row.model}</Badge>
                                        </td>
                                        <td className="border-b border-border/50 px-4 py-3 capitalize">
                                            {row.method}
                                        </td>
                                        <td className="border-b border-border/50 px-4 py-3 text-right">
                                            {formatNumber(row.call_count)}
                                        </td>
                                        <td className="border-b border-border/50 px-4 py-3 text-right font-mono text-xs">
                                            {formatNumber(row.total_input_tokens)}
                                        </td>
                                        <td className="border-b border-border/50 px-4 py-3 text-right font-mono text-xs">
                                            {row.total_output_tokens
                                                ? formatNumber(row.total_output_tokens)
                                                : '—'}
                                        </td>
                                        <td className="border-b border-border/50 px-4 py-3 text-right font-semibold">
                                            ${row.total_cost_usd.toFixed(4)}
                                        </td>
                                        <td className="border-b border-border/50 px-4 py-3 text-xs text-muted-foreground">
                                            {formatDate(row.last_call_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                        <p className="text-muted-foreground">No API usage data yet</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
