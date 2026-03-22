import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Bot, ClipboardList, LayoutGrid, MessagesSquare, NotebookPen, ShieldAlert, Tag, Users, Zap } from 'lucide-react';
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
            { title: 'AI Stats', href: `/${locale}/admin/ai-stats`, icon: Zap },
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
        ? [
            { title: ui.nav.my_courses, href: `/${locale}/courses`, icon: BookOpen },
            ...(isMentor ? [{ title: ui.nav.categories, href: `/${locale}/mentor/categories`, icon: Tag }] : []),
          ]
        : [];

    const forumAdminNavItems: NavItem[] = isAdmin
        ? [
            { title: 'Categories', href: `/${locale}/admin/forum/categories`, icon: MessagesSquare },
            { title: 'AI Members', href: `/${locale}/admin/forum/ai-members`, icon: Bot },
            { title: 'Moderation', href: `/${locale}/admin/forum/moderation`, icon: ShieldAlert },
          ]
        : [];

    const communityNavItems: NavItem[] = [
        { title: 'Forum', href: `/${locale}/forum`, icon: MessagesSquare },
    ];

    const personalNavItems: NavItem[] = [
        { title: 'Personal Notes', href: `/${locale}/notes`, icon: NotebookPen },
    ];

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
                <NavMain items={communityNavItems} label="Community" />
                {forumAdminNavItems.length > 0 && (
                    <NavMain items={forumAdminNavItems} label="Forum Admin" />
                )}
                <NavMain items={personalNavItems} label="Personal" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
