import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { index as coursesIndex } from '@/actions/App/Http/Controllers/CourseController';
import { platform } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import CourseCard from '@/components/course-card';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PublicLayout from '@/layouts/public-layout';
import type { Category, Course, Paginated, SelectOption } from '@/types';

interface Filters {
    category?: string;
    difficulty?: string;
    search?: string;
}

interface Props {
    courses: Paginated<Course>;
    categories: Category[];
    difficulties: SelectOption[];
    filters: Filters;
    ogUrl: string;
}

export default function CourseCatalog({ courses, categories, difficulties, filters, ogUrl }: Props) {
    const { locale, name, appUrl: serverAppUrl } = usePage().props;
    const l = String(locale);

    const searchRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track which course cards are visible in the viewport
    const [visibleCourseIds, setVisibleCourseIds] = useState<Set<number>>(() => new Set(courses.data.map((c) => c.id)));
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                setVisibleCourseIds((prev) => {
                    const next = new Set(prev);
                    entries.forEach((entry) => {
                        const id = Number(entry.target.getAttribute('data-course-id'));
                        if (entry.isIntersecting) {
                            next.add(id);
                        } else {
                            next.delete(id);
                        }
                    });
                    return next;
                });
            },
            { threshold: 0.2 },
        );

        document.querySelectorAll('[data-course-id]').forEach((el) => {
            observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, [courses.data]);

    const visibleCourses = useMemo(
        () =>
            courses.data
                .filter((c) => visibleCourseIds.has(c.id))
                .map((c) => ({
                    id: c.id,
                    title: c.title,
                    description: c.description
                        ? c.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400)
                        : null,
                    difficulty: c.difficulty ?? null,
                    category: c.category?.name ?? null,
                })),
        [courses.data, visibleCourseIds],
    );

    const chatContext = useMemo(
        () => ({
            type: 'platform' as const,
            key: 'courses-catalog',
            endpoint: platform.url(l),
            historyEndpoint: chatHistory.url(l),
            locale: l,
            extra: { courses: visibleCourses },
            autoTrigger: true,
        }),
        [l, visibleCourses],
    );

    function applyFilter(key: string, value: string) {
        router.get(
            coursesIndex.url(l),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true },
        );
    }

    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            applyFilter('search', e.target.value);
        }, 400);
    }

    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    const hasActiveFilters = filters.category || filters.difficulty || filters.search;

    return (
        <PublicLayout hidePlatformChat>
            <Head title="Courses">
                <meta name="description" content="Browse curated learning courses built by expert mentors." />
                <link rel="canonical" href={ogUrl} />
                <link rel="alternate" hrefLang="en" href={`${String(serverAppUrl)}/en/courses`} />
                <link rel="alternate" hrefLang="bn" href={`${String(serverAppUrl)}/bn/courses`} />
                <link rel="alternate" hrefLang="x-default" href={`${String(serverAppUrl)}/en/courses`} />
                <meta property="og:site_name" content={String(name)} />
                <meta property="og:title" content={`Courses | ${String(name)}`} />
                <meta property="og:description" content="Browse curated learning courses built by expert mentors." />
                <meta property="og:image" content={`${String(serverAppUrl)}/og-image.png`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content={`Courses — ${String(name)}`} />
                <meta property="og:url" content={ogUrl} />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="en_US" />
                <meta property="og:locale:alternate" content="bn_BD" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`Courses | ${String(name)}`} />
                <meta name="twitter:description" content="Browse curated learning courses built by expert mentors." />
                <meta name="twitter:image" content={`${String(serverAppUrl)}/og-image.png`} />
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: `Courses — ${String(name)}`,
                    description: 'Browse curated learning courses built by expert mentors.',
                    url: ogUrl,
                    provider: { '@type': 'Organization', name: String(name), url: String(serverAppUrl) },
                    mainEntity: {
                        '@type': 'ItemList',
                        itemListElement: courses.data.map((c, i) => ({
                            '@type': 'ListItem',
                            position: i + 1,
                            url: `${String(serverAppUrl)}/${l}/courses/${c.slug}`,
                            name: c.title,
                        })),
                    },
                })}</script>
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: String(name), item: `${String(serverAppUrl)}/${l}/` },
                        { '@type': 'ListItem', position: 2, name: 'Courses', item: ogUrl },
                    ],
                })}</script>
            </Head>

            {/* Page header */}
            <section className="border-b border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-violet-50/40 to-background px-4 py-10 md:px-6 md:py-14 dark:border-indigo-900/30 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-background">
                <div className="mx-auto max-w-7xl">
                    <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                        Courses
                    </h1>
                    <p className="text-muted-foreground">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {courses?.total ?? 0}
                        </span>{' '}
                        curated course{courses?.total !== 1 ? 's' : ''} — learn
                        at your own pace
                    </p>
                </div>
            </section>

            {/* Filters */}
            <section className="sticky top-[57px] z-40 border-b border-border bg-background px-4 py-3 md:px-6">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
                    <Input
                        ref={searchRef}
                        defaultValue={filters.search ?? ''}
                        onChange={handleSearchChange}
                        placeholder="Search courses..."
                        className="h-9 w-52 text-sm"
                    />

                    <select
                        value={filters.category ?? ''}
                        onChange={(e) =>
                            applyFilter('category', e.target.value)
                        }
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.difficulty ?? ''}
                        onChange={(e) =>
                            applyFilter('difficulty', e.target.value)
                        }
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                        <option value="">All levels</option>
                        {difficulties.map((d) => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
                    </select>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="compact"
                            onClick={() =>
                                router.get(
                                    coursesIndex.url(l),
                                    {},
                                    { preserveState: false, replace: true },
                                )
                            }
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            </section>

            {/* Course grid */}
            <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 mb-48">
                {courses.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                        <p className="text-sm text-muted-foreground">
                            No courses match your filters.
                        </p>
                        <Button
                            variant="secondary"
                            size="compact"
                            className="mt-3"
                            onClick={() =>
                                router.get(
                                    coursesIndex.url(l),
                                    {},
                                    { preserveState: false, replace: true },
                                )
                            }
                        >
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {courses.data.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                locale={l}
                                data-course-id={course.id}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {courses && courses.last_page > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-1">
                        {(courses.links ?? []).map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveState
                                className={[
                                    'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm transition-colors',
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : link.url
                                          ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                          : 'cursor-not-allowed text-muted-foreground opacity-40',
                                ].join(' ')}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </section>
            <FloatingChatButton context={chatContext} />
        </PublicLayout>
    );
}

