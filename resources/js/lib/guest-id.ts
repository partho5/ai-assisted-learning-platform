const STORAGE_KEY = 'se_guest_id';

/**
 * Returns the persisted guest user ID from localStorage, creating one if it
 * doesn't exist yet. Uses two stacked crypto.randomUUID() calls for maximum
 * entropy (256 bits total), separated by a dot for readability.
 *
 * The ID intentionally survives login/logout — it is only used to merge
 * pre-registration chat history into the newly created account.
 */
export function getGuestUserId(): string {
    try {
        let id = localStorage.getItem(STORAGE_KEY);

        if (!id) {
            id = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
            localStorage.setItem(STORAGE_KEY, id);
        }

        return id;
    } catch {
        // localStorage may be unavailable (private browsing restrictions, etc.)
        // Fall back to a session-scoped value so the rest of the app still works.
        return `${crypto.randomUUID()}.${crypto.randomUUID()}`;
    }
}
