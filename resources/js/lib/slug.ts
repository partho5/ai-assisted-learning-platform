/**
 * Client-side mirror of app/Services/SlugGenerator.php.
 *
 * Keep the two in sync — the server regenerates and re-validates slugs, so any
 * divergence shows up as a validation error on an auto-filled field.
 *
 * Titles are expected to mix Bengali with English passages, so the kept-character
 * class is a union rather than a per-script branch.
 */

/**
 * `\p{Script=Bengali}` covers consonants, independent vowels and digits.
 * `\p{Mn}` covers combining vowel signs (কার) and hasanta (্) — dropping these
 * destroys the word. U+200C/U+200D control conjunct formation.
 */
const KEPT = '[a-z0-9\\p{Script=Bengali}\\p{Mn}\\u200C\\u200D-]';

/**
 * Danda and double danda are punctuation, but `\p{Script=Bengali}` admits them
 * via Script_Extensions, so they need an explicit exclusion.
 */
const DANDA = '\\u0964\\u0965';

/** Whitespace, NBSP, underscore, the dash range, and danda all become breaks. */
const WORD_BREAKS = new RegExp(`[\\s\\u00A0_\\u2010-\\u2015\\-${DANDA}]+`, 'gu');

const NOT_KEPT = new RegExp(`(?![${DANDA}])${KEPT}`, 'u');

export function slugify(value: string): string {
    const normalized = value.normalize('NFC').toLowerCase();

    return Array.from(normalized.replace(WORD_BREAKS, '-'))
        .filter((char) => NOT_KEPT.test(char))
        .join('')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Sanitize a slug the user typed by hand, preserving their separators.
 *
 * Unlike `slugify` this keeps a trailing hyphen so mid-typing state isn't
 * fought with — the field is trimmed on submit by the server.
 */
export function sanitizeSlug(value: string): string {
    const normalized = value.normalize('NFC').toLowerCase();

    return Array.from(normalized.replace(/[\s _]+/g, '-'))
        .filter((char) => NOT_KEPT.test(char))
        .join('')
        .replace(/-+/g, '-');
}
