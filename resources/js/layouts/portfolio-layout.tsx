import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Mail, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
    id: number;
    name: string;
    slug: string;
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
    children: React.ReactNode;
    owner: Owner;
    portfolio: Portfolio;
    categories?: Category[];
    activeCategory?: Category | null;
    onContactClick?: () => void;
}

const SERVICE_GRADIENTS = [
    'from-yellow-50 to-orange-50 border-yellow-100',
    'from-blue-50 to-indigo-50 border-indigo-100',
    'from-purple-50 to-fuchsia-50 border-purple-100',
    'from-green-50 to-emerald-50 border-green-100',
    'from-cyan-50 to-sky-50 border-cyan-100',
    'from-pink-50 to-rose-50 border-pink-100',
    'from-lime-50 to-yellow-50 border-lime-100',
    'from-amber-50 to-orange-50 border-amber-100',
    'from-teal-50 to-green-50 border-teal-100',
];

export default function PortfolioLayout({ children, owner, portfolio, categories = [], activeCategory, onContactClick }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);
    const [mobileOpen, setMobileOpen] = useState(false);
    const portfolioUrl = `/${l}/u/${owner.username}/portfolio`;

    // Hide Google Translate globe on portfolio pages
    useEffect(() => {
        const el = document.getElementById('gt_wrapper');
        if (el) {
            el.style.display = 'none';
        }
        return () => {
            if (el) {
                el.style.display = '';
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top navbar — black */}
            <nav className="fixed top-0 right-0 left-0 z-50 bg-black text-white shadow-lg">
                <div className="container px-4">
                    <div className="flex h-16 items-center justify-between">
                        {/* Brand */}
                        <Link href={portfolioUrl} className="whitespace-nowrap text-lg font-semibold">
                            <span className="text-zinc-200">Portfolio of</span>{' '}
                            <span className="italic text-white">{owner.name}</span>
                        </Link>

                        {/* Desktop category nav */}
                        <div className="portfolio-nav-menu hidden items-center md:flex">
                            <Link
                                href={portfolioUrl}
                                className={cn(
                                    'px-3 py-2 text-sm font-medium transition-all',
                                    !activeCategory ? 'text-blue-400' : 'text-zinc-300 hover:text-blue-400',
                                )}
                            >
                                All
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`${portfolioUrl}?category=${cat.slug}`}
                                    className={cn(
                                        'px-3 py-2 text-sm font-medium transition-all',
                                        activeCategory?.slug === cat.slug
                                            ? 'text-blue-400'
                                            : 'text-zinc-300 hover:text-blue-400',
                                    )}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile hamburger */}
                        <button className="flex items-center justify-center p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile drawer backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Mobile drawer (left) */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="space-y-6 p-6">
                    {/* Avatar */}
                    {owner.avatar && (
                        <div className="flex justify-center">
                            <img
                                src={owner.avatar}
                                alt={owner.name}
                                className="h-24 w-24 rounded-full border-4 border-gray-100 object-cover shadow-md"
                            />
                        </div>
                    )}

                    {/* Name & headline */}
                    <div className="text-center">
                        <h2 className="mb-1 text-xl font-bold text-gray-900">{owner.name}</h2>
                        {owner.headline && (
                            <p className="text-sm leading-relaxed text-gray-600">{owner.headline}</p>
                        )}
                    </div>

                    {/* Bio + Secondary bio */}
                    {(portfolio.bio || portfolio.secondary_bio) && (
                        <div className="border-t border-gray-200 pt-4 text-center">
                            {portfolio.bio && (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-500">{portfolio.bio}</p>
                            )}
                            {portfolio.secondary_bio && (
                                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-400">{portfolio.secondary_bio}</p>
                            )}
                        </div>
                    )}

                    {/* Contact button */}
                    {onContactClick && (
                        <div className="text-center">
                            <button onClick={() => { onContactClick(); setMobileOpen(false); }} className="portfolio-btn portfolio-btn-contact">
                                <Mail className="mr-2 inline-block h-4 w-4" /> Contact Me
                            </button>
                        </div>
                    )}

                    {/* Skills */}
                    {portfolio.skill_tags && portfolio.skill_tags.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <div className="mb-3 bg-black px-3 py-2 text-sm font-semibold text-white">Skills</div>
                            <div className="flex flex-wrap gap-2">
                                {portfolio.skill_tags.map((tag) => (
                                    <span key={tag.id} className="portfolio-skill-tag rounded-full px-3 py-1 text-xs font-medium text-white">
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    {portfolio.services && portfolio.services.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <div className="mb-3 bg-black px-3 py-2 text-sm font-semibold text-white">Services</div>
                            <div className="flex flex-col gap-2 text-sm">
                                {portfolio.services.map((service, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'rounded-lg border bg-gradient-to-r px-3 py-2 text-gray-800',
                                            SERVICE_GRADIENTS[i % SERVICE_GRADIENTS.length],
                                        )}
                                    >
                                        <span className="font-bold">{service.headline}</span>
                                        {service.description && (
                                            <p className="mt-0.5 text-xs text-gray-600">{service.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hire Me button */}
                    {onContactClick && (
                        <div className="text-center">
                            <button onClick={() => { onContactClick(); setMobileOpen(false); }} className="portfolio-btn portfolio-btn-hire">
                                Hire Me
                            </button>
                        </div>
                    )}

                    {/* Category nav — least priority, at bottom */}
                    {categories.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Categories</div>
                            <Link
                                href={portfolioUrl}
                                className={cn('block rounded-md px-3 py-2 text-sm font-medium transition-colors', !activeCategory ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50')}
                                onClick={() => setMobileOpen(false)}
                            >
                                All Projects
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`${portfolioUrl}?category=${cat.slug}`}
                                    className={cn('block rounded-md px-3 py-2 text-sm font-medium transition-colors', activeCategory?.slug === cat.slug ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50')}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main layout */}
            <div className="flex pt-16">
                {/* Left sidebar (desktop only) */}
                <aside className="hidden h-[calc(100vh-4rem)] w-80 shrink-0 overflow-y-auto border-r border-gray-200 bg-white md:fixed md:block">
                    <div className="space-y-6 p-6">
                        {/* Avatar */}
                        {owner.avatar && (
                            <div className="flex justify-center">
                                <img
                                    src={owner.avatar}
                                    alt={owner.name}
                                    className="h-32 w-32 rounded-full border-4 border-gray-100 object-cover shadow-md"
                                />
                            </div>
                        )}

                        {/* Name & headline */}
                        <div className="text-center text-lg">
                            <h2 className="mb-2 text-2xl font-bold text-gray-900">{owner.name}</h2>
                            {owner.headline && (
                                <p className="leading-relaxed text-gray-600">{owner.headline}</p>
                            )}
                        </div>

                        {/* Bio + Secondary bio */}
                        {(portfolio.bio || portfolio.secondary_bio) && (
                            <div className="border-t border-gray-200 pt-4 text-center">
                                {portfolio.bio && (
                                    <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-900">{portfolio.bio}</p>
                                )}
                                {portfolio.secondary_bio && (
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{portfolio.secondary_bio}</p>
                                )}
                            </div>
                        )}

                        {/* Contact button */}
                        {onContactClick && (
                            <div className="text-center">
                                <button onClick={onContactClick} className="portfolio-btn portfolio-btn-contact">
                                    <Mail className="mr-2 inline-block h-4 w-4" /> Contact Me
                                </button>
                            </div>
                        )}

                        {/* Skills */}
                        {portfolio.skill_tags && portfolio.skill_tags.length > 0 && (
                            <div className="border-t border-gray-200 pt-4">
                                <div className="mb-3 bg-black px-3 py-2 text-sm font-semibold text-white">
                                    Skills
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {portfolio.skill_tags.map((tag) => (
                                        <span key={tag.id} className="portfolio-skill-tag rounded-full px-3 py-1 text-xs font-medium text-white">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Services */}
                        {portfolio.services && portfolio.services.length > 0 && (
                            <div className="border-t border-gray-200 pt-4">
                                <div className="mb-3 bg-black px-3 py-2 text-sm font-semibold text-white">
                                    Services
                                </div>
                                <div className="flex flex-col gap-2 text-sm">
                                    {portfolio.services.map((service, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'cursor-default rounded-lg border bg-gradient-to-r px-3 py-2 text-gray-800 transition-all hover:-translate-y-0.5 hover:shadow-md',
                                                SERVICE_GRADIENTS[i % SERVICE_GRADIENTS.length],
                                            )}
                                        >
                                            <span className="font-bold">{service.headline}</span>
                                            {service.description && (
                                                <p className="mt-1 text-xs text-gray-600">{service.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hire Me button */}
                        {onContactClick && (
                            <div className="pb-4 text-center">
                                <button onClick={onContactClick} className="portfolio-btn portfolio-btn-hire">
                                    Hire Me
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main content */}
                <main className="min-w-0 flex-1 p-4 md:ml-80 md:p-8">
                    <div className="container mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer className="border-t bg-white py-6 text-center text-xs text-gray-400 md:ml-80">
                {/* &copy; {new Date().getFullYear()} {owner.name} */}
            </footer>
        </div>
    );
}
