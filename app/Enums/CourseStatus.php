<?php

namespace App\Enums;

enum CourseStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Published = 'published';
}
