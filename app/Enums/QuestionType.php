<?php

namespace App\Enums;

enum QuestionType: string
{
    case ShortText = 'short_text';
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

    public function supportsNumericComparison(): bool
    {
        return $this === self::ShortText;
    }
}
