import { Link, usePage } from '@inertiajs/react';
import { BookOpen, LayoutGrid, Tag } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { locale, ui, auth } = usePage().props;
    const dashboardHref = `/${locale}/dashboard`;
    const isAdmin = auth.user.role === 'admin';
    const isMentorOrAdmin = isAdmin || auth.user.role === 'mentor';

    const mainNavItems: NavItem[] = [
        { title: ui.nav.dashboard, href: dashboardHref, icon: LayoutGrid },
        ...(isAdmin
            ? [{ title: ui.nav.categories, href: `/${locale}/admin/categories`, icon: Tag }]
            : []),
    ];

    const mentorNavItems: NavItem[] = isMentorOrAdmin
        ? [{ title: ui.nav.my_courses, href: `/${locale}/courses`, icon: BookOpen }]
        : [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {mentorNavItems.length > 0 && (
                    <NavMain items={mentorNavItems} label="Mentor" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
