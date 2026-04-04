import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    edit as articleEdit,
    destroy as articleDestroy,
    index as articleIndex,
} from '@/actions/App/Http/Controllers/ArticleController';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MentorCard from '@/components/mentor-card';
import RichHtml from '@/components/rich-html';
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
    isPreview?: boolean;
}

export default function ArticleShow({ article, ogUrl, appUrl, schemaTypes, isPreview = false }: Props) {
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
        if (prompt('Type "delete" to confirm') !== 'delete') return;
        router.delete(articleDestroy.url({ locale: l, article: article.slug }));
    }

    return (
        <PublicLayout>
            <Head title={article.title}>
                <style>{`body { background-color: aliceblue !important; }`}</style>
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
                <meta property="og:image:alt" content={article.featured_image_alt ?? article.title} />
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

            {isPreview && (
                <div className="sticky top-0 z-50 bg-amber-500/95 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow">
                    Preview — this article is not publicly visible yet
                </div>
            )}

            <div className="mx-auto max-w-5xl px-0 py-8 md:px-6 md:py-12">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="ml-2 md:ml-0 mb-6 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                    <Link href={`/${l}/resources`} className="shrink-0 whitespace-nowrap hover:text-foreground">Resources</Link>
                    {article.category && (
                        <>
                            <span className="shrink-0">/</span>
                            <Link href={`/${l}/resources?category=${article.category.slug}`} className="shrink-0 whitespace-nowrap hover:text-foreground">
                                {article.category.name}
                            </Link>
                        </>
                    )}
                    <span className="shrink-0">/</span>
                    <span className="min-w-0 truncate text-foreground">{article.title}</span>
                </nav>

                <article>
                    {/* Title */}
                    <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent text-3xl font-bold tracking-tight leading-tight md:text-4xl ml-2 md:ml-0">{article.title}</h1>

                    {/* Excerpt / speakable intro */}
                    {article.excerpt && (
                        <p className="article-excerpt ml-2 md:ml-0 mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
                    )}

                    {/* Meta row */}
                    <div className="ml-2 md:ml-0 mt-5 p-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground bg-gray-100 rounded">
                        {article.author && (
                            <Link href={`/${l}/u/${article.author.username}`} className="font-medium hover:text-foreground">
                                {article.author.name}
                            </Link>
                        )}
                        {article.updated_at && (
                            <time dateTime={article.updated_at}>
                                Updated {new Date(article.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                        )}
                        <span>{article.read_time_minutes} min read</span>
                    </div>

                    {/* Edit / Delete controls */}
                    {canEdit && (
                        <div className="mt-4 flex gap-2">
                            <Button variant="ghost" size="compact" asChild>
                                <Link href={articleEdit.url({ locale: l, article: article.slug })}>Edit</Link>
                            </Button>
                            <Button variant="danger" size="compact" onClick={handleDelete}>Delete</Button>
                        </div>
                    )}

                    {/* Featured image */}
                    {article.featured_image && (
                        <div className="mt-6 overflow-hidden rounded-xl">
                            <img
                                src={article.featured_image}
                                alt={article.featured_image_alt ?? article.title}
                                className="w-full object-cover"
                            />
                        </div>
                    )}

                    {/* Body */}
                    {article.body && (
                        <div className="mt-8 bg-white px-2 py-6 md:rounded-xl md:border md:border-border/60 md:px-6 md:py-6 md:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_1px_4px_-1px_rgba(0,0,0,0.04)] dark:bg-card dark:md:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),0_1px_4px_-1px_rgba(0,0,0,0.2)]">
                            <RichHtml content={article.body} size="base" externalLinksNewTab className="article-body" />
                        </div>
                    )}

                    {/* Category + Tags */}
                    {(article.category || (article.tags && article.tags.length > 0)) && (
                        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {article.category && (
                                <Badge variant="outline">{article.category.name}</Badge>
                            )}
                            {article.tags && article.tags.length > 0 && (
                                <>
                                    <span className="font-medium">Tags:</span>
                                    {article.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* Social sharing */}
                    <div className="mt-10 flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Share it on</span>
                        <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Share on Facebook"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white transition-opacity hover:opacity-80"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a
                            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(ogUrl)}&text=${encodeURIComponent(article.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Share on X"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ogUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Share on LinkedIn"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0A66C2] text-white transition-opacity hover:opacity-80"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                        <a
                            href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(ogUrl)}&media=${encodeURIComponent(ogImage)}&description=${encodeURIComponent(article.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Share on Pinterest"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E60023] text-white transition-opacity hover:opacity-80"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
                        </a>
                    </div>
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
