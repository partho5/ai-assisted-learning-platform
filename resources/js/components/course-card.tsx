import { Link } from '@inertiajs/react';
import { show as courseShow } from '@/actions/App/Http/Controllers/CourseController';
import MentorCard from '@/components/mentor-card';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/types';

interface CourseCardProps {
    course: Course;
    locale: string;
    'data-course-id'?: number;
}

export default function CourseCard({ course, locale, 'data-course-id': dataCourseId }: CourseCardProps) {
    const durationText = course.estimated_duration
        ? course.estimated_duration >= 60
            ? `${Math.round(course.estimated_duration / 60)}h`
            : `${course.estimated_duration}m`
        : null;

    return (
        <Link
            href={courseShow.url({ locale, course: course.slug })}
            data-course-id={dataCourseId}
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

                {/* Subtitle */}
                {course.subtitle && (
                    <p className="-mt-1 line-clamp-1 text-sm font-medium text-indigo-500 dark:text-indigo-400">
                        {course.subtitle}
                    </p>
                )}

                {/* Mentor */}
                {course.mentor && (
                    <MentorCard mentor={course.mentor} locale={locale} variant="inline" />
                )}

                {/* Stats + Price */}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-2">
                    <div className="flex flex-wrap items-center gap-1.5">
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
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                {durationText}
                            </span>
                        )}
                    </div>
                    {course.price && parseFloat(course.price) > 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: course.currency }).format(parseFloat(course.price))}
                            {course.billing_type === 'subscription' ? '/month' : ''}
                        </span>
                    ) : (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Free
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
