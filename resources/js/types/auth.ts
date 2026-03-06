export type UserRole = 'admin' | 'mentor' | 'learner';

export type PortfolioVisibility = 'public' | 'unlisted' | 'private';

export type User = {
    id: number;
    name: string;
    username: string;
    email: string;
    role: UserRole;
    avatar?: string | null;
    headline?: string | null;
    bio?: string | null;
    portfolio_visibility?: PortfolioVisibility;
    showcased_attempt_ids?: number[] | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
