<?php

namespace App\Http\Requests;

use App\Models\Module;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class StoreCourseImportRequest extends FormRequest
{
    /** Maximum accepted upload size, in kilobytes. */
    public const MAX_FILE_KB = 1024;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $course = $this->route('course');

        return [
            'file' => [
                'required',
                'file',
                'max:'.self::MAX_FILE_KB,
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! $value instanceof UploadedFile || strtolower($value->getClientOriginalExtension()) !== 'json') {
                        $fail('The file must be a .json file.');
                    }
                },
            ],
            'module_id' => [
                'nullable',
                'integer',
                Rule::exists((new Module)->getTable(), 'id')->where('course_id', $course?->id),
            ],
        ];
    }
}
