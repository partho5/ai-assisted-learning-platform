import { Link, usePage } from '@inertiajs/react';
import { BarChart3, FolderOpen, Grid3X3, LayoutDashboard, Mail, Settings } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

const navItems = [
    { label: 'Overview', href: '/dashboard/portfolio-builder', icon: LayoutDashboard, routeName: 'portfolio-builder.index' },
    { label: 'Projects', href: '/dashboard/portfolio-builder/projects', icon: FolderOpen, routeName: 'portfolio-builder.projects' },
    { label: 'Categories', href: '/dashboard/portfolio-builder/categories', icon: Grid3X3, routeName: 'portfolio-builder.categories' },
    { label: 'Settings', href: '/dashboard/portfolio-builder/settings', icon: Settings, routeName: 'portfolio-builder.settings' },
    { label: 'Messages', href: '/dashboard/portfolio-builder/messages', icon: Mail, routeName: 'portfolio-builder.messages' },
    { label: 'Analytics', href: '/dashboard/portfolio-builder/analytics', icon: BarChart3, routeName: 'portfolio-builder.analytics' },
];

export default function PortfolioBuilderLayout({ children, breadcrumbs }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);
    const currentUrl = usePage().url;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="border-b bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <nav className="-mb-px flex gap-1 overflow-x-auto">
                        {navItems.map((item) => {
                            const href = `/${l}${item.href}`;
                            const urlPath = currentUrl.split('?')[0];
                            const isActive = item.routeName === 'portfolio-builder.index'
                                ? urlPath === href
                                : urlPath.startsWith(href);
                            return (
                                <Link
                                    key={item.routeName}
                                    href={href}
                                    className={cn(
                                        'flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground',
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 mb-40">
                {children}
            </div>
        </AppLayout>
    );
}
