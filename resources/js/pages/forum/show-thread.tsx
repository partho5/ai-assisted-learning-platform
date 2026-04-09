import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { store as storeReply, update as updateReply, destroy as destroyReply, accept as acceptReply } from '@/actions/App/Http/Controllers/Forum/ForumReplyController';
import { destroy as destroyThread } from '@/actions/App/Http/Controllers/Forum/ForumThreadController';
import { thread as voteThread, reply as voteReply } from '@/actions/App/Http/Controllers/Forum/ForumVoteController';
import { toggle as toggleBookmark } from '@/actions/App/Http/Controllers/Forum/ForumBookmarkController';
import { toggle as toggleFollow } from '@/actions/App/Http/Controllers/Forum/ForumThreadFollowController';
import { index as forumIndex } from '@/actions/App/Http/Controllers/Forum/ForumController';
import { Bookmark, CheckCircle, ChevronDown, ChevronRight, Edit, Lock, MessageSquare, Pin, Reply, ThumbsUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RichHtml from '@/components/rich-html';
import RichTextEditor from '@/components/rich-text-editor';
import PostByline from '@/components/forum/post-byline';
import AppLayout from '@/layouts/app-layout';
import PublicLayout from '@/layouts/public-layout';
import type { ForumReply, ForumThread, User } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_VISUAL_DEPTH = 5;

// ─── Tree builder ────────────────────────────────────────────────────────────

function buildReplyTree(flatReplies: ForumReply[]): ForumReply[] {
    const map = new Map<number, ForumReply>();
    const roots: ForumReply[] = [];

    for (const reply of flatReplies) {
        map.set(reply.id, { ...reply, children: [] });
    }

    for (const reply of flatReplies) {
        const node = map.get(reply.id)!;
        if (reply.parent_id && map.has(reply.parent_id)) {
            map.get(reply.parent_id)!.children!.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

// ─── Page component ──────────────────────────────────────────────────────────

interface Props {
    thread: ForumThread;
    acceptedAnswer: ForumReply | null;
    replies: ForumReply[];
    canModerate: boolean;
    canReply: boolean;
    isAuthor: boolean;
    maxReplyDepth: number;
}

export default function ShowThread({ thread, acceptedAnswer, replies, canModerate, canReply, isAuthor, maxReplyDepth }: Props) {
    const { auth, locale } = usePage().props as { auth: { user: User | null }; locale: string };
    const l = String(locale);

    const [replyBody, setReplyBody] = useState('');
    const [replyEditorKey, setReplyEditorKey] = useState(0);
    const [quotedReply, setQuotedReply] = useState<ForumReply | null>(null);
    const [replyingTo, setReplyingTo] = useState<ForumReply | null>(null);
    const [upvotes, setUpvotes] = useState(thread.upvotes_count);
    const [hasVoted, setHasVoted] = useState(thread.has_voted ?? false);
    const [isBookmarked, setIsBookmarked] = useState(thread.is_bookmarked ?? false);
    const [isFollowing, setIsFollowing] = useState(thread.is_following ?? false);

    const replyTree = useMemo(() => buildReplyTree(replies), [replies]);

    // Poll every 10 s while an AI reply is pending so the reply appears without manual refresh.
    useEffect(() => {
        if (!thread.pending_ai_reply) { return; }
        const id = setInterval(() => {
            router.reload({ only: ['thread', 'replies'] });
        }, 10_000);
        return () => clearInterval(id);
    }, [thread.pending_ai_reply]);

    const Layout = auth?.user ? AppLayout : PublicLayout;

    const threadArgs = {
        locale: l,
        forumCategory: thread.category?.slug ?? '',
        forumThread: thread.slug,
    };

    function submitReply() {
        if (!replyBody.trim()) { return; }
        router.post(
            storeReply.url(threadArgs),
            {
                body: replyBody,
                quoted_reply_id: quotedReply?.id ?? null,
                parent_id: replyingTo?.id ?? null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReplyBody('');
                    setReplyEditorKey((k) => k + 1);
                    setQuotedReply(null);
                    setReplyingTo(null);
                },
            }
        );
    }

    function cancelReplyTo() {
        setReplyingTo(null);
        setQuotedReply(null);
        setReplyBody('');
        setReplyEditorKey((k) => k + 1);
    }

    function jsonPost(url: string): Promise<Record<string, unknown>> {
        const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfMeta?.content ?? '',
            },
            body: JSON.stringify({}),
        }).then((r) => r.json());
    }

    function handleVoteThread() {
        if (!auth?.user) { return; }
        setHasVoted(!hasVoted);
        setUpvotes((prev) => hasVoted ? prev - 1 : prev + 1);
        jsonPost(voteThread.url({ locale: l, forumThread: thread.id })).catch(() => {
            setHasVoted(hasVoted);
            setUpvotes((prev) => hasVoted ? prev + 1 : prev - 1);
        });
    }

    function handleBookmark() {
        if (!auth?.user) { return; }
        setIsBookmarked(!isBookmarked);
        jsonPost(toggleBookmark.url({ locale: l, forumThread: thread.id })).catch(() => {
            setIsBookmarked(isBookmarked);
        });
    }

    function handleFollow() {
        if (!auth?.user) { return; }
        setIsFollowing(!isFollowing);
        jsonPost(toggleFollow.url({ locale: l, forumThread: thread.id })).catch(() => {
            setIsFollowing(isFollowing);
        });
    }

    function handleDelete() {
        if (!confirm('Delete this thread? This cannot be undone.')) { return; }
        router.delete(destroyThread.url(threadArgs));
    }

    function handleAcceptReply(reply: ForumReply) {
        router.post(
            acceptReply.url({ ...threadArgs, forumReply: reply.id }),
            {},
            { preserveScroll: true }
        );
    }

    function handleDeleteReply(reply: ForumReply) {
        if (!confirm('Delete this reply?')) { return; }
        router.delete(
            destroyReply.url({ ...threadArgs, forumReply: reply.id }),
            { preserveScroll: true }
        );
    }

    return (
        <Layout>
            <Head title={`${thread.title} — ${thread.category?.name ?? 'Forum'} — SkillEvidence`} />

            <div className="mx-0 max-w-7xl px-4 py-8 md:mx-auto">
                {/* Breadcrumb */}
                <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5 flex-wrap">
                    <Link href={forumIndex.url(l)} className="hover:underline">Forum</Link>
                    <span>›</span>
                    {thread.category && (
                        <>
                            <Link href={`/${l}/forum/${thread.category.slug}`} className="hover:underline">
                                {thread.category.name}
                            </Link>
                            <span>›</span>
                        </>
                    )}
                    <span className="text-foreground font-medium truncate max-w-[240px]">{thread.title}</span>
                </nav>

                {/* Thread question */}
                <div className="rounded-xl border bg-card p-6 mb-6">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                        {thread.is_pinned && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                <Pin className="h-3 w-3" /> Pinned
                            </span>
                        )}
                        {thread.is_resolved && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <CheckCircle className="h-3 w-3" /> Resolved
                            </span>
                        )}
                        {thread.is_locked && (
                            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                <Lock className="h-3 w-3" /> Locked
                            </span>
                        )}
                        {thread.category && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                {thread.category.name}
                            </span>
                        )}
                        {thread.tags?.map((tag) => (
                            <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>

                    {thread.author && (
                        <div className="mb-4">
                            <PostByline
                                author={thread.author}
                                createdAt={thread.created_at}
                                updatedAt={thread.updated_at}
                                locale={l}
                            />
                        </div>
                    )}

                    <RichHtml content={thread.body} externalLinksNewTab />

                    {/* Thread actions */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t flex-wrap">
                        <button
                            onClick={handleVoteThread}
                            disabled={!auth?.user}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                hasVoted
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{upvotes}</span>
                        </button>

                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>{thread.replies_count} replies</span>
                        </div>

                        {auth?.user && (
                            <>
                                <button
                                    onClick={handleBookmark}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                                    <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                                </button>

                                <button
                                    onClick={handleFollow}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        isFollowing ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                                >
                                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                                </button>
                            </>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                            {(isAuthor || canModerate) && (
                                <Link
                                    href={`/${l}/forum/${thread.category?.slug}/${thread.slug}/edit`}
                                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                    Edit
                                </Link>
                            )}
                            {(isAuthor || canModerate) && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Accepted answer */}
                {acceptedAnswer && (
                    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-3 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Accepted Answer
                        </div>
                        <ReplyBody
                            reply={acceptedAnswer}
                            locale={l}
                            auth={auth}
                            threadArgs={threadArgs}
                            canModerate={canModerate}
                            isThreadAuthor={isAuthor}
                            canNestReply={false}
                            onReply={() => {}}
                            onQuote={() => setQuotedReply(acceptedAnswer)}
                            onAccept={() => handleAcceptReply(acceptedAnswer)}
                            onDelete={() => handleDeleteReply(acceptedAnswer)}
                        />
                    </div>
                )}

                {/* Replies tree */}
                {replyTree.length > 0 && (
                    <div className="mb-8">
                        <h2 className="font-semibold text-lg mb-4">{thread.replies_count} {thread.replies_count === 1 ? 'Reply' : 'Replies'}</h2>
                        <div className="space-y-4">
                            {replyTree.map((reply) => (
                                <ReplyNode
                                    key={reply.id}
                                    reply={reply}
                                    depth={0}
                                    maxReplyDepth={maxReplyDepth}
                                    locale={l}
                                    auth={auth}
                                    threadArgs={threadArgs}
                                    canModerate={canModerate}
                                    canReply={canReply}
                                    isThreadAuthor={isAuthor}
                                    replyingTo={replyingTo}
                                    replyBody={replyBody}
                                    replyEditorKey={replyEditorKey}
                                    quotedReply={quotedReply}
                                    onSetReplyingTo={setReplyingTo}
                                    onSetQuotedReply={setQuotedReply}
                                    onSetReplyBody={setReplyBody}
                                    onSubmitReply={submitReply}
                                    onCancelReplyTo={cancelReplyTo}
                                    onAccept={handleAcceptReply}
                                    onDelete={handleDeleteReply}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Mentor composing indicator */}
                {thread.pending_ai_reply && (
                    <div className="mb-8 rounded-xl border border-border bg-card p-5 flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
                        <span>A mentor is writing an answer…</span>
                    </div>
                )}

                {/* Root-level reply composer */}
                {canReply && (
                    <div className="rounded-xl border bg-card p-6">
                        <h2 className="font-semibold mb-4">
                            {replyingTo ? (
                                <span className="flex items-center gap-2">
                                    Replying to {replyingTo.author?.name ?? 'reply'}
                                    <button onClick={cancelReplyTo} className="text-sm font-normal text-muted-foreground hover:text-foreground">
                                        (cancel)
                                    </button>
                                </span>
                            ) : (
                                'Leave a Reply'
                            )}
                        </h2>

                        {quotedReply && (
                            <div className="mb-3 flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                                <div className="flex-1 line-clamp-3 text-muted-foreground italic border-l-2 border-border pl-2">
                                    {quotedReply.body.replace(/<[^>]*>/g, ' ').trim().slice(0, 160)}
                                </div>
                                <button
                                    onClick={() => setQuotedReply(null)}
                                    className="text-muted-foreground hover:text-foreground shrink-0"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <RichTextEditor
                            key={replyEditorKey}
                            value={replyBody}
                            onChange={setReplyBody}
                            placeholder="Write your reply..."
                        />

                        <div className="flex justify-end mt-4">
                            <Button onClick={submitReply} disabled={!replyBody.trim()}>
                                Post Reply
                            </Button>
                        </div>
                    </div>
                )}

                {!auth?.user && (
                    <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
                        <p>
                            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
                            {' '}to join the discussion.
                        </p>
                    </div>
                )}

                {auth?.user && thread.is_locked && (
                    <div className="rounded-xl border bg-muted p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Lock className="h-4 w-4" />
                        This thread is locked and no longer accepting replies.
                    </div>
                )}
            </div>
        </Layout>
    );
}

// ─── Recursive reply node ────────────────────────────────────────────────────

interface ReplyNodeProps {
    reply: ForumReply;
    depth: number;
    maxReplyDepth: number;
    locale: string;
    auth: { user: User | null };
    threadArgs: { locale: string; forumCategory: string; forumThread: string };
    canModerate: boolean;
    canReply: boolean;
    isThreadAuthor: boolean;
    replyingTo: ForumReply | null;
    replyBody: string;
    replyEditorKey: number;
    quotedReply: ForumReply | null;
    onSetReplyingTo: (reply: ForumReply | null) => void;
    onSetQuotedReply: (reply: ForumReply | null) => void;
    onSetReplyBody: (body: string) => void;
    onSubmitReply: () => void;
    onCancelReplyTo: () => void;
    onAccept: (reply: ForumReply) => void;
    onDelete: (reply: ForumReply) => void;
}

function ReplyNode({
    reply, depth, maxReplyDepth, locale, auth, threadArgs, canModerate, canReply,
    isThreadAuthor, replyingTo, replyBody, replyEditorKey, quotedReply,
    onSetReplyingTo, onSetQuotedReply, onSetReplyBody, onSubmitReply, onCancelReplyTo,
    onAccept, onDelete,
}: ReplyNodeProps) {
    const [collapsed, setCollapsed] = useState(false);
    const hasChildren = reply.children && reply.children.length > 0;
    const canNestHere = depth < maxReplyDepth;
    const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);
    const isReplyTarget = replyingTo?.id === reply.id;

    return (
        <div id={`reply-${reply.id}`} className={depth > 0 ? 'mt-3' : ''}>
            <div className={`${depth > 0 ? 'border-l-2 border-muted pl-4' : ''}`}>
                <div className="rounded-xl border bg-card p-5">
                    {/* Collapse toggle for threads with children */}
                    {hasChildren && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
                        >
                            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {collapsed ? `${countDescendants(reply)} hidden replies` : 'Collapse'}
                        </button>
                    )}

                    <ReplyBody
                        reply={reply}
                        locale={locale}
                        auth={auth}
                        threadArgs={threadArgs}
                        canModerate={canModerate}
                        isThreadAuthor={isThreadAuthor}
                        canNestReply={canReply && canNestHere}
                        onReply={() => {
                            onSetReplyingTo(reply);
                            onSetQuotedReply(null);
                            onSetReplyBody('');
                        }}
                        onQuote={() => {
                            onSetQuotedReply(reply);
                            onSetReplyingTo(reply);
                        }}
                        onAccept={() => onAccept(reply)}
                        onDelete={() => onDelete(reply)}
                    />
                </div>

                {/* Inline composer when replying to this specific reply */}
                {isReplyTarget && canReply && (
                    <div className="mt-3 rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">Replying to {reply.author?.name ?? 'this reply'}</span>
                            <button onClick={onCancelReplyTo} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>

                        {quotedReply && quotedReply.id === reply.id && (
                            <div className="mb-3 flex items-start gap-2 rounded-lg bg-muted p-2 text-sm">
                                <div className="flex-1 line-clamp-2 text-muted-foreground italic border-l-2 border-border pl-2 text-xs">
                                    {quotedReply.body.replace(/<[^>]*>/g, ' ').trim().slice(0, 120)}
                                </div>
                                <button onClick={() => onSetQuotedReply(null)} className="text-muted-foreground hover:text-foreground shrink-0 text-xs">✕</button>
                            </div>
                        )}

                        <RichTextEditor
                            key={replyEditorKey}
                            value={replyBody}
                            onChange={onSetReplyBody}
                            placeholder={`Reply to ${reply.author?.name ?? 'this reply'}...`}
                            autoFocus
                        />
                        <div className="flex justify-end mt-3">
                            <Button size="compact" onClick={onSubmitReply} disabled={!replyBody.trim()}>
                                Reply
                            </Button>
                        </div>
                    </div>
                )}

                {/* Children */}
                {!collapsed && hasChildren && (
                    <div className="mt-1">
                        {reply.children!.map((child) => (
                            <ReplyNode
                                key={child.id}
                                reply={child}
                                depth={depth + 1}
                                maxReplyDepth={maxReplyDepth}
                                locale={locale}
                                auth={auth}
                                threadArgs={threadArgs}
                                canModerate={canModerate}
                                canReply={canReply}
                                isThreadAuthor={isThreadAuthor}
                                replyingTo={replyingTo}
                                replyBody={replyBody}
                                replyEditorKey={replyEditorKey}
                                quotedReply={quotedReply}
                                onSetReplyingTo={onSetReplyingTo}
                                onSetQuotedReply={onSetQuotedReply}
                                onSetReplyBody={onSetReplyBody}
                                onSubmitReply={onSubmitReply}
                                onCancelReplyTo={onCancelReplyTo}
                                onAccept={onAccept}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function countDescendants(reply: ForumReply): number {
    if (!reply.children?.length) { return 0; }
    return reply.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

// ─── Reply body sub-component ────────────────────────────────────────────────

interface ReplyBodyProps {
    reply: ForumReply;
    locale: string;
    auth: { user: User | null };
    threadArgs: { locale: string; forumCategory: string; forumThread: string };
    canModerate: boolean;
    isThreadAuthor: boolean;
    canNestReply: boolean;
    onReply: () => void;
    onQuote: () => void;
    onAccept: () => void;
    onDelete: () => void;
}

function ReplyBody({ reply, locale, auth, threadArgs, canModerate, isThreadAuthor, canNestReply, onReply, onQuote, onAccept, onDelete }: ReplyBodyProps) {
    const isReplyAuthor = auth?.user?.id === reply.user_id;
    const [upvotes, setUpvotes] = useState(reply.upvotes_count);
    const [hasVoted, setHasVoted] = useState(reply.has_voted ?? false);
    const [editing, setEditing] = useState(false);
    const [editBody, setEditBody] = useState(reply.body);

    function handleVote() {
        if (!auth?.user) { return; }
        setHasVoted(!hasVoted);
        setUpvotes((prev) => hasVoted ? prev - 1 : prev + 1);
        const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        fetch(voteReply.url({ locale, forumReply: reply.id }), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfMeta?.content ?? '',
            },
            body: JSON.stringify({}),
        }).catch(() => {
            setHasVoted(hasVoted);
            setUpvotes((prev) => hasVoted ? prev + 1 : prev - 1);
        });
    }

    function submitEdit() {
        router.put(
            updateReply.url({ ...threadArgs, forumReply: reply.id }),
            { body: editBody },
            { preserveScroll: true, onSuccess: () => setEditing(false) }
        );
    }

    if (reply.deleted_at) {
        return (
            <p className="text-sm text-muted-foreground italic">[This reply was deleted]</p>
        );
    }

    return (
        <div>
            {/* Quoted reply */}
            {reply.quoted_reply && (
                <blockquote className="mb-3 border-l-2 border-border bg-muted px-4 py-2 rounded-r text-sm text-muted-foreground italic line-clamp-3">
                    {reply.quoted_reply.body.replace(/<[^>]*>/g, ' ').trim().slice(0, 200)}
                </blockquote>
            )}

            {/* Author */}
            {reply.author && (
                <div className="mb-3">
                    <PostByline
                        author={reply.author}
                        createdAt={reply.created_at}
                        updatedAt={reply.updated_at}
                        locale={locale}
                    />
                </div>
            )}

            {/* Body */}
            {editing ? (
                <div className="mt-2">
                    <RichTextEditor value={editBody} onChange={setEditBody} />
                    <div className="flex gap-2 justify-end mt-2">
                        <Button variant="ghost" size="compact" onClick={() => setEditing(false)}>Cancel</Button>
                        <Button size="compact" onClick={submitEdit}>Save</Button>
                    </div>
                </div>
            ) : (
                <RichHtml content={reply.body} externalLinksNewTab />
            )}

            {/* Reply actions */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t flex-wrap">
                <button
                    onClick={handleVote}
                    disabled={!auth?.user}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm transition-colors ${
                        hasVoted ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                    } disabled:opacity-50`}
                >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{upvotes}</span>
                </button>

                {auth?.user && canNestReply && (
                    <button
                        onClick={onReply}
                        className="flex items-center gap-1 text-sm text-blue-500 hover:text-foreground"
                    >
                        <Reply className="h-3.5 w-3.5" />
                        Reply
                    </button>
                )}

                {auth?.user && (
                    <button
                        onClick={onQuote}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Quote
                    </button>
                )}

                <div className="ml-auto flex items-center gap-3">
                    {(isThreadAuthor || canModerate) && !reply.is_accepted_answer && (
                        <button
                            onClick={onAccept}
                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Accept
                        </button>
                    )}
                    {(isReplyAuthor || canModerate) && !editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                        </button>
                    )}
                    {(isReplyAuthor || canModerate) && (
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
