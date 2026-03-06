<?php

namespace App\Enums;

enum ResourceCompletionStatus: string
{
    case Incomplete = 'incomplete';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Endorsed = 'endorsed';

    public function isComplete(): bool
    {
        return $this === self::Endorsed;
    }
}
