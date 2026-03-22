import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { index as forumIndex } from '@/actions/App/Http/Controllers/Forum/ForumController';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThreadCard from '@/components/forum/thread-card';
import AppLayout from '@/layouts/app-layout';
import PublicLayout from '@/layouts/public-layout';
import type { ForumCategory, ForumThread, Paginated, User } from '@/types';

interface Props {
    threads: Paginated<ForumThread> | [];
    categories: Pick<ForumCategory, 'id' | 'name' | 'slug'>[];
    filters: { q?: string; category?: string; resolved?: string };
}

export default function ForumSearch({ threads, categories, filters }: Props) {
    const { auth, locale } = usePage().props as { auth: { user: User | null }; locale: string };
    const l = String(locale);

    const [q, setQ] = useState(filters.q ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [resolved, setResolved] = useState(filters.resolved ?? '');

    const Layout = auth?.user ? AppLayout : PublicLayout;

    function search(e: React.FormEvent) {
        e.preventDefault();
        router.get(`/${l}/forum/search`, { q, category, resolved }, { preserveState: true, replace: true });
    }

    const threadsList = Array.isArray(threads) ? [] : threads.data;
    const paginatedThreads = Array.isArray(threads) ? null : threads;

    return (
        <Layout>
            <Head title="Search Forum — SkillEvidence" />

            <div className="mx-0 max-w-7xl px-4 py-8 md:mx-auto">
                <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
                    <Link href={forumIndex.url(l)} className="hover:underline">Forum</Link>
                    <span>›</span>
                    <span className="text-foreground font-medium">Search</span>
                </nav>

                <h1 className="text-2xl font-bold mb-6">Search Forum</h1>

                {/* Search form */}
                <form onSubmit={search} className="flex gap-3 flex-wrap mb-8">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search threads..."
                            className="pl-9"
                        />
                    </div>

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={resolved}
                        onChange={(e) => setResolved(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Any status</option>
                        <option value="true">Resolved</option>
                        <option value="false">Unresolved</option>
                    </select>

                    <Button type="submit">Search</Button>
                </form>

                {/* Results */}
                {q && (
                    <p className="text-sm text-muted-foreground mb-4">
                        {paginatedThreads ? `${paginatedThreads.total} result${paginatedThreads.total !== 1 ? 's' : ''}` : 'No results'} for &ldquo;{q}&rdquo;
                    </p>
                )}

                <div>
                    {threadsList.map((thread) => (
                        <ThreadCard key={thread.id} thread={thread} locale={l} showCategory />
                    ))}

                    {q && threadsList.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No threads found matching &ldquo;{q}&rdquo;.
                        </div>
                    )}

                    {!q && (
                        <div className="text-center py-12 text-muted-foreground">
                            Enter a search term above to find threads.
                        </div>
                    )}
                </div>

                {paginatedThreads && paginatedThreads.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {paginatedThreads.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveState
                                className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : link.url
                                          ? 'hover:bg-muted border-border'
                                          : 'opacity-50 cursor-not-allowed border-border'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
