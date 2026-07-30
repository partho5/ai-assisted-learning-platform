<?php

namespace App\Enums;

/**
 * The primary language of a piece of authored content.
 *
 * This is an audience/dominant-language marker, NOT an assertion that the
 * content contains only this script. Bengali content routinely embeds English
 * passages (technical terms, code, quotations) and still belongs to `Bn`.
 *
 * The value must reflect the genuinely dominant language: search engines run
 * their own content-based language detection and will override a declared
 * `lang` attribute that disagrees with the visible text.
 *
 * Records are single-language by design — each piece of content lives under
 * exactly one locale, and {@see \App\Http\Middleware\EnsureContentLocale}
 * redirects requests that arrive under the wrong one.
 */
enum ContentLanguage: string
{
    case Bn = 'bn';
    case En = 'en';

    /**
     * The OpenGraph `og:locale` value for this language.
     */
    public function ogLocale(): string
    {
        return match ($this) {
            self::Bn => 'bn_BD',
            self::En => 'en_US',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Bn => 'বাংলা',
            self::En => 'English',
        };
    }
}
