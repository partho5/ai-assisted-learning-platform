import { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/CourseController';
import { aboutCopy, type AboutBenefit } from '@/lib/about-copy';
import { BRAND_EXPANSION, BRAND_FULL, BRAND_NAME } from '@/lib/brand';

// ─── useFadeIn (same pattern as welcome.tsx) ──────────────────────────────────

function useFadeIn(threshold = 0.1) {
    const ref = useRef<HTMLElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    obs.disconnect();
                }
            },
            { threshold },
        );

        obs.observe(el);

        return () => obs.disconnect();
    }, [threshold]);

    return { ref, inView };
}

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    const { ref, inView } = useFadeIn();

    return (
        <section
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out ${inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
        >
            {children}
        </section>
    );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const sw: React.SVGProps<SVGSVGElement> = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};

function BookIcon() {
    return (
        <svg {...sw}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    );
}

function ZapIcon() {
    return (
        <svg {...sw}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}

function BotIcon() {
    return (
        <svg {...sw}>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <line x1="12" y1="7" x2="12" y2="11" />
            <line x1="8" y1="17" x2="8.01" y2="17" strokeWidth="2.5" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
            <line x1="16" y1="17" x2="16.01" y2="17" strokeWidth="2.5" />
        </svg>
    );
}

function IdCardIcon() {
    return (
        <svg {...sw}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <circle cx="8" cy="12" r="2" />
            <path d="M14 9h4M14 12h4M14 15h4" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg {...sw}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function BroadcastIcon() {
    return (
        <svg {...sw}>
            <circle cx="12" cy="12" r="2" />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
        </svg>
    );
}

function CheckSquareIcon() {
    return (
        <svg {...sw}>
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    );
}

function AwardIcon() {
    return (
        <svg {...sw}>
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
    );
}

function MessageIcon() {
    return (
        <svg {...sw}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function RefreshIcon() {
    return (
        <svg {...sw}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    );
}

/** Copy files reference icons by key so the narrative stays free of JSX. */
const ICONS: Record<string, () => React.ReactElement> = {
    book: BookIcon,
    zap: ZapIcon,
    bot: BotIcon,
    idcard: IdCardIcon,
    eye: EyeIcon,
    refresh: RefreshIcon,
    broadcast: BroadcastIcon,
    checksquare: CheckSquareIcon,
    award: AwardIcon,
    message: MessageIcon,
};

// ─── Benefit row ─────────────────────────────────────────────────────────────

function BenefitRow({ benefit, delay }: { benefit: AboutBenefit; delay: number }) {
    const Icon = ICONS[benefit.icon] ?? BookIcon;

    return (
        <FadeIn delay={delay}>
            <div className="flex gap-5 py-7 border-b border-border">
                <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg mt-0.5 bg-primary/10 text-primary">
                    <Icon />
                </div>
                <div>
                    <h3 className="mb-2 text-base font-semibold leading-snug text-foreground">
                        {benefit.headline}
                    </h3>
                    <p className="text-sm leading-[1.85] text-muted-foreground max-w-prose">
                        {benefit.body}
                    </p>
                </div>
            </div>
        </FadeIn>
    );
}

// ─── Section badge ────────────────────────────────────────────────────────────

function SectionBadge({ label }: { label: string }) {
    return (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase mb-5 bg-primary/10 text-primary border border-primary/20">
            {label}
        </div>
    );
}

// ─── Section headline ─────────────────────────────────────────────────────────

function SectionHeadline({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-8 leading-tight">
            {children}
        </h2>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutUs() {
    const { locale } = usePage().props;
    const l = String(locale);
    const c = aboutCopy(l);

    return (
        <PublicLayout hidePlatformChat>
            <Head title={`${c.meta.title} | ${BRAND_FULL}`}>
                <meta name="description" content={c.meta.description} />
            </Head>

            {/* ── The name ──────────────────────────────────────────────── */}
            <section className="border-b border-border bg-primary/5 py-12">
                <div className="mx-auto max-w-3xl px-5 text-center">
                    <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {BRAND_NAME}
                    </p>
                    <p className="mt-2 text-lg font-medium text-primary sm:text-xl">
                        {BRAND_EXPANSION}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">{c.nameNote}</p>
                </div>
            </section>

            {/* ── Section 1: The broken system ──────────────────────────── */}
            <section className="border-b border-border py-20">
                <div className="mx-auto max-w-3xl px-5">
                    <FadeIn>
                        <SectionBadge label={c.problem.badge} />
                        <SectionHeadline>{c.problem.headline}</SectionHeadline>
                        <div className="space-y-5">
                            {c.problem.paragraphs.map((p) => (
                                <p key={p} className="text-base leading-[1.9] text-muted-foreground">
                                    {p}
                                </p>
                            ))}
                        </div>
                        <p className="mt-10 border-l-4 border-primary pl-6 text-xl font-semibold leading-relaxed text-foreground">
                            {c.problem.pullquote}
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* ── Section 2: Our answer ─────────────────────────────────── */}
            <section className="border-b border-border bg-muted/30 py-20">
                <div className="mx-auto max-w-3xl px-5">
                    <FadeIn>
                        <SectionBadge label={c.answer.badge} />
                        <SectionHeadline>{c.answer.headline}</SectionHeadline>
                        <p className="mb-6 text-lg leading-[1.8] text-foreground">{c.answer.lead}</p>
                    </FadeIn>
                    {c.answer.benefits.map((b, i) => (
                        <BenefitRow key={b.headline} benefit={b} delay={i * 65} />
                    ))}
                </div>
            </section>

            {/* ── Section 3: 2 years, not 20 ────────────────────────────── */}
            <section className="border-b border-border py-20">
                <div className="mx-auto max-w-3xl px-5">
                    <FadeIn>
                        <SectionBadge label={c.timeline.badge} />
                        <SectionHeadline>{c.timeline.headline}</SectionHeadline>
                        <div className="space-y-5">
                            {c.timeline.paragraphs.map((p) => (
                                <p key={p} className="text-base leading-[1.9] text-muted-foreground">
                                    {p}
                                </p>
                            ))}
                        </div>
                        <p className="my-9 rounded-xl border border-primary/30 bg-primary/5 p-6 text-lg leading-relaxed font-medium text-foreground">
                            {c.timeline.callout}
                        </p>
                        <p className="text-base leading-[1.9] font-semibold text-foreground">
                            {c.timeline.closing}
                        </p>
                        <Button asChild variant="enroll" className="mt-8">
                            <Link href={coursesIndex.url(l)}>{c.timeline.cta}</Link>
                        </Button>
                    </FadeIn>
                </div>
            </section>

            {/* ── Section 4: Founder's note ─────────────────────────────── */}
            <section className="border-b border-border bg-muted/30 py-20">
                <div className="mx-auto max-w-3xl px-5">
                    <FadeIn>
                        <SectionBadge label={c.founder.badge} />
                        <SectionHeadline>{c.founder.headline}</SectionHeadline>
                        <div className="space-y-5">
                            {c.founder.paragraphs.map((p) => (
                                <p key={p} className="text-base leading-[1.9] text-muted-foreground">
                                    {p}
                                </p>
                            ))}
                        </div>
                        <p className="my-9 border-l-4 border-primary pl-6 text-xl font-semibold leading-relaxed text-foreground">
                            {c.founder.pullquote}
                        </p>
                        <p className="text-base leading-[1.9] text-muted-foreground">{c.founder.closing}</p>
                        <p className="mt-8 text-sm font-semibold text-foreground">{c.founder.signature}</p>
                    </FadeIn>
                </div>
            </section>

            {/* ── Section 5: For mentors ────────────────────────────────── */}
            <section className="py-20">
                <div className="mx-auto max-w-3xl px-5">
                    <FadeIn>
                        <SectionBadge label={c.mentors.badge} />
                        <SectionHeadline>{c.mentors.headline}</SectionHeadline>
                        <p className="mb-6 text-lg leading-[1.8] text-foreground">{c.mentors.lead}</p>
                    </FadeIn>
                    {c.mentors.benefits.map((b, i) => (
                        <BenefitRow key={b.headline} benefit={b} delay={i * 65} />
                    ))}
                </div>
            </section>
        </PublicLayout>
    );
}
