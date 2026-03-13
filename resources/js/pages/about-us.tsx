import { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';

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

function GlobeIcon() {
    return (
        <svg {...sw}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

function LayersIcon() {
    return (
        <svg {...sw}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    );
}

function KeyIcon() {
    return (
        <svg {...sw}>
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
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

function ShieldCheckIcon() {
    return (
        <svg {...sw}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
        </svg>
    );
}

// ─── Benefit types ────────────────────────────────────────────────────────────

interface Benefit {
    icon: React.ReactNode;
    headline: string;
    body: string;
}

// ─── Benefit row ─────────────────────────────────────────────────────────────

function BenefitRow({ benefit, delay }: { benefit: Benefit; delay: number }) {
    return (
        <FadeIn delay={delay}>
            <div className="flex gap-5 py-7 border-b border-border">
                <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg mt-0.5 bg-primary/10 text-primary">
                    {benefit.icon}
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
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-10 leading-tight">
            {children}
        </h2>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutUs() {
    // ── Learner benefits ──────────────────────────────────────────────────────

    const learnerBenefits: Benefit[] = [
        {
            icon: <BookIcon />,
            headline: 'You get structured courses that actually teach',
            body: 'Every course here is built in order. Each lesson prepares you for the next. Your mentor did not just upload files. They built a clear path from start to finish. When you follow it, you feel yourself getting better — step by step.',
        },
        {
            icon: <ZapIcon />,
            headline: 'You get your answer in seconds, not days',
            body: "Write your answer. Submit it. In seconds, you see your score and the reason for it. The AI grades your answer against your mentor's standard. If your work needs a human expert to review it, your mentor does that. You always know exactly where you stand.",
        },
        {
            icon: <BotIcon />,
            headline: 'You get an AI tutor that knows your course',
            body: 'The AI tutor knows which course you are in. It knows how far you have gone. It knows what you just read. Ask it any question — at any hour. It answers from your course material, not from random internet sources. It gives you hints when you are stuck. It explains things again when you do not understand.',
        },
        {
            icon: <IdCardIcon />,
            headline: 'You get a public portfolio that proves your skills',
            body: "When you finish a course, it goes into your public profile — at a real web address with your name. When a mentor reviews your work and approves it, that approval stays on your profile permanently. This is not a certificate anyone can print at home. It is a verified record of what you actually know. Send the link to an employer. Send it to a client. Let them see for themselves.",
        },
        {
            icon: <EyeIcon />,
            headline: 'You can read free lessons before you pay anything',
            body: 'Free lessons are open. No account needed. Read them. Watch them. Decide if the quality is worth your money. When you are ready, enroll and unlock everything — assessments, progress tracking, your portfolio. You only pay after you already know it is good.',
        },
        {
            icon: <GlobeIcon />,
            headline: 'You can learn in English or Bengali',
            body: 'The full platform — every page, every course — works in both English and Bengali. Learning hard topics is already difficult. The language of the platform should not make it harder.',
        },
    ];

    // ── Mentor benefits ───────────────────────────────────────────────────────

    const mentorBenefits: Benefit[] = [
        {
            icon: <BroadcastIcon />,
            headline: 'Your knowledge reaches learners at any time',
            body: 'You write your lesson once. A learner reads it at night after work. Another reads it in a different language. You do not need to repeat yourself. You focus on making the lesson excellent. The platform handles everything else.',
        },
        {
            icon: <CheckSquareIcon />,
            headline: 'Your grading standard stays consistent at any scale',
            body: 'You write the rubric — the rules for a good answer. The AI grades every open-ended answer against your rules, automatically. Simple tests never reach you. Only the complex assignments that need your judgment come to you for review. You stay involved where it matters.',
        },
        {
            icon: <AwardIcon />,
            headline: 'Your endorsement has real value',
            body: "When you approve a learner's assignment, your name is attached to their portfolio permanently. You do not approve automatically. You read the work and decide. Learners know this. They work harder because your approval means something real.",
        },
        {
            icon: <MessageIcon />,
            headline: 'Learners get help even when you are offline',
            body: 'AI members in the community forum answer course questions when you are not available. They know the course. They can explain and help. The questions that need a real expert still come to you — but you are not the only source of help anymore.',
        },
    ];

    // ── Admin benefits ────────────────────────────────────────────────────────

    const adminBenefits: Benefit[] = [
        {
            icon: <LayersIcon />,
            headline: 'You design exactly how learning works',
            body: 'Build courses from modules. Build modules from resources — written lessons, videos, reference links. Choose the order. Choose the depth. The learning path reflects your exact intention. Learners follow the path you designed.',
        },
        {
            icon: <KeyIcon />,
            headline: 'You control who sees what',
            body: 'Some content is free and open to everyone. Some content is for enrolled learners. Some content is for paid members only. Payment goes through PayPal — access unlocks automatically after payment is confirmed. You set the rules. The platform follows them.',
        },
        {
            icon: <RefreshIcon />,
            headline: 'The AI tutor stays accurate without any work from you',
            body: 'Every night, the platform automatically updates what the AI tutor knows. If you edit a lesson today, the AI will answer questions from the updated version by tomorrow. You do not press any buttons. It happens on its own.',
        },
        {
            icon: <ShieldCheckIcon />,
            headline: 'Human approval protects the quality of every portfolio',
            body: "No learner skill appears in their public portfolio without a mentor's approval first. Automated grading handles the volume. Human experts make the final decision on what counts as real competence. This is what keeps the platform credible — and keeps learners motivated to do their best work.",
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <PublicLayout hidePlatformChat>
            <Head title="About">
                <meta
                    name="description"
                    content="How this platform works — for learners, mentors, and administrators."
                />
            </Head>

            {/* ── Section 1: Learners ───────────────────────────────────────── */}
            <section className="border-b border-border py-20">
                <div className="mx-auto max-w-4xl px-5">
                    <FadeIn>
                        <SectionBadge label="For Learners" />
                        <div className="text-center">
                            <SectionHeadline>
                                Every step of learning automatically
                                creates a proof.
                                <br />
                                And shown as a public portfolio
                            </SectionHeadline>
                        </div>
                    </FadeIn>
                    {learnerBenefits.map((b, i) => (
                        <BenefitRow key={i} benefit={b} delay={i * 65} />
                    ))}
                </div>
            </section>

            {/* ── Section 2: Mentors ────────────────────────────────────────── */}
            <section className="border-b border-border bg-muted/30 py-20">
                <div className="mx-auto max-w-4xl px-5">
                    <FadeIn>
                        <SectionBadge label="For Mentors" />
                        <div className="text-center">
                            <SectionHeadline>
                                Teach once. Keep helping
                                <br />
                                learners long after.
                            </SectionHeadline>
                        </div>
                    </FadeIn>
                    {mentorBenefits.map((b, i) => (
                        <BenefitRow key={i} benefit={b} delay={i * 65} />
                    ))}
                </div>
            </section>

            {/* ── Section 3: Admins ─────────────────────────────────────────── */}
            <section className="py-20">
                <div className="mx-auto max-w-4xl px-5">
                    <FadeIn>
                        <SectionBadge label="For Administrators" />
                        <div className="text-center">
                            <SectionHeadline>
                                You build the experience
                                <br />
                                every learner remembers.
                            </SectionHeadline>
                        </div>
                    </FadeIn>
                    {adminBenefits.map((b, i) => (
                        <BenefitRow key={i} benefit={b} delay={i * 65} />
                    ))}
                </div>
            </section>
        </PublicLayout>
    );
}
