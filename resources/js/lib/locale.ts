/**
 * Locale helpers for SEO metadata.
 *
 * Content is single-language and EnsureContentLocale redirects any request that
 * arrives under the wrong locale, so on a content page the URL locale and the
 * record's language are always the same value. The URL locale is used here
 * because listing pages have no single record to read a language from.
 */

const OG_LOCALES: Record<string, string> = {
    bn: 'bn_BD',
    en: 'en_US',
};

/** The `og:locale` value for a URL locale. */
export function ogLocale(locale: string): string {
    return OG_LOCALES[locale] ?? OG_LOCALES.bn;
}

/**
 * The schema.org `inLanguage` value for a URL locale.
 *
 * Note this declares the page's *primary* language. Bengali pages routinely
 * embed English passages (technical terms, code) and are still `bn`.
 */
export function inLanguage(locale: string): string {
    return locale;
}
