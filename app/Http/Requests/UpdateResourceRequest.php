<?php

namespace App\Http\Requests;

use App\Enums\ResourceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $type = $this->input('type');
        $requiresUrl = in_array($type, [
            ResourceType::Video->value,
            ResourceType::Article->value,
            ResourceType::Document->value,
            ResourceType::Audio->value,
            ResourceType::Image->value,
        ]);

        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(ResourceType::class)],
            'why_this_resource' => [$type === ResourceType::Assignment->value ? 'nullable' : 'required', 'nullable', 'string'],
            'url' => [$requiresUrl ? 'required' : 'nullable', 'nullable', 'url', 'max:2048'],
            'content' => [$type === ResourceType::Text->value ? 'required' : 'nullable', 'string'],
            'caption' => ['nullable', 'string'],
            'estimated_time' => ['nullable', 'integer', 'min:1'],
            'mentor_note' => ['nullable', 'string'],
            'is_free' => ['boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
