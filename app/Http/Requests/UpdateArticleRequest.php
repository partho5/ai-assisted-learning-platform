<?php

namespace App\Http\Requests;

use App\Enums\ArticleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateArticleRequest extends FormRequest
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
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $articleId = $this->route('article')?->id;

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('articles', 'slug')->ignore($articleId), 'regex:/^[a-z0-9\-]+$/'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'featured_image' => ['nullable', 'url', 'max:2048'],
            'featured_image_alt' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'status' => ['required', Rule::enum(ArticleStatus::class)],
            'publish_at' => ['required_if:status,scheduled', 'nullable', 'date'],
        ];
    }
}
