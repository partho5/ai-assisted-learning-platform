import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { store as storePushSubscription } from '@/actions/App/Http/Controllers/Forum/ForumPushSubscriptionController';

/**
 * Initializes OneSignal and registers the player ID to the backend
 * when the user grants notification permission.
 *
 * Safe to call multiple times — initialization only runs once per page load.
 */
export function useOneSignal(appId: string | null | undefined, locale: string): void {
    const initialized = useRef(false);

    useEffect(() => {
        if (!appId || initialized.current) { return; }
        initialized.current = true;

        OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
            autoResubscribe: true,
            notifyButton: { enable: false }, // we use our own prompt
        }).then(() => {
            // When permission is granted and we have a player ID, register it
            OneSignal.User.PushSubscription.addEventListener('change', (event) => {
                const playerId = event.current.id;
                if (playerId && event.current.optedIn) {
                    registerPlayerId(playerId, locale);
                }
            });

            // Also register immediately if already subscribed
            const playerId = OneSignal.User.PushSubscription.id;
            const optedIn = OneSignal.User.PushSubscription.optedIn;
            if (playerId && optedIn) {
                registerPlayerId(playerId, locale);
            }
        }).catch(() => {
            // OneSignal unavailable (e.g. ad blocker) — fail silently
        });
    }, [appId, locale]);
}

function registerPlayerId(playerId: string, locale: string): void {
    const csrfMeta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
    fetch(storePushSubscription.url(locale), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfMeta?.content ?? '',
        },
        body: JSON.stringify({ player_id: playerId }),
    }).catch(() => {
        // Best-effort — silent fail
    });
}
