<?php

namespace App\Http\Requests;

use App\Enums\CourseDifficulty;
use App\Enums\CourseLanguage;
use App\Enums\CourseStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'language' => ['required', Rule::enum(CourseLanguage::class)],
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'is_featured' => ['sometimes', 'boolean'],
            'description' => ['required', 'string'],
            'what_you_will_learn' => ['required', 'string'],
            'prerequisites' => ['nullable', 'string'],
            'difficulty' => ['required', Rule::enum(CourseDifficulty::class)],
            'estimated_duration' => ['nullable', 'integer', 'min:1'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'thumbnail' => ['nullable', 'url', 'max:2048'],
            'status' => ['sometimes', Rule::enum(CourseStatus::class)],
            'price' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
            'currency' => ['nullable', 'string', 'size:3'],
            'billing_type' => ['nullable', Rule::in(['one_time', 'subscription'])],
            'subscription_duration_months' => ['nullable', 'integer', 'min:1', 'max:120'],
        ];
    }
}
