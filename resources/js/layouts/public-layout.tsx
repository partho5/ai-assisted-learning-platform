import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronUp, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { platform } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/CourseController';
import { login, register } from '@/routes';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    external?: boolean;
}

function NavLink({ href, children, external }: NavLinkProps) {
    const cls = 'flex items-center self-stretch px-3 text-black dark:text-gray-200 transition-colors hover:bg-black hover:text-gray-100';

    if (external || href.startsWith('#')) {
        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (!href.startsWith('#')) { return; }
            e.preventDefault();
            const el = document.getElementById(href.slice(1));
            if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
        };
        return <a href={href} className={cls} onClick={handleClick}>{children}</a>;
    }

    return <Link href={href} className={cls}>{children}</Link>;
}

export default function PublicLayout({
    children,
    hidePlatformChat = false,
    isLandingPage = false,
}: {
    children: React.ReactNode;
    hidePlatformChat?: boolean;
    isLandingPage?: boolean;
}) {
    const { auth, locale } = usePage().props;
    const l = String(locale);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 300;
            setShowTop(nearBottom);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = isLandingPage
        ? [
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'For Mentors', href: '#for-mentors' },
              { label: 'Business Minded', href: '#for-founders' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Courses', href: coursesIndex.url(l) },
              { label: 'About', href: `/${l}/about-us` },
          ]
        : [{ label: 'Courses', href: coursesIndex.url(l) }];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm" role="banner">
                <div className="mx-auto flex max-w-7xl items-stretch justify-between px-4 md:px-6">
                    {/* Logo */}
                    <Link href={`/${l}/`} className="flex items-center gap-2 py-3">
                        <img src="/logo.png" alt="SkillEvidence" width={28} height={28} className="h-7 w-7" />
                        <span className="text-base font-semibold tracking-tight">
                            {import.meta.env.VITE_APP_NAME}
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden items-stretch md:flex" aria-label="Main navigation">
                        {navLinks.map((link) => (
                            <NavLink key={link.label} href={link.href}>
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Auth buttons — desktop */}
                    <div className="hidden items-center gap-2 py-3 md:flex">
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
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="relative z-[60] flex items-center justify-center py-3 md:hidden"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile drawer backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                aria-hidden="true"
                onClick={() => setMobileOpen(false)}
            />

            {/* Mobile drawer */}
            <nav
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background shadow-xl transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                aria-label="Mobile navigation"
                aria-hidden={!mobileOpen}
            >
                {/* Drawer header */}
                <div className="border-b border-border px-4 py-3">
                    <Link href={`/${l}/`} className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                        <img src="/logo.png" alt="SkillEvidence" width={28} height={28} className="h-7 w-7" />
                        <span className="text-base font-semibold tracking-tight">
                            {import.meta.env.VITE_APP_NAME}
                        </span>
                    </Link>
                </div>

                {/* Drawer nav links */}
                <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                    {navLinks.map((link) => (
                        <NavLink key={link.label} href={link.href}>
                            <span onClick={() => setMobileOpen(false)} className="block px-2 py-2">
                                {link.label}
                            </span>
                        </NavLink>
                    ))}
                </div>

                {/* Drawer auth buttons */}
                <div className="border-t border-border px-4 py-4">
                    <div className="flex flex-col gap-2">
                        {auth.user ? (
                            <Button asChild variant="secondary" size="compact">
                                <Link href={`/${l}/dashboard`} onClick={() => setMobileOpen(false)}>Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="compact">
                                    <Link href={login()} onClick={() => setMobileOpen(false)}>Log in</Link>
                                </Button>
                                <Button asChild variant="enroll" size="compact">
                                    <Link href={register()} onClick={() => setMobileOpen(false)}>Sign up free</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main>{children}</main>

            {!hidePlatformChat && (
                <FloatingChatButton
                    context={{ type: 'platform', key: 'platform', endpoint: platform.url(l), historyEndpoint: chatHistory.url(l), locale: l }}
                />
            )}

            {/* Back to top */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
                className={`fixed bottom-[84px] right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg transition-all duration-300 hover:bg-gray-800 ${showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
            >
                <ChevronUp className="h-5 w-5" />
            </button>
        </div>
    );
}
