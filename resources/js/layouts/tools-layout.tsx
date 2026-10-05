import { Link, usePage } from '@inertiajs/react';
import { BRAND_NAME } from '@/lib/brand';

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { locale } = usePage().props;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header
                className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm"
                role="banner"
            >
                <div className="mx-auto flex max-w-5xl items-center px-4 md:px-6">
                    <Link
                        href={`/${String(locale)}/`}
                        className="flex items-center gap-2 py-3"
                    >
                        <img
                            src="/logo.png"
                            alt={BRAND_NAME}
                            width={28}
                            height={28}
                            className="h-7 w-7"
                        />
                        <span className="text-base font-semibold tracking-tight">
                            {BRAND_NAME}
                        </span>
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
                {children}
            </main>
        </div>
    );
}
