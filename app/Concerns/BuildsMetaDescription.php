<?php

namespace App\Concerns;

trait BuildsMetaDescription
{
    /**
     * Per-locale character budgets for a meta description.
     *
     * Google truncates SERP descriptions by pixel width (roughly 920px), not by
     * character count, and Bengali glyphs are considerably wider per character
     * than Latin — so Bengali gets a smaller budget to land in the same space.
     */
    private const DESCRIPTION_LIMITS = [
        'bn' => 120,
        'en' => 160,
    ];

    /**
     * Build a truncated, single-line meta description from arbitrary content.
     *
     * Uses grapheme-aware truncation: `mb_substr` counts code points, so it
     * splits Bengali conjuncts mid-cluster ('ওয়েব ডেভেলপমেন্ট' cut at 9 code
     * points yields the broken 'ওয়েব ডেভ'). Cutting on grapheme clusters keeps
     * every vowel sign attached to its consonant.
     */
    protected function metaDescription(?string $value, ?string $locale = null): string
    {
        $text = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $value)) ?? '');

        if ($text === '') {
            return '';
        }

        $limit = self::DESCRIPTION_LIMITS[$locale ?? app()->getLocale()]
            ?? self::DESCRIPTION_LIMITS['en'];

        if (grapheme_strlen($text) <= $limit) {
            return $text;
        }

        $truncated = grapheme_substr($text, 0, $limit);

        /** Prefer a word boundary, but never give back a stub. */
        $lastSpace = mb_strrpos($truncated, ' ');
        if ($lastSpace !== false && $lastSpace > (int) ($limit * 0.6)) {
            $truncated = mb_substr($truncated, 0, $lastSpace);
        }

        return rtrim($truncated, " \t\n\r\0\x0B.,;:-").'…';
    }
}
