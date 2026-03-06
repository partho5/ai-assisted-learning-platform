import { Head, Link, usePage } from '@inertiajs/react';
import {
    create as courseCreate,
    edit as courseEdit,
    index as coursesIndex,
} from '@/actions/App/Http/Controllers/CourseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Course } from '@/types';

interface Props {
    courses: Course[];
}

export default function CoursesIndex({ courses }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: coursesIndex.url(l) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Courses" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
                    <Link href={courseCreate.url(l)}>
                        <Button variant="enroll">New Course</Button>
                    </Link>
                </div>

                {courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sidebar-border py-20 text-center">
                        <p className="text-sm text-muted-foreground">No courses yet.</p>
                        <Link href={courseCreate.url(l)} className="mt-3">
                            <Button variant="secondary" size="compact">
                                Create your first course
                            </Button>
                        </Link>
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
                                            className="shrink-0 capitalize"
                                        >
                                            {course.status}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
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

                                    <div className="mt-auto pt-2">
                                        <Link href={courseEdit.url({ locale: l, course: course.slug })}>
                                            <Button variant="secondary" size="compact" className="w-full">
                                                Edit Course
                                            </Button>
                                        </Link>
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
