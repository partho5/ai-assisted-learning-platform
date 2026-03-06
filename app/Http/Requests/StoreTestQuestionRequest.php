<?php

namespace App\Http\Requests;

use App\Enums\EvaluationMethod;
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
        return [
            'question_type' => ['required', Rule::enum(QuestionType::class)],
            'body' => ['required', 'string'],
            'hint' => ['nullable', 'string'],
            'points' => ['nullable', 'integer', 'min:1'],
            'evaluation_method' => ['required', Rule::enum(EvaluationMethod::class)],
            'numeric_operator' => [
                Rule::requiredIf($this->evaluation_method === EvaluationMethod::NumericComparison->value),
                'nullable',
                Rule::enum(NumericOperator::class),
            ],
            'correct_answer' => ['nullable', 'string'],
            'ai_rubric' => ['nullable', 'string'],
            'ai_help_enabled' => ['boolean'],
            'is_required' => ['boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
