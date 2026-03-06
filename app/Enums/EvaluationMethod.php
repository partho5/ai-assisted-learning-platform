<?php

namespace App\Enums;

enum EvaluationMethod: string
{
    case ExactMatch = 'exact_match';
    case NumericComparison = 'numeric_comparison';
    case AiGraded = 'ai_graded';
}
