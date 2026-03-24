<?php

namespace App\Enums;

enum QuestionType: string
{
    case Paragraph = 'paragraph';
    case MultipleChoice = 'multiple_choice';
    case Checkboxes = 'checkboxes';
    case Dropdown = 'dropdown';
    case Date = 'date';
    case Time = 'time';

    public function hasOptions(): bool
    {
        return in_array($this, [self::MultipleChoice, self::Checkboxes, self::Dropdown]);
    }

    public function isAiGraded(): bool
    {
        return $this === self::Paragraph;
    }

    public function isNumericComparison(): bool
    {
        return in_array($this, [self::Date, self::Time]);
    }

    /** Derive the correct evaluation method for this question type. */
    public function defaultEvaluationMethod(): EvaluationMethod
    {
        if ($this->isAiGraded()) {
            return EvaluationMethod::AiGraded;
        }

        if ($this->isNumericComparison()) {
            return EvaluationMethod::NumericComparison;
        }

        return EvaluationMethod::ExactMatch;
    }
}
