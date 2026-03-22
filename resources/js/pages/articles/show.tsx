import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    edit as articleEdit,
    destroy as articleDestroy,
    index as articleIndex,
} from '@/actions/App/Http/Controllers/ArticleController';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MentorCard from '@/components/mentor-card';
import PublicLayout from '@/layouts/public-layout';
import type { Article } from '@/types';

interface SchemaTypes {
    howTo: boolean;
    faq: boolean;
}

interface Props {
    article: Article;
    ogUrl: string;
    appUrl: string;
    schemaTypes: SchemaTypes;
}

export default function ArticleShow({ article, ogUrl, appUrl, schemaTypes }: Props) {
    const { auth, locale, name } = usePage().props as Record<string, any>;
    const l = String(locale);
    const appName = String(name);
    const user = auth?.user;
    const canEdit = user && (user.role === 'admin' || user.id === article.author_id);

    const ogImage = article.featured_image
        ? (article.featured_image.startsWith('http') ? article.featured_image : `${appUrl}${article.featured_image}`)
        : `${appUrl}/logo.png`;

    const description = article.excerpt ?? article.title;
    const publishedIso = article.published_at ?? article.created_at;
    const authorName = article.author?.name ?? appName;
    const authorUrl = article.author?.username ? `${appUrl}/${l}/u/${article.author.username}` : appUrl;

    // Extract H2/H3 headings for HowTo steps schema
    function extractHeadingsAsSteps(body: string): Array<{ '@type': string; name: string; text: string }> {
        const matches = [...body.matchAll(/<h[23][^>]*>(.*?)<\/h[23]>/gi)];
        return matches.slice(0, 10).map((m) => ({
            '@type': 'HowToStep',
            name: m[1].replace(/<[^>]*>/g, '').trim(),
            text: m[1].replace(/<[^>]*>/g, '').trim(),
        }));
    }

    // Extract FAQ pairs: H2/H3 ending in "?" + next paragraph
    function extractFaqPairs(body: string): Array<{ '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }> {
        const pairs: Array<{ '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }> = [];
        const regex = /<h[23][^>]*>([^<]*\?[^<]*)<\/h[23]>\s*(?:<p[^>]*>(.*?)<\/p>)?/gi;
        let match;
        while ((match = regex.exec(body)) !== null && pairs.length < 10) {
            pairs.push({
                '@type': 'Question',
                name: match[1].replace(/<[^>]*>/g, '').trim(),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: (match[2] ?? '').replace(/<[^>]*>/g, '').trim(),
                },
            });
        }
        return pairs;
    }

    const authorSchema = {
        '@type': 'Person',
        name: authorName,
        url: authorUrl,
        ...(article.author?.avatar ? { image: article.author.avatar } : {}),
    };

    const publisherSchema = {
        '@type': 'Organization',
        name: appName,
        url: appUrl,
        logo: { '@type': 'ImageObject', url: `${appUrl}/logo.png` },
    };

    // Base Article schema — always emitted
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description,
        url: ogUrl,
        image: ogImage,
        datePublished: publishedIso,
        dateModified: article.updated_at,
        author: authorSchema,
        publisher: publisherSchema,
        ...(article.tags && article.tags.length > 0 ? { keywords: article.tags.join(', ') } : {}),
        speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['h1', '.article-excerpt'],
        },
        wordCount: article.body ? article.body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0,
        timeRequired: `PT${article.read_time_minutes}M`,
        inLanguage: 'en',
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Resources', item: `${appUrl}/${l}/resources` },
            ...(article.category ? [{ '@type': 'ListItem', position: 2, name: article.category.name, item: `${appUrl}/${l}/resources?category=${article.category.slug}` }] : []),
            { '@type': 'ListItem', position: article.category ? 3 : 2, name: article.title, item: ogUrl },
        ],
    };

    // HowTo schema — emitted when title matches how-to pattern
    const howToSchema = schemaTypes.howTo && article.body ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: article.title,
        description,
        image: ogImage,
        totalTime: `PT${article.read_time_minutes}M`,
        step: extractHeadingsAsSteps(article.body),
    } : null;

    // FAQPage schema — emitted when body has 2+ question headings
    const faqPairs = schemaTypes.faq && article.body ? extractFaqPairs(article.body) : [];
    const faqSchema = faqPairs.length >= 2 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqPairs,
    } : null;

    function handleDelete() {
        if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
        router.delete(articleDestroy.url({ locale: l, article: article.slug }));
    }

    return (
        <PublicLayout>
            <Head title={article.title}>
                {/* Core meta */}
                <meta name="description" content={description} />
                <link rel="canonical" href={ogUrl} />

                {/* OpenGraph */}
                <meta property="og:site_name" content={appName} />
                <meta property="og:title" content={`${article.title} | ${appName}`} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={article.title} />
                <meta property="og:url" content={ogUrl} />
                <meta property="og:type" content="article" />
                <meta property="og:locale" content="en_US" />
                <meta property="article:published_time" content={publishedIso} />
                <meta property="article:modified_time" content={article.updated_at} />
                <meta property="article:author" content={authorUrl} />
                {article.tags?.map((tag) => (
                    <meta key={tag} property="article:tag" content={tag} />
                ))}

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${article.title} | ${appName}`} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={ogImage} />

                {/* Structured data */}
                <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
                {howToSchema && (
                    <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
                )}
                {faqSchema && (
                    <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
                )}
            </Head>

            <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link href={`/${l}/resources`} className="hover:text-foreground">Resources</Link>
                    {article.category && (
                        <>
                            <span>/</span>
                            <Link href={`/${l}/resources?category=${article.category.slug}`} className="hover:text-foreground">
                                {article.category.name}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="truncate text-foreground">{article.title}</span>
                </nav>

                <article>
                    {/* Category pill */}
                    {article.category && (
                        <div className="mb-3">
                            <Badge variant="outline">{article.category.name}</Badge>
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-3xl font-bold tracking-tight leading-tight md:text-4xl">{article.title}</h1>

                    {/* Excerpt / speakable intro */}
                    {article.excerpt && (
                        <p className="article-excerpt mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
                    )}

                    {/* Meta row */}
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {article.author && (
                            <Link href={`/${l}/u/${article.author.username}`} className="font-medium hover:text-foreground">
                                {article.author.name}
                            </Link>
                        )}
                        {article.published_at && (
                            <time dateTime={article.published_at}>
                                {new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                        )}
                        <span>{article.read_time_minutes} min read</span>
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {article.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Edit / Delete controls */}
                    {canEdit && (
                        <div className="mt-4 flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={articleEdit.url({ locale: l, article: article.slug })}>Edit</Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
                        </div>
                    )}

                    {/* Featured image */}
                    {article.featured_image && (
                        <div className="mt-6 overflow-hidden rounded-xl">
                            <img
                                src={article.featured_image}
                                alt={article.title}
                                className="w-full object-cover"
                            />
                        </div>
                    )}

                    {/* Body */}
                    {article.body && (
                        <div
                            className="prose prose-sm dark:prose-invert mt-8 max-w-none"
                            dangerouslySetInnerHTML={{ __html: article.body }}
                        />
                    )}
                </article>

                {/* Author card */}
                {article.author && (
                    <div className="mt-12 border-t pt-10">
                        <MentorCard
                            mentor={article.author as any}
                            locale={l}
                            variant="card"
                            standalone={true}
                        />
                    </div>
                )}

                {/* Back link */}
                <div className="mt-10">
                    <Link href={articleIndex.url(l)} className="text-sm text-muted-foreground hover:text-foreground">
                        ← Back to Resources
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
