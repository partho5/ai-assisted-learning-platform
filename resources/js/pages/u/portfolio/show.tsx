import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { ChevronLeft, ChevronRight, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PortfolioLayout from '@/layouts/portfolio-layout';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface MediaItem {
    id: number;
    type: 'image' | 'youtube';
    url: string;
}

interface Project {
    id: number;
    title: string;
    slug: string;
    description: string;
    featured_image: string | null;
    external_url: string | null;
    tech_tags: string[] | null;
    category: Category | null;
    media: MediaItem[];
}

interface Owner {
    name: string;
    username: string;
    avatar: string | null;
    headline: string | null;
}

interface Portfolio {
    id: number;
    bio: string | null;
    secondary_bio: string | null;
    services: { headline: string; description?: string }[] | null;
    skill_tags?: { id: number; name: string }[];
}

interface Props {
    owner: Owner;
    portfolio: Portfolio;
    projects: Project[];
    categories: Category[];
    activeCategory: Category | null;
}

function MediaCarousel({ media, featured_image }: { media: MediaItem[]; featured_image: string | null }) {
    const items: MediaItem[] = [];
    if (featured_image) {
        items.push({ id: -1, type: 'image' as const, url: featured_image });
    }
    media.forEach((m) => {
        if (m.url !== featured_image) {
            items.push(m);
        }
    });

    const [current, setCurrent] = useState(0);
    const n = items.length;
    const isCarousel = n > 1;

    if (n === 0) {
        return (
            <div className="flex aspect-video items-center justify-center bg-gray-200">
                <span className="text-2xl text-gray-400">No media</span>
            </div>
        );
    }

    return (
        <div className={`portfolio-image-container${isCarousel ? ' is-carousel' : ''} group relative aspect-video overflow-hidden bg-gray-200`}>
            {/* Sliding strip */}
            <div
                className="flex h-full"
                style={{
                    width: `${n * 100}%`,
                    transform: `translateX(${-(current * 100) / n}%)`,
                    transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
            >
                {items.map((it) => (
                    <div key={it.id} className="h-full flex-shrink-0" style={{ width: `${100 / n}%` }}>
                        {it.type === 'image' ? (
                            <img src={it.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <iframe src={it.url} className="h-full w-full" allowFullScreen title="video" />
                        )}
                    </div>
                ))}
            </div>

            {isCarousel && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent((c) => (c - 1 + n) % n); }}
                        className="portfolio-slideshow-arrow absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent((c) => (c + 1) % n); }}
                        className="portfolio-slideshow-arrow absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
                                className={`rounded-full transition-all duration-300 ${i === current ? 'h-2 w-4 bg-white' : 'h-2 w-2 bg-white/50 hover:bg-white/80'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function excerpt(html: string, len = 200): string {
    const plain = html.replace(/<[^>]*>/g, '');
    return plain.length > len ? plain.slice(0, len) : plain;
}

function ContactModal({ open, onClose, username }: { open: boolean; onClose: () => void; username: string }) {
    const { locale } = usePage().props;
    const l = String(locale);
    const form = useForm({ sender_name: '', sender_email: '', subject: '', body: '', honeypot: '' });
    const [sent, setSent] = useState(false);

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/${l}/u/${username}/portfolio/contact`, {
            onSuccess: () => setSent(true),
        });
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Contact Me</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
                </div>

                {sent ? (
                    <div className="py-8 text-center">
                        <p className="text-lg font-semibold text-green-600">Message received!</p>
                        <p className="mt-2 text-sm text-gray-500">I will get back to you via email.</p>
                        <Button className="mt-4" onClick={onClose}>Close</Button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <input type="text" name="honeypot" value={form.data.honeypot} onChange={(e) => form.setData('honeypot', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

                        <div>
                            <Label htmlFor="sender_name" className="text-sm font-semibold text-gray-700">Your Name *</Label>
                            <Input id="sender_name" value={form.data.sender_name} onChange={(e) => form.setData('sender_name', e.target.value)} required className="mt-1" placeholder="Name please" />
                            {form.errors.sender_name && <p className="mt-1 text-xs text-red-500">{form.errors.sender_name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="sender_email" className="text-sm font-semibold text-gray-700">Email *</Label>
                            <Input id="sender_email" type="email" value={form.data.sender_email} onChange={(e) => form.setData('sender_email', e.target.value)} required className="mt-1" placeholder="Email that you mostly use" />
                            {form.errors.sender_email && <p className="mt-1 text-xs text-red-500">{form.errors.sender_email}</p>}
                        </div>
                        <div>
                            <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">Subject</Label>
                            <Input id="subject" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="body" className="text-sm font-semibold text-gray-700">Message *</Label>
                            <textarea
                                id="body"
                                className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                rows={4}
                                value={form.data.body}
                                onChange={(e) => form.setData('body', e.target.value)}
                                required
                                placeholder="Don't hesitate to elaborate..."
                            />
                            {form.errors.body && <p className="mt-1 text-xs text-red-500">{form.errors.body}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 font-semibold text-white transition-all hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:opacity-50"
                        >
                            {form.processing ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function PortfolioShow({ owner, portfolio, projects, categories, activeCategory }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);
    const [contactOpen, setContactOpen] = useState(false);

    const pageTitle = `${owner.name}'s Portfolio`;
    const pageDescription = portfolio.bio ? portfolio.bio.slice(0, 160) : `Portfolio of ${owner.name}`;

    return (
        <PortfolioLayout
            owner={owner}
            portfolio={portfolio}
            categories={categories}
            activeCategory={activeCategory}
            onContactClick={() => setContactOpen(true)}
        >
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                {owner.avatar && <meta property="og:image" content={owner.avatar} />}
                <link rel="canonical" href={`${window.location.origin}/${l}/u/${owner.username}/portfolio`} />
            </Head>

            <h1 className="mb-8 text-center text-3xl font-bold text-blue-600">Some of My Projects</h1>

            {projects.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                    <p className="text-lg">No projects to show yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/${l}/u/${owner.username}/portfolio/${project.slug}`}
                            className="portfolio-project-card overflow-hidden rounded-lg bg-white shadow-md"
                        >
                            <div className="relative">
                                <MediaCarousel media={project.media} featured_image={project.featured_image} />
                            </div>
                            <div className="p-5">
                                <h3 className="portfolio-project-title mb-2 text-xl font-semibold text-blue-600 transition-all hover:text-blue-900 hover:underline">
                                    {project.title}
                                </h3>
                                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                                    {excerpt(project.description)}
                                    <span className="text-blue-600">....<small>more</small></span>
                                </p>
                                {project.category && (
                                    <div className="mt-3">
                                        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                                            {project.category.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} username={owner.username} />
        </PortfolioLayout>
    );
}
