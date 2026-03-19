<?php

namespace App\Http\Requests;

use App\Enums\ForumReportReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreForumReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'reason' => ['required', new Enum(ForumReportReason::class)],
        ];
    }
}
