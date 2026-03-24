<?php

namespace App\Http\Requests;

use App\Enums\NumericOperator;
use App\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTestQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $questionType = QuestionType::tryFrom($this->input('question_type'));

        return [
            'question_type' => ['required', Rule::enum(QuestionType::class)],
            'body' => ['required', 'string'],
            'hint' => ['nullable', 'string'],
            'points' => ['nullable', 'integer', 'min:1'],
            'numeric_operator' => [
                Rule::requiredIf($questionType?->isNumericComparison() ?? false),
                'nullable',
                Rule::enum(NumericOperator::class),
            ],
            'correct_answer' => ['nullable', 'string'],
            'ai_rubric' => ['nullable', 'string'],
            'ai_help_enabled' => ['boolean'],
            'is_required' => ['boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
            'options' => ['nullable', 'array'],
            'options.*.id' => ['nullable', 'integer'],
            'options.*.label' => ['required_with:options', 'string', 'max:500'],
            'options.*.is_correct' => ['nullable', 'boolean'],
        ];
    }
}
