import { Head, Link, router, usePage } from '@inertiajs/react';
import { index as adminUsers } from '@/actions/App/Http/Controllers/Admin/UserController';
import { show as showPortfolio } from '@/actions/App/Http/Controllers/PublicProfileController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Paginated } from '@/types';

interface UserRow {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    tier: number;
    avatar: string | null;
    created_at: string;
}

interface Props {
    users: Paginated<UserRow>;
    filters: { role?: string; search?: string };
}

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    mentor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    learner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const TIER_LABELS: Record<number, string> = { 0: 'Free', 1: 'Observer', 2: 'Paid' };

export default function AdminUsers({ users, filters }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: `/${l}/admin/dashboard` },
        { title: 'Users', href: adminUsers.url(l) },
    ];

    function applyFilter(params: Record<string, string | undefined>) {
        router.get(adminUsers.url(l), { ...filters, ...params });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Users</h1>
                        <p className="mt-1 text-sm text-muted-foreground">All registered users on the platform.</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{users?.total ?? 0} total</span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {(['', 'admin', 'mentor', 'learner'] as const).map((role) => (
                        <Button
                            key={role}
                            size="sm"
                            variant={(filters.role ?? '') === role ? 'default' : 'secondary'}
                            onClick={() => applyFilter({ role: role || undefined })}
                        >
                            {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'All'}
                        </Button>
                    ))}

                    <input
                        type="text"
                        placeholder="Search name, email, username…"
                        defaultValue={filters.search ?? ''}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                applyFilter({ search: (e.target as HTMLInputElement).value || undefined });
                            }
                        }}
                        className="ml-auto rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {users.data.length === 0 ? (
                    <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                        No users found.
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Tier</th>
                                    <th className="px-4 py-3">Joined</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="h-8 w-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${ROLE_COLORS[user.role] ?? 'bg-muted text-muted-foreground'}`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {TIER_LABELS[user.tier] ?? user.tier}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={showPortfolio.url({ locale: l, username: user.username })}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                View profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {users && users.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {(users.links ?? []).map((link, i) => (
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
