import type { ReputationLevel, User } from './auth';

export type { ReputationLevel };

export type ForumReportReason = 'spam' | 'misinformation' | 'off-topic' | 'inappropriate';

export type ForumAuthor = Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'role' | 'is_ai'> & {
    reputation_points?: number;
    reputation_level?: ReputationLevel;
};

export type ForumCategory = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    color: string;
    sort_order: number;
    thread_count: number;
    unresolved_threads_count?: number;
    last_thread_id: number | null;
    last_thread?: ForumThread | null;
    threads_count?: number;
    created_at: string;
    updated_at: string;
};

export type ForumThread = {
    id: number;
    user_id: number;
    category_id: number;
    slug: string;
    title: string;
    body: string;
    is_pinned: boolean;
    is_locked: boolean;
    is_resolved: boolean;
    pending_ai_reply: boolean;
    upvotes_count: number;
    replies_count: number;
    last_activity_at: string | null;
    resource_id: number | null;
    course_id: number | null;
    tags: string[] | null;
    // Eager-loaded relations
    author?: ForumAuthor;
    category?: Pick<ForumCategory, 'id' | 'name' | 'slug' | 'color'>;
    // Computed by withExists
    has_voted?: boolean;
    is_bookmarked?: boolean;
    is_following?: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

export type ForumReply = {
    id: number;
    thread_id: number;
    user_id: number;
    body: string;
    quoted_reply_id: number | null;
    is_accepted_answer: boolean;
    upvotes_count: number;
    // Eager-loaded
    author?: ForumAuthor;
    quoted_reply?: Pick<ForumReply, 'id' | 'body' | 'user_id'> | null;
    has_voted?: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

export type ForumVote = {
    id: number;
    user_id: number;
    votable_type: string;
    votable_id: number;
    created_at: string;
};

export type ForumReport = {
    id: number;
    user_id: number;
    reportable_type: string;
    reportable_id: number;
    reason: ForumReportReason;
    resolved_at: string | null;
    reporter?: ForumAuthor;
    reportable?: ForumThread | ForumReply;
    created_at: string;
};
