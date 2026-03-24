import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    create as articleCreate,
    edit as articleEdit,
    destroy as articleDestroy,
    show as articleShow,
    index as articleIndex,
} from '@/actions/App/Http/Controllers/ArticleController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PublicLayout from '@/layouts/public-layout';
import AppLayout from '@/layouts/app-layout';
import type { Article, ArticleCategory, Paginated } from '@/types';
import { useState } from 'react';

interface PublicProps {
    articles: Paginated<Article>;
    categories: ArticleCategory[];
    filters: { category?: string; search?: string };
    isAuthorView: false;
}

interface AuthorProps {
    articles: Article[];
    isAuthorView: true;
    isAdmin: boolean;
}

type Props = PublicProps | AuthorProps;

export default function ArticlesIndex(props: Props) {
    const { auth, locale, name } = usePage().props as Record<string, any>;
    const l = String(locale);
    const user = auth?.user;

    if (props.isAuthorView) {
        return <AuthorView {...props} locale={l} user={user} />;
    }

    return <PublicView {...props} locale={l} appName={String(name)} user={user} />;
}

// ---- Author management view -----------------------------------------------

function AuthorView({ articles, isAdmin, locale, user }: AuthorProps & { locale: string; user: any }) {
    function handleDelete(article: Article) {
        if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
        router.delete(articleDestroy.url({ locale, article: article.slug }));
    }

    return (
        <AppLayout>
            <Head title="My Articles" />
            <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{isAdmin ? 'All Articles' : 'My Articles'}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage knowledge resources published at{' '}
                            <Link href={articleIndex.url(locale)} className="underline">/{locale}/resources</Link>
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={articleCreate.url(locale)}>+ New Article</Link>
                    </Button>
                </div>

                {articles.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                        No articles yet.{' '}
                        <Link href={articleCreate.url(locale)} className="font-medium text-primary underline">
                            Write your first one.
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y rounded-xl border">
                        {articles.map((article) => (
                            <div key={article.id} className="flex items-start justify-between gap-4 px-5 py-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            href={articleShow.url({ locale, article: article.slug })}
                                            className="font-medium hover:underline"
                                        >
                                            {article.title}
                                        </Link>
                                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                            {article.status}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {article.read_time_minutes} min read
                                        {isAdmin && article.author && (
                                            <> · by {article.author.name}</>
                                        )}
                                        {article.category && (
                                            <> · {article.category.name}</>
                                        )}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={articleEdit.url({ locale, article: article.slug })}>Edit</Link>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(article)}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

// ---- Public catalog view ---------------------------------------------------

function PublicView({
    articles,
    categories,
    filters,
    locale,
    appName,
    user,
}: PublicProps & { locale: string; appName: string; user: any }) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(articleIndex.url(locale), { ...filters, search }, { preserveState: true, replace: true });
    }

    function setCategory(slug: string | null) {
        router.get(articleIndex.url(locale), { ...filters, category: slug ?? undefined, search: filters.search }, {
            preserveState: true,
            replace: true,
        });
    }

    const isAuthor = user?.role === 'mentor' || user?.role === 'admin';

    return (
        <PublicLayout>
            <Head title="Resources">
                <meta name="description" content={`Guides, how-tos, and knowledge articles from ${appName} mentors.`} />
                <link rel="canonical" href={`${articleIndex.url(locale)}`} />
                <meta property="og:title" content={`Resources | ${appName}`} />
                <meta property="og:description" content={`Guides, how-tos, and knowledge articles from ${appName} mentors.`} />
                <meta property="og:type" content="website" />
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: `Resources | ${appName}`,
                    description: `Guides, how-tos, and knowledge articles from ${appName} mentors.`,
                    url: articleIndex.url(locale),
                })}</script>
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                        <p className="mt-1 text-muted-foreground">Guides, how-tos, and knowledge from our mentors.</p>
                    </div>
                    <div className="flex gap-2">
                        {isAuthor && (
                            <Button asChild variant="outline">
                                <Link href={articleIndex.url(locale)}>My Articles</Link>
                            </Button>
                        )}
                        {isAuthor && (
                            <Button asChild>
                                <Link href={articleCreate.url(locale)}>New Article</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-3">
                    <form onSubmit={applySearch} className="flex gap-2">
                        <Input
                            placeholder="Search articles…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button type="submit">Search</Button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setCategory(null)}
                            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${!filters.category ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.slug)}
                                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${filters.category === cat.slug ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Article grid */}
                {articles.data.length === 0 ? (
                    <div className="py-20 text-center text-muted-foreground">No articles found.</div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.data.map((article) => (
                            <ArticleCard key={article.id} article={article} locale={locale} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {articles.last_page > 1 && (
                    <div className="mt-10 flex justify-center gap-1">
                        {articles.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`rounded px-3 py-1.5 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

function ArticleCard({ article, locale }: { article: Article; locale: string }) {
    return (
        <Link
            href={articleShow.url({ locale, article: article.slug })}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
        >
            {article.featured_image && (
                <div className="aspect-video overflow-hidden">
                    <img
                        src={article.featured_image}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
            )}
            <div className="flex flex-1 flex-col gap-2 p-4">
                {article.category && (
                    <span className="text-xs font-medium uppercase tracking-wide text-primary">{article.category.name}</span>
                )}
                <h2 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{article.title}</h2>
                {article.excerpt && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                    <span>{article.author?.name ?? ''}</span>
                    <span>{article.read_time_minutes} min read</span>
                </div>
            </div>
        </Link>
    );
}
