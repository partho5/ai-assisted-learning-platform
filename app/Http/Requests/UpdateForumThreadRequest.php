<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateForumThreadRequest extends FormRequest
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
        ];
    }
}
