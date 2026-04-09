<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePortfolioProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->tech_tags)) {
            $this->merge([
                'tech_tags' => array_filter(array_map('trim', explode(',', $this->tech_tags))),
            ]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:portfolio_categories,id'],
            'featured_image' => ['nullable', 'url', 'max:500'],
            'external_url' => ['nullable', 'url', 'max:500'],
            'tech_tags' => ['nullable', 'array'],
            'tech_tags.*' => ['string', 'max:50'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'is_published' => ['required', 'boolean'],
            'media' => ['nullable', 'array', 'max:20'],
            'media.*.type' => ['required', 'in:image,youtube'],
            'media.*.url' => ['required', 'url', 'max:500'],
        ];
    }
}
