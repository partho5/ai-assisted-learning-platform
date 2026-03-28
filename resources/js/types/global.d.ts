import type { Auth } from '@/types/auth';

/** Google Analytics gtag interface */
type GtagCommand = 'config' | 'event' | 'js' | 'set';

/** OneSignal SDK global interface */
declare global {
    interface Window {
        gtag?: (command: GtagCommand, ...args: unknown[]) => void;
        dataLayer?: unknown[];
        OneSignal?: {
            Notifications?: {
                requestPermission(): Promise<void>;
            };
            User?: {
                PushSubscription?: {
                    id?: string;
                    optedIn?: boolean;
                    addEventListener(event: string, callback: (event: any) => void): void;
                };
            };
            init(config: any): Promise<void>;
        };
    }
}

/** Shape of the ui.php translation file passed via Inertia shared props */
export type UiTranslations = {
    nav: {
        dashboard: string;
        settings: string;
        users: string;
        courses: string;
        categories: string;
        analytics: string;
        submissions: string;
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
            flash: { success: string | null; error: string | null; chat_merged: boolean | null };
            paypalClientId: string | null;
            onesignalAppId: string | null;
            [key: string]: unknown;
        };
    }
}
