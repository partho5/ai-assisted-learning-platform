import { Head, Link, router, usePage } from '@inertiajs/react';
import { create as createThread } from '@/actions/App/Http/Controllers/Forum/ForumThreadController';
import { index as forumIndex } from '@/actions/App/Http/Controllers/Forum/ForumController';
import { Button } from '@/components/ui/button';
import ThreadCard from '@/components/forum/thread-card';
import AppLayout from '@/layouts/app-layout';
import PublicLayout from '@/layouts/public-layout';
import type { ForumCategory, ForumThread, Paginated, User } from '@/types';

interface Props {
    category: ForumCategory;
    threads: Paginated<ForumThread>;
    filter: string;
}

const FILTERS = [
    { key: 'recent', label: 'Recent' },
    { key: 'trending', label: 'Trending' },
    { key: 'unanswered', label: 'Unanswered' },
    { key: 'resolved', label: 'Resolved' },
];

export default function ShowCategory({ category, threads, filter }: Props) {
    const { auth, locale } = usePage().props as { auth: { user: User | null }; locale: string };
    const l = String(locale);

    const Layout = auth?.user ? AppLayout : PublicLayout;

    function changeFilter(newFilter: string) {
        router.get(`/${l}/forum/${category.slug}`, { filter: newFilter }, { preserveState: true, replace: true });
    }

    return (
        <Layout>
            <Head title={`${category.name} — Forum — SkillEvidence`} />

            <div className="md:mx-2 px-4 py-8">
                {/* Breadcrumb */}
                <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
                    <Link href={forumIndex.url(l)} className="hover:underline">Forum</Link>
                    <span>›</span>
                    <span className="text-foreground font-medium">{category.name}</span>
                </nav>

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{category.name}</h1>
                        {category.description && (
                            <p className="text-muted-foreground mt-1">{category.description}</p>
                        )}
                    </div>
                    {auth?.user && (
                        <Link href={createThread.url(l, { query: { category_id: category.id } })}>
                            <Button className="shrink-0">New Thread</Button>
                        </Link>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 border-b mb-6">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => changeFilter(f.key)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                filter === f.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Thread list */}
                <div>
                    {threads.data.map((thread) => (
                        <ThreadCard key={thread.id} thread={thread} locale={l} />
                    ))}

                    {threads.data.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            {filter === 'unanswered'
                                ? 'No unanswered threads. Great job!'
                                : filter === 'resolved'
                                  ? 'No resolved threads yet.'
                                  : 'No threads yet. Be the first to start a discussion!'}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {threads.last_page > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {threads.links.map((link, i) => (
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
