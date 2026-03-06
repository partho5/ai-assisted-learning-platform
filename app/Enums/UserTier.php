<?php

namespace App\Enums;

enum UserTier: int
{
    case Free = 0;
    case Observer = 1;
    case Paid = 2;
}
