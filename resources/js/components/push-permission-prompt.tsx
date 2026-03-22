import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'push_prompt_snoozed_until';
const SNOOZE_HOURS = 24;

/**
 * Custom pre-permission prompt for OneSignal push notifications.
 *
 * Show conditions (all must be true):
 *  - OneSignal App ID is configured
 *  - User is not already subscribed (no player ID saved)
 *  - Browser permission is still 'default' (not granted or denied)
 *  - User hasn't snoozed within the last 24 hours
 *
 * Flow:
 *  1. "Allow" → trigger native browser permission prompt
 *  2. "Not now" → snooze for 24 h, re-ask on next visit after that
 *  3. Browser denied → never shows again (permission === 'denied')
 */
interface Props {
    appId: string | null | undefined;
    isSubscribed: boolean;
}

export default function PushPermissionPrompt({ appId, isSubscribed }: Props) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!appId || isSubscribed) { return; }

        if (Notification.permission === 'granted' || Notification.permission === 'denied') { return; }

        const snoozedUntil = localStorage.getItem(STORAGE_KEY);
        if (snoozedUntil && Date.now() < Number(snoozedUntil)) { return; }

        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
    }, [appId, isSubscribed]);

    if (!visible) { return null; }

    async function handleAllow() {
        setVisible(false);

        try {
            if (window.OneSignal?.Notifications?.requestPermission) {
                await window.OneSignal.Notifications.requestPermission();
            } else {
                await Notification.requestPermission();
            }
        } catch {
            // Silent fail
        }
    }

    function handleDismiss() {
        const snoozedUntil = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, String(snoozedUntil));
        setVisible(false);
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg space-y-3">
            <div className="space-y-1">
                <p className="font-semibold text-sm">Connect with Mentors</p>
                <p className="text-sm text-muted-foreground">
                    If you want mentors to send you message, allow notification.
                </p>
            </div>
            <div className="flex gap-2">
                <Button size="compact" onClick={handleAllow}>Allow notifications</Button>
                <Button size="compact" variant="ghost" onClick={handleDismiss}>Not now</Button>
            </div>
        </div>
    );
}
