import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    approve as courseApprove,
    create as courseCreate,
    edit as courseEdit,
    index as coursesIndex,
    preview as coursePreview,
    reject as courseReject,
} from '@/actions/App/Http/Controllers/CourseController';
import { index as submissionsIndex } from '@/actions/App/Http/Controllers/SubmissionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Course } from '@/types';

interface Props {
    courses: Course[];
    isAdmin: boolean;
}

export default function CoursesIndex({ courses, isAdmin }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    function approveCourse(slug: string) {
        router.post(courseApprove.url({ locale: l, course: slug }), {}, { preserveScroll: true });
    }

    function rejectCourse(slug: string) {
        const reason = prompt('Rejection reason (required):');
        if (!reason?.trim()) { return; }
        router.post(courseReject.url({ locale: l, course: slug }), { rejection_reason: reason }, { preserveScroll: true });
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: isAdmin ? 'All Courses' : 'My Courses', href: coursesIndex.url(l) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isAdmin ? 'All Courses' : 'My Courses'} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {isAdmin ? 'All Courses' : 'My Courses'}
                    </h1>
                    <Link href={courseCreate.url(l)}>
                        <Button variant="enroll">New Course</Button>
                    </Link>
                </div>

                {courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sidebar-border py-20 text-center">
                        <p className="text-sm text-muted-foreground">No courses yet.</p>
                        {!isAdmin && (
                            <Link href={courseCreate.url(l)} className="mt-3">
                                <Button variant="secondary" size="compact">
                                    Create your first course
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="flex flex-col rounded-xl border border-sidebar-border/70 bg-card transition-shadow hover:shadow-md dark:border-sidebar-border"
                            >
                                {course.thumbnail ? (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="aspect-video w-full rounded-t-xl object-cover"
                                    />
                                ) : (
                                    <div className="aspect-video w-full rounded-t-xl bg-muted" />
                                )}

                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="line-clamp-2 text-sm font-semibold leading-snug">
                                            {course.title}
                                        </h2>
                                        <Badge
                                            variant={course.status === 'published' ? 'default' : 'secondary'}
                                            className={`shrink-0 capitalize ${course.status === 'pending_review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : ''}`}
                                        >
                                            {course.status === 'pending_review' ? 'Pending Review' : course.status}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                        {isAdmin && course.mentor && (
                                            <>
                                                <span className="font-medium text-foreground/70">{course.mentor.name}</span>
                                                <span>·</span>
                                            </>
                                        )}
                                        {course.category && <span>{course.category.name}</span>}
                                        {course.category && <span>·</span>}
                                        <span className="capitalize">{course.difficulty}</span>
                                        {course.modules_count !== undefined && (
                                            <>
                                                <span>·</span>
                                                <span>
                                                    {course.modules_count} module
                                                    {course.modules_count !== 1 ? 's' : ''}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-auto flex flex-col gap-2 pt-2">
                                        <div className="flex gap-2">
                                            <Link
                                                href={courseEdit.url({ locale: l, course: course.slug })}
                                                className="flex-1"
                                            >
                                                <Button variant="secondary" size="compact" className="w-full">
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Link
                                                href={submissionsIndex.url({ locale: l, course: course.slug })}
                                                className="flex-1"
                                            >
                                                <Button variant="utility" size="compact" className="w-full">
                                                    Submissions
                                                </Button>
                                            </Link>
                                        </div>
                                        {course.status === 'published' ? (
                                            <Link
                                                href={`/${l}/courses/${course.slug}`}
                                                className="text-center text-xs text-primary hover:underline"
                                            >
                                                View course →
                                            </Link>
                                        ) : (
                                            <Link
                                                href={coursePreview.url({ locale: l, course: course.slug })}
                                                className="text-center text-xs text-amber-600 hover:underline dark:text-amber-400"
                                            >
                                                Preview course →
                                            </Link>
                                        )}
                                        {isAdmin && course.status === 'pending_review' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="complete"
                                                    size="compact"
                                                    className="flex-1"
                                                    onClick={() => approveCourse(course.slug)}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="compact"
                                                    className="flex-1"
                                                    onClick={() => rejectCourse(course.slug)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
