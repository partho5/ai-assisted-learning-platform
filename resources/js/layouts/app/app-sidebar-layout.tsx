import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { platform } from '@/actions/App/Http/Controllers/AiChatController';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    hidePlatformChat = false,
}: AppLayoutProps) {
    const { locale } = usePage().props;
    const l = String(locale);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            {!hidePlatformChat && (
                <FloatingChatButton
                    context={{ type: 'platform', key: 'platform', endpoint: platform.url(l), locale: l }}
                />
            )}
        </AppShell>
    );
}
