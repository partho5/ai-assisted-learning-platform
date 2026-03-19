import { Link } from '@inertiajs/react';
import { MessageSquare, ThumbsUp, CheckCircle, Pin } from 'lucide-react';
import { timeAgo } from '@/lib/time';
import type { ForumThread } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

interface ThreadCardProps {
    thread: ForumThread;
    locale: string;
    showCategory?: boolean;
}

export default function ThreadCard({ thread, locale, showCategory = false }: ThreadCardProps) {
    const categoryColor = thread.category
        ? (CATEGORY_COLORS[thread.category.color] ?? CATEGORY_COLORS.gray)
        : CATEGORY_COLORS.gray;

    const threadUrl = `/${locale}/forum/${thread.category?.slug ?? ''}/${thread.slug}`;
    const lastActivity = thread.last_activity_at
        ? timeAgo(thread.last_activity_at)
        : null;

    return (
        <div className="flex gap-4 py-4 border-b last:border-0">
            {/* Vote count column */}
            <div className="flex flex-col items-center gap-1 shrink-0 w-12 text-center">
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{thread.upvotes_count}</span>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap mb-1">
                    {thread.is_pinned && (
                        <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    {thread.is_resolved && (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <Link
                        href={threadUrl}
                        className="font-semibold hover:text-primary transition-colors line-clamp-2 flex-1"
                    >
                        {thread.title}
                    </Link>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    {showCategory && thread.category && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
                            {thread.category.name}
                        </span>
                    )}
                    {thread.is_resolved && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Resolved
                        </span>
                    )}
                    {thread.tags && thread.tags.length > 0 && (
                        <span className="flex gap-1">
                            {thread.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="rounded bg-muted px-1.5 py-0.5">
                                    {tag}
                                </span>
                            ))}
                        </span>
                    )}
                    {thread.author && (
                        <span>by {thread.author.name}</span>
                    )}
                    {lastActivity && (
                        <span>· {lastActivity}</span>
                    )}
                </div>
            </div>

            {/* Reply count column */}
            <div className="flex flex-col items-center gap-1 shrink-0 w-12 text-center">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{thread.replies_count}</span>
            </div>
        </div>
    );
}
