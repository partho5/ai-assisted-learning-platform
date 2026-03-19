<?php

namespace App\Enums;

enum ForumReportReason: string
{
    case Spam = 'spam';
    case Misinformation = 'misinformation';
    case OffTopic = 'off-topic';
    case Inappropriate = 'inappropriate';
}
