import { Head, Link, usePage } from '@inertiajs/react';
import { create as createThread } from '@/actions/App/Http/Controllers/Forum/ForumThreadController';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/time';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import PublicLayout from '@/layouts/public-layout';
import type { ForumCategory, User } from '@/types';

interface Props {
    categories: (ForumCategory & {
        threads_count: number;
        unresolved_threads_count: number;
        last_thread: {
            id: number;
            title: string;
            slug: string;
            last_activity_at: string | null;
            author: { name: string; username: string } | null;
            category: { slug: string };
        } | null;
    })[];
}

const CATEGORY_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
};

export default function ForumIndex({ categories }: Props) {
    const { auth, locale } = usePage().props as { auth: { user: User | null }; locale: string };
    const l = String(locale);

    const Layout = auth?.user ? AppLayout : PublicLayout;

    return (
        <Layout>
            <Head title="Forum — SkillEvidence" />

            <div className="md:mx-2 px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Community Forum</h1>
                        <p className="text-muted-foreground mt-1">Ask questions, share knowledge, connect with learners.</p>
                    </div>
                    {auth?.user && (
                        <Link href={createThread.url(l)}>
                            <Button>New Thread</Button>
                        </Link>
                    )}
                </div>

                {/* Category list */}
                <div className="space-y-3">
                    {categories.map((category) => {
                        const colors = CATEGORY_COLOR_CLASSES[category.color] ?? CATEGORY_COLOR_CLASSES.gray;
                        const categoryUrl = `/${l}/forum/${category.slug}`;

                        return (
                            <div
                                key={category.id}
                                className="flex gap-4 rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors"
                            >
                                {/* Color swatch */}
                                <div className={`w-1.5 rounded-full shrink-0 ${colors.bg} ${colors.border} border`} />

                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3 mb-1">
                                        <Link href={categoryUrl} className="font-semibold text-lg hover:text-primary transition-colors">
                                            {category.name}
                                        </Link>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${colors.bg} ${colors.text}`}>
                                            {category.thread_count} threads
                                        </span>
                                    </div>

                                    {category.description && (
                                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                            {category.description}
                                        </p>
                                    )}

                                    {/* Last thread */}
                                    {category.last_thread && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            <span>Last:</span>
                                            <Link
                                                href={`/${l}/forum/${category.last_thread.category?.slug ?? category.slug}/${category.last_thread.slug}`}
                                                className="hover:underline truncate max-w-[280px]"
                                            >
                                                {category.last_thread.title}
                                            </Link>
                                            {category.last_thread.last_activity_at && (
                                                <span className="shrink-0">
                                                    · {timeAgo(category.last_thread.last_activity_at)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex flex-col items-end gap-1 shrink-0 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>{category.thread_count}</span>
                                    </div>
                                    {category.unresolved_threads_count > 0 && (
                                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            <span>{category.unresolved_threads_count} unanswered</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {categories.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No forum categories yet.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
