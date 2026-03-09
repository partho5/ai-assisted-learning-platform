<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AiChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:2000'],
            'history' => ['nullable', 'array', 'max:20'],
            'history.*.role' => ['required', 'string', 'in:user,assistant'],
            'history.*.content' => ['required', 'string', 'max:5000'],
            'courses' => ['nullable', 'array', 'max:30'],
            'courses.*.id' => ['required', 'integer'],
            'courses.*.title' => ['required', 'string', 'max:200'],
            'courses.*.description' => ['nullable', 'string', 'max:1000'],
            'courses.*.difficulty' => ['nullable', 'string', 'max:50'],
            'courses.*.category' => ['nullable', 'string', 'max:100'],
            'guest_user_id' => ['nullable', 'string', 'max:120'],
            'context_key' => ['nullable', 'string', 'max:100'],
            'context_url' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
