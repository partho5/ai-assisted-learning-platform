import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';

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

function MailIcon() {
    return (
        <svg {...sw}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

export default function Contact() {
    const email = import.meta.env.VITE_CONTACT_EMAIL;

    const topics = [
        { label: 'General support', detail: 'Questions about the platform, your account, or courses.' },
        { label: 'Refunds & billing', detail: 'Refund requests, platform credit, and payment queries.' },
        { label: 'Privacy & data', detail: 'Data access, correction, deletion, and privacy concerns.' },
        { label: 'Legal', detail: 'Terms of service, intellectual property, and legal notices.' },
    ];

    return (
        <PublicLayout hidePlatformChat>
            <Head title="Contact Us">
                <meta
                    name="description"
                    content="Contact the SkillEvidence team — support, billing, privacy, or legal queries."
                />
                <meta name="robots" content="index, follow" />
            </Head>

            <section className="mx-auto max-w-2xl px-5 py-20">
                {/* Header */}
                <div className="mb-12 text-center">
                    <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                        Get in Touch
                    </div>
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">Contact Us</h1>
                    <p className="mx-auto max-w-md text-base text-muted-foreground">
                        One inbox, every question. We try to respond within 1–2 business days.
                    </p>
                </div>

                {/* Single email card */}
                <a
                    href={`mailto:${email}`}
                    className="group mb-10 flex items-center gap-5 rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <MailIcon />
                    </div>
                    <div>
                        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email us</p>
                        <p className="text-lg font-semibold text-foreground">{email}</p>
                    </div>
                </a>

                {/* Topics */}
                <div className="rounded-xl border border-border bg-muted/40 px-6 py-5">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground">We can help with</p>
                    <ul className="space-y-3">
                        {topics.map((t) => (
                            <li key={t.label} className="flex gap-3 text-sm">
                                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 translate-y-1.5 rounded-full bg-primary" />
                                <span>
                                    <span className="font-medium text-foreground">{t.label}</span>
                                    {' — '}
                                    <span className="text-muted-foreground">{t.detail}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </PublicLayout>
    );
}
