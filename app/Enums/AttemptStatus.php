<?php

namespace App\Enums;

enum AttemptStatus: string
{
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Grading = 'grading';
    case Graded = 'graded';
    case Endorsed = 'endorsed';

    public function isComplete(): bool
    {
        return $this === self::Endorsed;
    }

    public function isPendingReview(): bool
    {
        return in_array($this, [self::Submitted, self::Graded]);
    }
}
