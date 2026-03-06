<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Mentor = 'mentor';
    case Learner = 'learner';
}
