<?php

namespace App\Services;

use Illuminate\Support\Str;
use Normalizer;

/**
 * Generates URL slugs that preserve Bengali script.
 *
 * Laravel's `Str::slug()` is unusable for Bengali: it runs `Str::ascii()` first,
 * producing lossy romanizations ('ওয়েব ডেভেলপমেন্ট' becomes 'oozeb-develpment').
 * Passing a null language is worse — its regex keeps `\pL`/`\pN` but strips `\pM`,
 * deleting every vowel sign and hasanta ('বাংলা কোর্স' becomes 'বল-করস').
 *
 * Content is expected to mix Bengali with English passages, so the character
 * class is a union: a single slug may legitimately hold both scripts.
 */
class SlugGenerator
{
    /**
     * Characters kept in a slug, as a regex character-class body.
     *
     * `\p{Bengali}` covers consonants, independent vowels and digits.
     * `\p{Mn}` covers the non-spacing combining marks — vowel signs (কার) and
     * hasanta (্). Dropping these destroys the word, so they are non-negotiable.
     * ZWNJ/ZWJ (U+200C/U+200D) control conjunct formation and must survive too.
     */
    private const KEPT_CHARACTERS = 'a-z0-9\p{Bengali}\p{Mn}\x{200C}\x{200D}';

    /**
     * Sentence terminators that must be excluded despite matching `\p{Bengali}`.
     *
     * PCRE2 resolves `\p{Bengali}` against Script_Extensions, and danda (U+0964)
     * and double danda (U+0965) carry `scx=Beng`. They are punctuation, so
     * without an explicit exclusion they would survive into slugs.
     */
    private const DANDA = '\x{0964}\x{0965}';

    /**
     * Characters that mark a word boundary and collapse into the separator.
     *
     * Covers ASCII/Unicode whitespace, NBSP, underscore, the dash range, and danda.
     */
    private const WORD_BREAKS = '\s\x{00A0}_\x{2010}-\x{2015}\-'.self::DANDA;

    /**
     * Build a URL slug from arbitrary Bengali, English, or mixed-script text.
     */
    public static function generate(string $value, string $separator = '-'): string
    {
        $value = static::normalize($value);

        $value = mb_strtolower($value);

        /** Collapse word boundaries first so terminators become breaks, not deletions. */
        $value = preg_replace('/['.self::WORD_BREAKS.']+/u', $separator, $value) ?? '';

        $value = preg_replace(
            '/[^'.self::KEPT_CHARACTERS.preg_quote($separator, '/').']+/u',
            '',
            $value
        ) ?? '';

        $value = preg_replace('/'.preg_quote($separator, '/').'+/u', $separator, $value) ?? '';
        $value = trim($value, $separator);

        /** Emoji-only or punctuation-only input leaves nothing addressable. */
        if ($value === '') {
            return Str::lower(Str::random(8));
        }

        return $value;
    }

    /**
     * Whether a slug contains only characters this generator would produce.
     *
     * Shared with the validation rules so authoring forms and the generator
     * cannot drift apart. The lookahead re-excludes the danda that
     * `\p{Bengali}` would otherwise admit.
     */
    public static function pattern(string $separator = '-'): string
    {
        $quoted = preg_quote($separator, '/');

        return '/^(?:(?!['.self::DANDA.'])['.self::KEPT_CHARACTERS.$quoted.'])+$/u';
    }

    /**
     * Collapse Unicode to NFC so composed and decomposed Bengali input
     * produce byte-identical slugs.
     */
    private static function normalize(string $value): string
    {
        if (! class_exists(Normalizer::class)) {
            return $value;
        }

        return Normalizer::normalize($value, Normalizer::FORM_C) ?: $value;
    }
}
