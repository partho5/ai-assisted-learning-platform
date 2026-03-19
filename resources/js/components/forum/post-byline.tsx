import { Link } from '@inertiajs/react';
import { timeAgo } from '@/lib/time';
import { Badge } from '@/components/ui/badge';
import type { ForumAuthor } from '@/types';

const REPUTATION_COLORS: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

interface PostBylineProps {
    author: ForumAuthor;
    createdAt: string;
    updatedAt?: string;
    locale: string;
}

export default function PostByline({ author, createdAt, updatedAt, locale }: PostBylineProps) {
    const isEdited = updatedAt && updatedAt !== createdAt;
    const relativeTime = timeAgo(createdAt);
    const reputationLevel = author.reputation_level ?? null;

    return (
        <div className="flex items-center gap-2 flex-wrap text-sm">
            {author.avatar ? (
                <img
                    src={author.avatar}
                    alt={author.name}
                    className="h-7 w-7 rounded-full object-cover shrink-0"
                />
            ) : (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                    {author.name.charAt(0).toUpperCase()}
                </div>
            )}

            <Link
                href={`/${locale}/u/${author.username}`}
                className="font-medium hover:underline text-foreground"
            >
                {author.name}
            </Link>

            {(author.role === 'mentor' || author.is_ai) && (
                <Badge className="text-[10px] py-0 px-1.5 bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300">
                    Mentor
                </Badge>
            )}

            {author.role === 'admin' && !author.is_ai && (
                <Badge className="text-[10px] py-0 px-1.5 bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300">
                    Admin
                </Badge>
            )}

            {reputationLevel && !author.is_ai && (
                <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${REPUTATION_COLORS[reputationLevel.color] ?? REPUTATION_COLORS.gray}`}
                >
                    {reputationLevel.label}
                </span>
            )}

            <span className="text-muted-foreground" title={new Date(createdAt).toLocaleString()}>
                {relativeTime}
            </span>

            {isEdited && (
                <span className="text-muted-foreground text-xs italic">· edited</span>
            )}
        </div>
    );
}
