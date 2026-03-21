import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface MentorData {
    id?: number;
    name: string;
    username: string;
    avatar: string | null;
    headline?: string | null;
    bio?: string | null;
}

interface MentorCardProps {
    mentor: MentorData;
    locale: string;
    /**
     * card   — full "About the mentor" card (course detail page)
     * inline — compact avatar + name link (course listing cards)
     * hero   — large profile header (portfolio page)
     */
    variant?: 'card' | 'inline' | 'hero';
    /**
     * inline variant only. When false, renders as a <span> instead of <Link>.
     * Use when the inline mentor card is already inside a clickable ancestor.
     */
    linked?: boolean;
    /**
     * card variant only. When false, renders just the inner content without
     * the outer section wrapper — use when embedding multiple mentors inside
     * a shared wrapper section.
     */
    standalone?: boolean;
    /** Extra content rendered below the bio (hero variant only) */
    children?: ReactNode;
}

export default function MentorCard({ mentor, locale, variant = 'card', linked = true, standalone = true, children }: MentorCardProps) {
    const profileUrl = `/${locale}/u/${mentor.username}`;

    if (variant === 'inline') {
        const avatar = mentor.avatar ? (
            <img src={mentor.avatar} alt={mentor.name} className="size-5 rounded-full object-cover" />
        ) : (
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                {mentor.name.charAt(0).toUpperCase()}
            </div>
        );

        const className = "mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground";

        if (!linked) {
            return (
                <span className={className}>
                    {avatar}
                    <span>{mentor.name}</span>
                </span>
            );
        }

        return (
            <Link
                href={profileUrl}
                onClick={(e) => e.stopPropagation()}
                className={className}
            >
                {avatar}
                <span>{mentor.name}</span>
            </Link>
        );
    }

    if (variant === 'hero') {
        const avatar = mentor.avatar ? (
            <img src={mentor.avatar} alt={mentor.name} className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-border" />
        ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-border">
                {mentor.name.charAt(0).toUpperCase()}
            </div>
        );

        return (
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                {avatar}
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{mentor.name}</h1>
                    {mentor.headline && (
                        <p className="mt-1 text-base text-foreground">{mentor.headline}</p>
                    )}
                    {mentor.bio && (
                        <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{mentor.bio}</p>
                    )}
                    {children}
                </div>
            </div>
        );
    }

    // card variant
    const avatar = mentor.avatar ? (
        <img src={mentor.avatar} alt={mentor.name} className="size-14 rounded-full object-cover ring-2 ring-emerald-200 dark:ring-emerald-800" />
    ) : (
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            {mentor.name.charAt(0).toUpperCase()}
        </div>
    );

    const cardContent = (
        <div className="flex items-start gap-4">
            <Link href={profileUrl} className="shrink-0">{avatar}</Link>
            <div>
                <Link href={profileUrl} className="font-semibold hover:underline">{mentor.name}</Link>
                {mentor.headline && (
                    <p className="text-sm text-muted-foreground">{mentor.headline}</p>
                )}
                {mentor.bio && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{mentor.bio}</p>
                )}
            </div>
        </div>
    );

    if (!standalone) {
        return <div className="p-5">{cardContent}</div>;
    }

    return (
        <section className="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <div className="border-b border-emerald-200 bg-emerald-50/80 px-5 py-3 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">About the mentor</h2>
            </div>
            <div className="bg-emerald-50/20 p-5 dark:bg-emerald-950/10">
                {cardContent}
            </div>
        </section>
    );
}
