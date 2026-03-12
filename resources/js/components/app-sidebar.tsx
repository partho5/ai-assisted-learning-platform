import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, LayoutGrid, Tag, Users } from 'lucide-react';
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
    const isAdmin = auth.user.role === 'admin';
    const isMentor = auth.user.role === 'mentor';
    const isMentorOrAdmin = isAdmin || isMentor;

    const dashboardHref = isAdmin
        ? `/${locale}/admin/dashboard`
        : isMentor
          ? `/${locale}/mentor/dashboard`
          : `/${locale}/dashboard`;

    const mainNavItems: NavItem[] = isAdmin
        ? [
            { title: ui.nav.dashboard, href: `/${locale}/admin/dashboard`, icon: LayoutGrid },
            { title: ui.nav.users, href: `/${locale}/admin/users`, icon: Users },
            { title: ui.nav.categories, href: `/${locale}/admin/categories`, icon: Tag },
            { title: ui.nav.submissions, href: `/${locale}/admin/submissions`, icon: ClipboardList },
        ]
        : isMentor
          ? [
            { title: ui.nav.dashboard, href: `/${locale}/mentor/dashboard`, icon: LayoutGrid },
          ]
          : [
            { title: ui.nav.dashboard, href: `/${locale}/dashboard`, icon: LayoutGrid },
            { title: ui.nav.courses, href: `/${locale}/courses`, icon: BookOpen },
          ];

    const secondaryNavItems: NavItem[] = isMentorOrAdmin
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
                {secondaryNavItems.length > 0 && (
                    <NavMain items={secondaryNavItems} label={isAdmin ? 'Management' : 'Mentor'} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
