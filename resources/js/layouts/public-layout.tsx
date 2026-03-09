import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { platform } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/CourseController';
import { login, register } from '@/routes';

export default function PublicLayout({ children, hidePlatformChat = false }: { children: React.ReactNode; hidePlatformChat?: boolean }) {
    const { auth, locale } = usePage().props;
    const l = String(locale);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
                    <Link href={`/${l}/`} className="text-lg font-semibold tracking-tight">
                        {import.meta.env.VITE_APP_NAME}
                    </Link>

                    <nav className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="compact">
                            <Link href={coursesIndex.url(l)}>Courses</Link>
                        </Button>

                        {auth.user ? (
                            <Button asChild variant="secondary" size="compact">
                                <Link href={`/${l}/dashboard`}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="compact">
                                    <Link href={login()}>Log in</Link>
                                </Button>
                                <Button asChild variant="enroll" size="compact">
                                    <Link href={register()}>Sign up free</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main>{children}</main>

            {!hidePlatformChat && (
                <FloatingChatButton
                    context={{ type: 'platform', key: 'platform', endpoint: platform.url(l), historyEndpoint: chatHistory.url(l), locale: l }}
                />
            )}
        </div>
    );
}
