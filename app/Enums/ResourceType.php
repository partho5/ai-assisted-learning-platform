<?php

namespace App\Enums;

enum ResourceType: string
{
    case Video = 'video';
    case Article = 'article';
    case Text = 'text';
    case Document = 'document';
    case Audio = 'audio';
    case Image = 'image';
    case Assignment = 'assignment';
}
