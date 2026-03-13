import { Link, usePage } from '@inertiajs/react';
import { BadgeCheck, BookOpen, GraduationCap } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const features = [
    {
        icon: GraduationCap,
        title: 'Learn at your own pace',
        body: 'Follow curated paths built by expert mentors.',
    },
    {
        icon: BookOpen,
        title: 'Build your evidence portfolio',
        body: 'Document your progress and showcase real skills.',
    },
    {
        icon: BadgeCheck,
        title: 'Get endorsed',
        body: 'Earn recognition from mentors who have seen your work.',
    },
];

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    const { locale } = usePage().props;

    return (
        <div className="flex min-h-svh">
            {/* Left brand panel */}
            <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
                {/* Subtle radial decoration */}
                <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-white/5" />

                {/* Logo */}
                <Link href={home(locale)} className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-white/20">
                        <AppLogoIcon className="size-6" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">Skill Evidence</span>
                </Link>

                {/* Tagline + features */}
                <div className="relative space-y-8">
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold leading-tight tracking-tight">
                            Your skills,<br />proven and portable.
                        </h2>
                        <p className="text-base text-primary-foreground/70">
                            Build a verified portfolio of evidence that travels with you — wherever your career takes you.
                        </p>
                    </div>

                    <ul className="space-y-5">
                        {features.map(({ icon: Icon, title, body }) => (
                            <li key={title} className="flex gap-4">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                                    <Icon className="size-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{title}</p>
                                    <p className="text-sm text-primary-foreground/65">{body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer quote */}
                <p className="relative text-xs text-primary-foreground/40">
                    © {new Date().getFullYear()} Skill Evidence
                </p>
            </div>

            {/* Right form panel */}
            <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
                {/* Mobile logo */}
                <Link href={home(locale)} className="mb-8 flex items-center gap-2 lg:hidden">
                    <AppLogoIcon className="size-8" />
                    <span className="text-base font-semibold">Skill Evidence</span>
                </Link>

                <div className="w-full max-w-sm space-y-6">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
