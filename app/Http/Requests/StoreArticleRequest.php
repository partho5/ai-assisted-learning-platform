<?php

namespace App\Http\Requests;

use App\Enums\ArticleStatus;
use App\Enums\ContentLanguage;
use App\Services\SlugGenerator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Convert comma-separated tags string to array
        if (is_string($this->tags)) {
            $this->merge([
                'tags' => array_filter(array_map('trim', explode(',', $this->tags))),
            ]);
        }

        /**
         * Default to the locale the author is writing under — the same rule
         * forum threads follow. Keeps the field required without forcing every
         * caller to restate the obvious.
         */
        if (! $this->filled('language')) {
            $this->merge(['language' => app()->getLocale()]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:articles,slug', 'regex:'.SlugGenerator::pattern()],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'featured_image' => ['nullable', 'url', 'max:2048'],
            'featured_image_alt' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'status' => ['required', Rule::enum(ArticleStatus::class)],
            'publish_at' => ['required_if:status,scheduled', 'nullable', 'date'],
            'language' => ['required', Rule::enum(ContentLanguage::class)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug may only contain Bengali or lowercase English letters, numbers, and hyphens.',
        ];
    }
}
