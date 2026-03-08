import type { Auth } from '@/types/auth';

/** Shape of the ui.php translation file passed via Inertia shared props */
export type UiTranslations = {
    nav: {
        dashboard: string;
        settings: string;
        users: string;
        courses: string;
        categories: string;
        analytics: string;
        my_courses: string;
        profile: string;
    };
    locale: Record<string, string>;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            locale: string;
            supportedLocales: string[];
            ui: UiTranslations;
            flash: { success: string | null; error: string | null };
            [key: string]: unknown;
        };
    }
}
