const KEY_PREFIX = 'ref_';

interface StoredReferral {
    code: string;
    timestamp: number;
}

export function captureReferral(courseSlug: string, code: string): void {
    try {
        localStorage.setItem(
            KEY_PREFIX + courseSlug,
            JSON.stringify({ code, timestamp: Date.now() } satisfies StoredReferral),
        );
    } catch {
        // localStorage unavailable (private browsing, full storage)
    }
}

export function getReferral(courseSlug: string, effectiveDays: number = 30): string | null {
    try {
        const raw = localStorage.getItem(KEY_PREFIX + courseSlug);
        if (!raw) return null;

        const data: StoredReferral = JSON.parse(raw);
        const expiresAt = data.timestamp + effectiveDays * 24 * 60 * 60 * 1000;

        if (Date.now() > expiresAt) {
            clearReferral(courseSlug);
            return null;
        }

        return data.code;
    } catch {
        return null;
    }
}

export function clearReferral(courseSlug: string): void {
    try {
        localStorage.removeItem(KEY_PREFIX + courseSlug);
    } catch {
        // noop
    }
}
