export type UserRole = 'admin' | 'mentor' | 'learner';

export type PortfolioVisibility = 'public' | 'unlisted' | 'private';

export type SocialLink = {
    platform: string;
    url: string;
};

export type ReputationLevel = {
    min: number;
    max: number | null;
    label: string;
    color: string;
};

export type User = {
    id: number;
    name: string;
    username: string;
    email: string;
    role: UserRole;
    is_ai?: boolean;
    avatar?: string | null;
    headline?: string | null;
    bio?: string | null;
    portfolio_visibility?: PortfolioVisibility;
    social_links?: SocialLink[] | null;
    showcased_attempt_ids?: number[] | null;
    reputation_points?: number;
    reputation_level?: ReputationLevel;
    onesignal_player_id?: string | null;
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
