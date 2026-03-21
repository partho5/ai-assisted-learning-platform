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
        console.log('[PushPrompt] useEffect fired — appId:', appId, 'isSubscribed:', isSubscribed, 'Notification.permission:', Notification.permission);

        if (!appId || isSubscribed) {
            console.log('[PushPrompt] Skipping: no appId or already subscribed');
            return;
        }

        if (Notification.permission === 'granted' || Notification.permission === 'denied') {
            console.log('[PushPrompt] Skipping: permission already', Notification.permission);
            return;
        }

        const snoozedUntil = localStorage.getItem(STORAGE_KEY);
        if (snoozedUntil && Date.now() < Number(snoozedUntil)) {
            console.log('[PushPrompt] Skipping: snoozed until', new Date(Number(snoozedUntil)));
            return;
        }

        console.log('[PushPrompt] Will show custom prompt in 3s');
        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
    }, [appId, isSubscribed]);

    if (!visible) { return null; }

    async function handleAllow() {
        console.log('[PushPrompt] Allow clicked');
        console.log('[PushPrompt] Notification.permission:', Notification.permission);
        console.log('[PushPrompt] window.OneSignal exists:', !!window.OneSignal);
        console.log('[PushPrompt] window.OneSignal?.Notifications:', window.OneSignal?.Notifications);
        console.log('[PushPrompt] requestPermission fn:', window.OneSignal?.Notifications?.requestPermission);

        setVisible(false);

        try {
            // Try OneSignal first (production)
            if (window.OneSignal?.Notifications?.requestPermission) {
                console.log('[PushPrompt] Calling OneSignal.Notifications.requestPermission()...');
                await window.OneSignal.Notifications.requestPermission();
                console.log('[PushPrompt] OneSignal requestPermission resolved. permission now:', Notification.permission);
            } else {
                // Fallback: native Notification API (works on localhost + production)
                console.log('[PushPrompt] OneSignal not available, falling back to Notification.requestPermission()...');
                const result = await Notification.requestPermission();
                console.log('[PushPrompt] Native requestPermission result:', result);
            }
        } catch (error) {
            console.error('[PushPrompt] Notification permission request FAILED:', error);
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
