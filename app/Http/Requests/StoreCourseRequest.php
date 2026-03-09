<?php

namespace App\Http\Requests;

use App\Enums\CourseDifficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'what_you_will_learn' => ['required', 'string'],
            'prerequisites' => ['nullable', 'string'],
            'difficulty' => ['required', Rule::enum(CourseDifficulty::class)],
            'estimated_duration' => ['nullable', 'integer', 'min:1'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'thumbnail' => ['nullable', 'url', 'max:2048'],
            'price' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'currency' => ['nullable', 'string', 'size:3'],
            'billing_type' => ['nullable', Rule::in(['one_time', 'subscription'])],
            'subscription_duration_months' => ['nullable', 'integer', 'min:1', 'max:120'],
        ];
    }
}
