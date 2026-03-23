import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'cookie_consent';

interface CookieConsent {
    essential: true;
    advanced: boolean;
}

function loadConsent(): CookieConsent | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [advanced, setAdvanced] = useState(false);

    useEffect(() => {
        if (loadConsent()) return;

        const timer = setTimeout(() => setVisible(true), 60_000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) {
        return null;
    }

    const save = () => {
        const consent: CookieConsent = { essential: true, advanced };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
        setVisible(false);
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 w-80 rounded-xl border border-border bg-background shadow-xl">
            <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Cookie className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm font-semibold">Cookie preferences</span>
                </div>

                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                    We use cookies to keep the site working and to improve your experience. Essential cookies are always on.
                </p>

                <div className="mb-4 space-y-3">
                    {/* Essential — always on */}
                    <label className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked
                            disabled
                            className="mt-0.5 h-4 w-4 shrink-0 accent-primary opacity-60"
                        />
                        <div>
                            <p className="text-xs font-medium">Essential</p>
                            <p className="text-xs text-muted-foreground">Login sessions, security, site functionality.</p>
                        </div>
                    </label>

                    {/* Advanced — optional */}
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={advanced}
                            onChange={(e) => setAdvanced(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        />
                        <div>
                            <p className="text-xs font-medium">Advanced</p>
                            <p className="text-xs text-muted-foreground">Analytics and personalised content.</p>
                        </div>
                    </label>
                </div>

                <Button size="compact" className="w-full" onClick={save}>
                    Save preferences
                </Button>
            </div>
        </div>
    );
}
