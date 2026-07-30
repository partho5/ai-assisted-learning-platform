import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Bot, ClipboardList, Handshake, LayoutGrid, MessagesSquare, Newspaper, NotebookPen, ShieldAlert, Tag, Users, UserSquare, Zap } from 'lucide-react';
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
        ? '/admin/dashboard'
        : isMentor
          ? '/mentor/dashboard'
          : '/dashboard';

    const mainNavItems: NavItem[] = isAdmin
        ? [
            { title: ui.nav.dashboard, href: '/admin/dashboard', icon: LayoutGrid },
            { title: ui.nav.users, href: '/admin/users', icon: Users },
            { title: ui.nav.categories, href: '/admin/categories', icon: Tag },
            { title: ui.nav.submissions, href: '/admin/submissions', icon: ClipboardList },
            { title: 'AI Stats', href: '/admin/ai-stats', icon: Zap },
        ]
        : isMentor
          ? [
            { title: ui.nav.dashboard, href: '/mentor/dashboard', icon: LayoutGrid },
          ]
          : [
            { title: ui.nav.dashboard, href: '/dashboard', icon: LayoutGrid },
            { title: ui.nav.courses, href: `/${locale}/courses`, icon: BookOpen },
            { title: 'Resources', href: `/${locale}/resources`, icon: Newspaper },
          ];

    const secondaryNavItems: NavItem[] = isMentorOrAdmin
        ? [
            { title: ui.nav.my_courses, href: `/${locale}/courses`, icon: BookOpen },
            { title: 'My Articles', href: `/${locale}/resources`, icon: Newspaper },
            ...(isMentor ? [{ title: ui.nav.categories, href: '/mentor/categories', icon: Tag }] : []),
            ...(isAdmin ? [{ title: 'Partners', href: '/admin/partners', icon: Handshake }] : []),
          ]
        : [];

    const forumNavItems: NavItem[] = [
        { title: 'Forum', href: `/${locale}/forum`, icon: MessagesSquare },
        ...(isAdmin
            ? [
                { title: 'Categories', href: '/admin/forum/categories', icon: Tag },
                { title: 'AI Members', href: '/admin/forum/ai-members', icon: Bot },
                { title: 'Moderation', href: '/admin/forum/moderation', icon: ShieldAlert },
              ]
            : []),
    ];

    const personalNavItems: NavItem[] = [
        { title: 'Personal Notes', href: '/notes', icon: NotebookPen },
        { title: 'Portfolio Builder', href: '/dashboard/portfolio-builder', icon: UserSquare },
        ...(!isAdmin ? [{ title: 'Partner', href: '/dashboard/partner', icon: Handshake }] : []),
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
                <NavMain items={forumNavItems} label="Forum" />
                <NavMain items={personalNavItems} label="Personal" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
