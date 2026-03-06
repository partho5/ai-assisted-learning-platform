import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import {
    index as coursesIndex,
    show as courseShow,
} from '@/actions/App/Http/Controllers/CourseController';
import { Badge } from '@/components/ui/badge';
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
}

export default function CourseCatalog({ courses, categories, difficulties, filters }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const searchRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <PublicLayout>
            <Head title="Courses">
                <meta name="description" content="Browse curated learning courses built by expert mentors." />
            </Head>

            {/* Page header */}
            <section className="border-b border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-violet-50/40 to-background px-4 py-10 dark:border-indigo-900/30 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-background md:px-6 md:py-14">
                <div className="mx-auto max-w-7xl">
                    <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">Courses</h1>
                    <p className="text-muted-foreground">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{courses?.total ?? 0}</span>{' '}
                        curated course{courses?.total !== 1 ? 's' : ''} — learn at your own pace
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
                        onChange={(e) => applyFilter('category', e.target.value)}
                        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                        onChange={(e) => applyFilter('difficulty', e.target.value)}
                        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                                router.get(coursesIndex.url(l), {}, { preserveState: false, replace: true })
                            }
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            </section>

            {/* Course grid */}
            <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
                {courses.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                        <p className="text-sm text-muted-foreground">No courses match your filters.</p>
                        <Button
                            variant="secondary"
                            size="compact"
                            className="mt-3"
                            onClick={() =>
                                router.get(coursesIndex.url(l), {}, { preserveState: false, replace: true })
                            }
                        >
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {courses.data.map((course) => (
                            <CourseCard key={course.id} course={course} locale={l} />
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
                                          ? 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                                          : 'cursor-not-allowed opacity-40 text-muted-foreground',
                                ].join(' ')}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </PublicLayout>
    );
}

function CourseCard({ course, locale }: { course: Course; locale: string }) {
    const durationText = course.estimated_duration
        ? course.estimated_duration >= 60
            ? `${Math.round(course.estimated_duration / 60)}h`
            : `${course.estimated_duration}m`
        : null;

    return (
        <Link
            href={courseShow.url({ locale, course: course.slug })}
            className="group flex flex-col rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg dark:hover:border-indigo-700"
        >
            {/* Thumbnail */}
            {course.thumbnail ? (
                <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="aspect-video w-full rounded-t-xl object-cover"
                />
            ) : (
                <div className="aspect-video w-full rounded-t-xl bg-gradient-to-br from-indigo-100 via-violet-100 to-sky-100 dark:from-indigo-900/40 dark:via-violet-900/30 dark:to-sky-900/30" />
            )}

            <div className="flex flex-1 flex-col gap-3 p-5">
                {/* Category + Difficulty */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {course.category && (
                        <Badge className="text-xs font-normal bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300">
                            {course.category.name}
                        </Badge>
                    )}
                    <Badge className="text-xs font-normal capitalize bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300">
                        {course.difficulty}
                    </Badge>
                </div>

                {/* Title */}
                <h2 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {course.title}
                </h2>

                {/* Mentor */}
                {course.mentor && (
                    <p className="text-xs text-muted-foreground">
                        by <span className="font-medium text-foreground/70">{course.mentor.name}</span>
                    </p>
                )}

                {/* Stats */}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                    {course.modules_count !== undefined && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                            {course.modules_count} module{course.modules_count !== 1 ? 's' : ''}
                        </span>
                    )}
                    {course.resources_count !== undefined && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                            {course.resources_count} lesson{course.resources_count !== 1 ? 's' : ''}
                        </span>
                    )}
                    {durationText && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            {durationText}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
