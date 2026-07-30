import type { User } from './auth';
import type { Category } from './course';

export type ArticleStatus = 'draft' | 'scheduled' | 'published';

/**
 * An article's primary language. Content is single-language: the article is
 * indexed only under this locale, and EnsureContentLocale redirects requests
 * that arrive under the other one.
 */
export type ContentLanguage = 'bn' | 'en';

export type Article = {
    id: number;
    author_id: number;
    category_id: number | null;
    title: string;
    slug: string;
    language: ContentLanguage;
    excerpt: string | null;
    body: string | null;
    featured_image: string | null;
    featured_image_alt: string | null;
    tags: string[] | null;
    status: ArticleStatus;
    read_time_minutes: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    // relations (loaded selectively)
    author?: Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'headline' | 'bio' | 'created_at'>;
    category?: Category | null;
};
