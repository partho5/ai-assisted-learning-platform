<?php

namespace App\Concerns;

use App\Enums\ContentLanguage;
use BackedEnum;
use Illuminate\Database\Eloquent\Builder;

/**
 * Shared behaviour for content models that live in exactly one language.
 *
 * Mirrors the `language` column and `scopeByLanguage()` that {@see \App\Models\Course}
 * already carries, so listings and the locale guard treat every content type alike.
 */
trait HasContentLanguage
{
    /**
     * Restrict a query to a single content language.
     *
     * @param  Builder<static>  $query
     */
    public function scopeByLanguage(Builder $query, string $language): void
    {
        $query->where('language', $language);
    }

    /**
     * Whether this record belongs to the given locale.
     */
    public function isInLanguage(string $locale): bool
    {
        return $this->contentLanguage()->value === $locale;
    }

    /**
     * The record's language as a {@see ContentLanguage}, falling back to the
     * application default for rows written before the column existed.
     *
     * Accepts a raw string or any backed enum, since `Course` casts this column
     * to its own {@see \App\Enums\CourseLanguage} rather than to ContentLanguage.
     */
    public function contentLanguage(): ContentLanguage
    {
        $language = $this->getAttribute('language');

        if ($language instanceof ContentLanguage) {
            return $language;
        }

        if ($language instanceof BackedEnum) {
            $language = $language->value;
        }

        return ContentLanguage::tryFrom((string) $language)
            ?? ContentLanguage::from(config('app.locale'));
    }
}
