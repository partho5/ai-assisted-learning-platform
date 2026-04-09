<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePortfolioSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'bio' => ['nullable', 'string', 'max:2000'],
            'secondary_bio' => ['nullable', 'string', 'max:2000'],
            'services' => ['nullable', 'array', 'max:10'],
            'services.*.headline' => ['required', 'string', 'max:100'],
            'services.*.description' => ['nullable', 'string', 'max:500'],
            'skill_tags' => ['nullable', 'array', 'max:20'],
            'skill_tags.*' => ['string', 'max:50'],
            'is_published' => ['required', 'boolean'],
        ];
    }
}
