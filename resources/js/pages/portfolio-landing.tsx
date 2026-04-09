import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ExternalLink,
    FileText,
    FolderOpen,
    Globe,
    Image,
    Layout,
    ListFilter,
    Mail,
    Palette,
    PenLine,
    Share2,
    Smartphone,
    Tag,
    ToggleRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

const spinLabels = ['Free', 'No condition'];

function SpinBadge() {
    const [index, setIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setIndex((i) => (i + 1) % spinLabels.length);
                setVisible(true);
            }, 300);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span
            className="absolute -right-3 -top-4 z-10 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
        >
            {spinLabels[index]}
        </span>
    );
}

export default function PortfolioLanding() {
    const { auth, locale } = usePage().props;
    const l = String(locale || 'en');
    const ctaHref = auth?.user ? `/${l}/dashboard/portfolio-builder` : `/register`;
    const ctaLabel = auth?.user ? 'My Portfolio Builder' : 'Create My Portfolio';

    const coreFeatures = [
        {
            icon: FolderOpen,
            title: 'Project Showcase',
            desc: 'Show every project with detailed descriptions, featured images, and a media gallery. Each project has its own page.',
        },
        {
            icon: Image,
            title: 'Image & Video Gallery',
            desc: 'Add multiple images and YouTube videos to each project. Visitors can browse your work with a built-in image slider.',
        },
        {
            icon: Mail,
            title: 'Built-in Contact Form',
            desc: 'Visitors can send you messages directly from your portfolio. You receive every message in your dashboard and by email.',
        },
        {
            icon: BarChart3,
            title: 'Visitor Analytics',
            desc: 'See how many people visit your portfolio, which projects they view the most, where they come from, and a 30-day chart.',
        },
        {
            icon: ListFilter,
            title: 'Project Categories',
            desc: 'Group your projects by category. Visitors can filter by what interests them — web apps, mobile, design, or anything you create.',
        },
        {
            icon: Tag,
            title: 'Tech & Skill Tags',
            desc: 'Add technology tags to every project. Your skill tags also appear on your profile so visitors quickly see your expertise.',
        },
        {
            icon: PenLine,
            title: 'Rich Text Editor',
            desc: 'Write project descriptions with headings, bold, italic, colors, code blocks, and links. Full formatting, not just plain text.',
        },
        {
            icon: Palette,
            title: 'Services Section',
            desc: 'List the services you offer with a headline and description for each. Visitors immediately see what you can do for them.',
        },
        {
            icon: FileText,
            title: 'Bio & About You',
            desc: 'Write a primary bio and a secondary bio. Introduce yourself clearly so visitors understand who you are and what you do.',
        },
        {
            icon: Globe,
            title: 'SEO-Optimized Pages',
            desc: 'Every project page has its own meta description and clean URL. Search engines can find your work and show it to new visitors.',
        },
        {
            icon: ExternalLink,
            title: 'External Project Links',
            desc: 'Add a link to the live website, GitHub repository, or demo for each project. Visitors go directly from your portfolio to the real project.',
        },
        {
            icon: ToggleRight,
            title: 'Publish & Draft Control',
            desc: 'Switch individual projects or your entire portfolio between published and draft. Show only what you are ready to show.',
        },
        {
            icon: Share2,
            title: 'Shareable Portfolio Link',
            desc: 'You get a clean, easy-to-remember URL for your portfolio. Share it on LinkedIn, in your resume, or in your email signature.',
        },
        {
            icon: Smartphone,
            title: 'Mobile-Friendly Design',
            desc: 'Your portfolio looks professional on phones, tablets, and computers. The layout adjusts automatically to every screen size.',
        },
        {
            icon: Layout,
            title: 'Dedicated Project Pages',
            desc: 'Each project has a full page with all its media, description, tech tags, and links. Not just a small card in a grid.',
        },
    ];

    const steps = [
        { step: '1', title: 'Set Up Your Profile', desc: 'Add your bio, skills, and services. Takes two minutes.' },
        { step: '2', title: 'Add Your Projects', desc: 'Upload images, write descriptions, embed videos, tag technologies.' },
        { step: '3', title: 'Publish & Share', desc: 'Hit publish. Share your portfolio link with the world.' },
    ];

    const comparisonPoints = [
        'Unlimited projects',
        'Built-in analytics',
        'Contact form & inbox',
        'SEO-optimized pages',
        'Rich text editor',
        'Image & video galleries',
        'No watermarks',
        'No "Built with..." branding',
    ];

    return (
        <PublicLayout hideFooter={false} hidePlatformChat>
            <Head>
                <title>Free Portfolio Builder — Showcase Your Work | SkillEvidence</title>
                <meta
                    name="description"
                    content="Build your professional portfolio for free. This portfolio builder includes project showcase, media galleries, visitor analytics, contact form, SEO-optimized pages, and more. No hidden costs."
                />
                <meta property="og:title" content="Free Portfolio Builder — SkillEvidence" />
                <meta
                    property="og:description"
                    content="A free portfolio builder with project galleries, analytics, contact form, and SEO. Always free, no hidden costs."
                />
            </Head>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-gray-950 px-4 py-24 text-center sm:py-36">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.25),transparent)]" />
                <div className="relative mx-auto max-w-3xl">
                    <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-400">
                        Free Portfolio Builder
                    </p>
                    <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Build a Professional Portfolio. <br className="hidden sm:block" />
                    </h1>
                    <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-gray-400">
                        A free portfolio builder with project galleries, visitor analytics, built-in contact form, and SEO-optimized pages.
                        Everything included. No coding needed. Free forever.
                    </p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link href={ctaHref} className="relative inline-block">
                            <SpinBadge />
                            <Button variant="hero" size="hero">
                                {ctaLabel} <ArrowRight className="ml-1 h-5 w-5" />
                            </Button>
                        </Link>
                        <a href="#features">
                            <Button variant="secondary" size="lg" className="border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-900 hover:text-white">
                                See All Features
                            </Button>
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Problem ── */}
            <section className="border-b bg-gray-50 px-4 py-16 text-center dark:bg-gray-900">
                <div className="mx-auto max-w-2xl">
                    <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
                        Most Portfolios Are Missing the Important Parts
                    </h2>
                    <p className="text-base leading-relaxed text-muted-foreground">
                        A simple page with some images is not enough. You need analytics to see who visits, a contact form so clients can reach you,
                        and SEO so search engines can find your work. This portfolio builder includes all of that.
                    </p>
                </div>
            </section>

            {/* ── Features Grid ── */}
            <section id="features" className="mx-auto max-w-6xl px-4 py-20">
                <div className="mb-14 text-center">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">What You Get</p>
                    <h2 className="text-3xl font-bold sm:text-4xl">
                        All the Features Your Portfolio Builder Needs
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                        This is not a limited free plan. Every feature of the portfolio builder is available to every user, with no paywall.
                    </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {coreFeatures.map((f) => (
                        <div
                            key={f.title}
                            className="group rounded-xl border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <f.icon className="h-5 w-5" />
                            </div>
                            <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Portfolio Preview Mock ── */}
            <section className="bg-muted/40 px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">This Is What Your Portfolio Looks Like</h2>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            A clean, professional layout. Your bio and skills on the left. Your projects in a grid with image sliders.
                            A contact button always visible for visitors.
                        </p>
                    </div>
                    <div className="overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-gray-950">
                        {/* Browser chrome */}
                        <div className="flex items-center gap-2 border-b bg-gray-100 px-4 py-3 dark:bg-gray-900">
                            <div className="h-3 w-3 rounded-full bg-red-400" />
                            <div className="h-3 w-3 rounded-full bg-yellow-400" />
                            <div className="h-3 w-3 rounded-full bg-green-400" />
                            <div className="ml-4 rounded-md bg-white px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                skillevidence.com/u/yourname/portfolio
                            </div>
                        </div>
                        {/* Mock layout */}
                        <div className="flex min-h-[340px]">
                            {/* Sidebar */}
                            <div className="hidden w-56 border-r bg-gray-50 p-5 dark:bg-gray-900/50 md:block">
                                <div className="mb-3 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                                <div className="mb-1 h-3.5 w-28 rounded bg-gray-300 dark:bg-gray-700" />
                                <div className="mb-4 h-2.5 w-36 rounded bg-gray-200 dark:bg-gray-800" />
                                <div className="mb-2 h-2 w-full rounded bg-gray-200 dark:bg-gray-800" />
                                <div className="mb-4 h-2 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                    {['React', 'Laravel', 'Node', 'Figma', 'AWS'].map((t) => (
                                        <span key={t} className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 h-8 w-full rounded-md bg-indigo-500" />
                            </div>
                            {/* Project grid */}
                            <div className="grid flex-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    { gradient: 'from-indigo-400 to-blue-500', label: 'E-commerce App' },
                                    { gradient: 'from-emerald-400 to-teal-500', label: 'SaaS Dashboard' },
                                    { gradient: 'from-orange-400 to-rose-500', label: 'Mobile App' },
                                ].map((p) => (
                                    <div key={p.label} className="overflow-hidden rounded-lg border shadow-sm">
                                        <div className={`aspect-video bg-gradient-to-br ${p.gradient} opacity-80`} />
                                        <div className="p-3">
                                            <div className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">{p.label}</div>
                                            <div className="mb-1 h-2 w-full rounded bg-gray-200 dark:bg-gray-800" />
                                            <div className="h-2 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                                            <div className="mt-2 flex gap-1">
                                                {['React', 'Node'].map((t) => (
                                                    <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="mx-auto max-w-4xl px-4 py-20">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold">Build Your Portfolio in Three Steps</h2>
                    <p className="mt-3 text-muted-foreground">No complicated setup. No coding. Just add your information and your projects.</p>
                </div>
                <div className="grid gap-8 sm:grid-cols-3">
                    {steps.map((s) => (
                        <div key={s.step} className="text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                                {s.step}
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Free vs Others ── */}
            <section className="border-y bg-gray-950 px-4 py-20 text-center">
                <div className="mx-auto max-w-2xl">
                    <h2 className="mb-3 text-3xl font-bold text-white">Completely Free. No Hidden Costs.</h2>
                    <p className="mb-10 text-gray-400">
                        Other portfolio builders limit their free plan and charge $12–$25 per month for the important features.
                        This portfolio builder gives you all features for free. No upgrade required. No trial period.
                    </p>
                    <div className="mx-auto grid max-w-md gap-3 text-left">
                        {comparisonPoints.map((point) => (
                            <div key={point} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                                <span className="text-sm text-gray-200">{point}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-8 text-xs text-gray-500">$0/month. No credit card. No trial. No catch.</p>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="px-4 py-24 text-center">
                <div className="mx-auto max-w-2xl">
                    <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                        Ready to Build Your Portfolio?
                    </h2>
                    <p className="mx-auto mb-10 max-w-md text-muted-foreground">
                        Create your professional portfolio in minutes. Add your projects, publish, and share it with the world.
                        It is free and always will be.
                    </p>
                    <Link href={ctaHref} className="relative inline-block">
                        <SpinBadge />
                        <Button variant="hero" size="hero">
                            {ctaLabel} <ArrowRight className="ml-1 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>
        </PublicLayout>
    );
}
