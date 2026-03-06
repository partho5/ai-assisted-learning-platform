import { Head, Link, router, usePage } from '@inertiajs/react';
import { store as enrollStore } from '@/actions/App/Http/Controllers/EnrollmentController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RichHtml from '@/components/rich-html';
import PublicLayout from '@/layouts/public-layout';
import type { Course, Enrollment } from '@/types';

interface Props {
    course: Course;
    enrollment: Enrollment | null;
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
    video: 'Video',
    article: 'Article',
    text: 'Text',
    document: 'Document',
    audio: 'Audio',
    image: 'Image',
    assignment: 'Assignment',
};

export default function CourseShow({ course, enrollment }: Props) {
    const { auth, locale } = usePage().props;
    const l = String(locale);

    const totalResources = course.resources_count ?? course.modules.reduce((sum, m) => sum + m.resources.length, 0);
    const durationText = course.estimated_duration
        ? course.estimated_duration >= 60
            ? `${Math.round(course.estimated_duration / 60)} hours`
            : `${course.estimated_duration} min`
        : null;

    function handleEnroll() {
        router.post(enrollStore.url({ locale: l, course: course.slug }));
    }

    return (
        <PublicLayout>
            <Head title={course.title}>
                <meta name="description" content={course.description} />
            </Head>

            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Breadcrumb */}
                        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <span
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => window.history.back()}
                            >
                                Courses
                            </span>
                            <span>/</span>
                            <span className="text-foreground truncate">{course.title}</span>
                        </div>

                        {/* Hero */}
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                            {course.category && (
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300">
                                    {course.category.name}
                                </Badge>
                            )}
                            <Badge className="bg-amber-100 text-amber-700 capitalize hover:bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300">
                                {course.difficulty}
                            </Badge>
                        </div>

                        <h1 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
                            {course.title}
                        </h1>

                        <div
                            className="prose prose-sm dark:prose-invert rich-html mb-5 max-w-none leading-relaxed text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: course.description }}
                        />

                        {/* Stats row */}
                        <div className="mb-8 flex flex-wrap gap-2">
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                                {course.modules.length} modules
                            </span>
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                {totalResources} lessons
                            </span>
                            {durationText && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                    {durationText} total
                                </span>
                            )}
                            {course.enrollments_count !== undefined && (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    {course.enrollments_count} enrolled
                                </span>
                            )}
                        </div>

                        {/* Thumbnail */}
                        {course.thumbnail && (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="mb-8 aspect-video w-full rounded-xl object-cover"
                            />
                        )}

                        {/* What you'll learn */}
                        {course.what_you_will_learn && (
                            <section className="mb-8 overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                                <div className="border-b border-indigo-200 bg-indigo-50/80 px-5 py-3 dark:border-indigo-800/60 dark:bg-indigo-950/40">
                                    <h2 className="font-semibold text-indigo-900 dark:text-indigo-100">What you will learn</h2>
                                </div>
                                <div className="bg-indigo-50/30 p-5 dark:bg-indigo-950/10">
                                    <RichHtml content={course.what_you_will_learn} className="leading-relaxed text-muted-foreground" />
                                </div>
                            </section>
                        )}

                        {/* Prerequisites */}
                        {course.prerequisites && (
                            <section className="mb-8 overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800/60">
                                <div className="border-b border-amber-200 bg-amber-50/80 px-5 py-3 dark:border-amber-800/60 dark:bg-amber-950/40">
                                    <h2 className="font-semibold text-amber-900 dark:text-amber-100">Prerequisites</h2>
                                </div>
                                <div className="bg-amber-50/30 p-5 dark:bg-amber-950/10">
                                    <p className="leading-relaxed text-muted-foreground">{course.prerequisites}</p>
                                </div>
                            </section>
                        )}

                        {/* Curriculum */}
                        <section className="mb-8">
                            <h2 className="mb-4 text-lg font-semibold">Curriculum</h2>
                            <div className="flex flex-col gap-3">
                                {course.modules.map((module) => (
                                    <div key={module.id} className="overflow-hidden rounded-xl border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                                            <h3 className="font-semibold">{module.title}</h3>
                                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                                                {module.resources.length} lesson{module.resources.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {module.description && (
                                            <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
                                                {module.description}
                                            </p>
                                        )}
                                        {module.resources.length > 0 && (
                                            <ul>
                                                {module.resources.map((resource, i) => (
                                                    <li
                                                        key={resource.id}
                                                        className={`flex items-start justify-between gap-3 px-4 py-2.5 text-sm ${i !== 0 ? 'border-t border-border' : ''}`}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="py-0 text-xs font-normal bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300">
                                                                    {RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}
                                                                </Badge>
                                                                {resource.is_free ? (
                                                                    <Link
                                                                        href={`/${l}/courses/${course.slug}/learn/${resource.id}`}
                                                                        className="font-medium leading-snug hover:text-primary hover:underline"
                                                                    >
                                                                        {resource.title}
                                                                    </Link>
                                                                ) : (
                                                                    <span className="font-medium leading-snug">
                                                                        {resource.title}
                                                                    </span>
                                                                )}
                                                                {resource.is_free && (
                                                                    <Badge className="py-0 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">Free</Badge>
                                                                )}
                                                            </div>
                                                            {resource.why_this_resource && (
                                                                <RichHtml content={resource.why_this_resource} className="text-xs text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        {resource.estimated_time && (
                                                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                                                {resource.estimated_time}m
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Mentor */}
                        {course.mentor && (
                            <section className="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                                <div className="border-b border-emerald-200 bg-emerald-50/80 px-5 py-3 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                                    <h2 className="font-semibold text-emerald-900 dark:text-emerald-100">About the mentor</h2>
                                </div>
                                <div className="bg-emerald-50/20 p-5 dark:bg-emerald-950/10">
                                    <div className="flex items-start gap-4">
                                        {course.mentor.avatar ? (
                                            <img
                                                src={course.mentor.avatar}
                                                alt={course.mentor.name}
                                                className="size-14 rounded-full object-cover ring-2 ring-emerald-200 dark:ring-emerald-800"
                                            />
                                        ) : (
                                            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                {course.mentor.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">{course.mentor.name}</p>
                                            {course.mentor.headline && (
                                                <p className="text-sm text-muted-foreground">{course.mentor.headline}</p>
                                            )}
                                            {course.mentor.bio && (
                                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                                    {course.mentor.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Enrollment card — sticky sidebar on desktop */}
                    <aside className="lg:sticky lg:top-20 lg:w-80 lg:shrink-0">
                        <div className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-md">
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 border-b border-primary/20">
                                <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Enroll in this course</p>
                            </div>
                            <div className="p-6">
                            {/* Thumbnail preview on sidebar (desktop only, hidden if shown in main) */}
                            {course.thumbnail && (
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="mb-4 hidden aspect-video w-full rounded-lg object-cover lg:block"
                                />
                            )}

                            <div className="mb-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
                                {course.modules.length > 0 && (
                                    <span>{course.modules.length} modules · {totalResources} lessons</span>
                                )}
                                {durationText && <span>{durationText} total</span>}
                                <span className="capitalize">{course.difficulty} level</span>
                            </div>

                            <EnrollmentCTA
                                course={course}
                                enrollment={enrollment}
                                user={auth?.user ?? null}
                                locale={l}
                                onEnroll={handleEnroll}
                            />
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </PublicLayout>
    );
}

function EnrollmentCTA({
    course,
    enrollment,
    user,
    locale,
    onEnroll,
}: {
    course: Course;
    enrollment: Enrollment | null;
    user: { id: number } | null;
    locale: string;
    onEnroll: () => void;
}) {
    if (!user) {
        return (
            <div className="flex flex-col gap-3">
                <Button variant="enroll" className="w-full" asChild>
                    <a href={`/register`}>Sign up free to start learning</a>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    Free account — access preview lessons instantly
                </p>
            </div>
        );
    }

    if (!enrollment) {
        return (
            <div className="flex flex-col gap-3">
                <Button variant="enroll" className="w-full" onClick={onEnroll}>
                    Enroll — it's free
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    Observer access — see free lessons and course structure
                </p>
            </div>
        );
    }

    if (enrollment.access_level === 'full') {
        return (
            <div className="flex flex-col gap-3">
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    You have full access to this course
                </div>
                <Button variant="complete" className="w-full">
                    Continue learning
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                <span className="font-medium">Enrolled as observer.</span> Upgrade to access all lessons.
            </div>
            <Button variant="premium" className="w-full">
                Unlock full access
            </Button>
        </div>
    );
}
