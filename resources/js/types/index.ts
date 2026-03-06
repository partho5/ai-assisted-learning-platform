export type * from './auth';
export type * from './course';
export type * from './navigation';
export type * from './test';
export type * from './ui';

export type PaginatedLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginatedLink[];
    path: string;
    per_page: number;
    to: number | null;
    total: number;
    first_page_url: string | null;
    last_page_url: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
};
