import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
    meta_description: string | null;
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
    project: Project;
    categories: Category[];
    showSidebar: boolean;
}

function excerpt(html: string, len = 160): string {
    const plain = html.replace(/<[^>]*>/g, '');
    return plain.length > len ? plain.slice(0, len) + '...' : plain;
}

function lazyLoadImages(html: string): string {
    return html.replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"');
}


function ContactModal({ open, onClose, username }: { open: boolean; onClose: () => void; username: string }) {
    const { locale } = usePage().props;
    const l = String(locale);
    const form = useForm({ sender_name: '', sender_email: '', subject: '', body: '', honeypot: '' });
    const [sent, setSent] = useState(false);

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/${l}/u/${username}/portfolio/contact`, { onSuccess: () => setSent(true) });
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
                        <p className="text-lg font-semibold text-green-600">Message received !</p>
                        <p>I will contact you soon - via email</p>
                        <Button className="mt-4" onClick={onClose}>Close</Button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <input type="text" name="honeypot" value={form.data.honeypot} onChange={(e) => form.setData('honeypot', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
                        <div>
                            <Label htmlFor="sender_name" className="text-sm font-semibold text-gray-700">Your Name *</Label>
                            <Input id="sender_name" value={form.data.sender_name} onChange={(e) => form.setData('sender_name', e.target.value)} required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="sender_email" className="text-sm font-semibold text-gray-700">Email *</Label>
                            <Input id="sender_email" type="email" value={form.data.sender_email} onChange={(e) => form.setData('sender_email', e.target.value)} required className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">Subject</Label>
                            <Input id="subject" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="body" className="text-sm font-semibold text-gray-700">Message *</Label>
                            <textarea id="body" className="mt-1 w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" rows={4} value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} required />
                        </div>
                        <button type="submit" disabled={form.processing} className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 font-semibold text-white transition-all hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg disabled:opacity-50">
                            {form.processing ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function PortfolioProjectPage({ owner, portfolio, project, categories, showSidebar }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);
    const [contactOpen, setContactOpen] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);

    const metaDesc = project.meta_description || excerpt(project.description);
    const ogImage = project.featured_image || (project.media.find((m) => m.type === 'image')?.url) || owner.avatar;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.title,
        description: metaDesc,
        author: { '@type': 'Person', name: owner.name },
        ...(ogImage ? { image: ogImage } : {}),
        ...(project.external_url ? { url: project.external_url } : {}),
    };

    // Build unified carousel: featured_image first, then media in order (dedup images vs featured)
    const allSlides: { id: number; type: 'image' | 'youtube'; url: string }[] = [];
    if (project.featured_image) {
        allSlides.push({ id: -1, type: 'image', url: project.featured_image });
    }
    project.media.forEach((m) => {
        if (m.url !== project.featured_image) {
            allSlides.push(m);
        }
    });
    const slideCount = allSlides.length;

    function prevSlide() {
        setSlideIndex((i) => (i === 0 ? slideCount - 1 : i - 1));
    }
    function nextSlide() {
        setSlideIndex((i) => (i === slideCount - 1 ? 0 : i + 1));
    }

    return (
        <PortfolioLayout
            owner={owner}
            portfolio={portfolio}
            categories={categories}
            onContactClick={() => setContactOpen(true)}
            showSidebar={showSidebar}
        >
            <Head>
                <title>{`${project.title} — ${owner.name}`}</title>
                <meta name="description" content={metaDesc} />
                <meta property="og:title" content={project.title} />
                <meta property="og:description" content={metaDesc} />
                {ogImage && <meta property="og:image" content={ogImage} />}
                <link rel="canonical" href={`${window.location.origin}/${l}/u/${owner.username}/portfolio/${project.slug}`} />
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>

            {/* Floating back button */}
            {/* <div className="mb-8">
                <Link
                    href={`/${l}/u/${owner.username}/portfolio`}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
                >
                    <ArrowLeft className="h-5 w-5" />
                    All Projects
                </Link>
            </div> */}

            {/* Project title */}
            <h1 className="mb-16 text-center text-4xl font-black text-blue-700 md:text-5xl">
                {project.title}
            </h1>

            {/* Unified media carousel */}
            {slideCount > 0 && (
                <div className="group relative mx-auto mb-16 max-w-[700px]">
                    <div className="overflow-hidden rounded-2xl bg-gray-900 shadow-2xl">
                        <div className="aspect-video">
                            {/* Sliding strip */}
                            <div
                                className="flex h-full"
                                style={{
                                    width: `${slideCount * 100}%`,
                                    transform: `translateX(${-(slideIndex * 100) / slideCount}%)`,
                                    transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                }}
                            >
                                {allSlides.map((slide, i) => (
                                    <div key={slide.id} className="h-full flex-shrink-0" style={{ width: `${100 / slideCount}%` }}>
                                        {slide.type === 'image' ? (
                                            <img
                                                src={slide.url}
                                                alt={project.title}
                                                loading={i === 0 ? 'eager' : 'lazy'}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <iframe src={slide.url} className="h-full w-full" allowFullScreen title="video" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {slideCount > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all duration-300 hover:bg-black/70 group-hover:opacity-100"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-all duration-300 hover:bg-black/70 group-hover:opacity-100"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <div className="mt-3 flex justify-center gap-2">
                                {allSlides.map((slide, i) => (
                                    <button
                                        key={slide.id}
                                        onClick={() => setSlideIndex(i)}
                                        className={`rounded-full transition-all duration-300 ${i === slideIndex ? 'h-2 w-4 bg-blue-600' : 'h-2 w-2 bg-gray-300 hover:bg-gray-400'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Description */}
            <div className="mb-16 rounded-3xl bg-white p-4 md:p-8 shadow-xl md:p-12">
                <h3 className="mb-6 text-center text-2xl font-bold text-gray-800 md:text-3xl">About This Project</h3>
                <div className="prose prose-lg max-w-none text-gray-700 md:prose-xl" dangerouslySetInnerHTML={{ __html: lazyLoadImages(project.description) }} />
            </div>

            {/* CTA section */}
            <div
                className="rounded-3xl p-4 text-center text-white shadow-2xl md:p-12"
                style={{
                    background: 'linear-gradient(135deg, #1a6dff 0%, #0a3cff 30%, #6a0dff 70%, #a020f0 100%)',
                    boxShadow: '0 20px 60px rgba(26, 109, 255, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                }}
            >
                <h2 className="mb-6 text-3xl font-bold md:text-5xl">Want to work with me ?</h2>
                <p className="mb-8 text-xl opacity-90 md:text-2xl">I will be happy to help you</p>
                <button
                    onClick={() => setContactOpen(true)}
                    className="inline-block transform rounded-full bg-white px-10 py-4 text-lg font-bold text-purple-600 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                    Talk to Me
                </button>
            </div>

            <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} username={owner.username} />
        </PortfolioLayout>
    );
}
