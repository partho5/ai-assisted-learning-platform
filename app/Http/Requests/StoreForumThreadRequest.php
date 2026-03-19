<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreForumThreadRequest extends FormRequest
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
            'body' => ['required', 'string'],
            'category_id' => ['required', 'integer', 'exists:forum_categories,id'],
            'tags' => ['nullable', 'array', 'max:'.config('forum.max_tags_per_thread', 5)],
            'tags.*' => ['string', 'max:50'],
            'resource_id' => ['nullable', 'integer', 'exists:resources,id'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'title.required' => 'Please provide a title for your thread.',
            'body.required' => 'Thread body cannot be empty.',
            'category_id.required' => 'Please select a category.',
            'category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
