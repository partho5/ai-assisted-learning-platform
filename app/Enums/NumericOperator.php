<?php

namespace App\Enums;

enum NumericOperator: string
{
    case Eq = 'eq';
    case Gt = 'gt';
    case Gte = 'gte';
    case Lt = 'lt';
    case Lte = 'lte';

    public function label(): string
    {
        return match ($this) {
            self::Eq => '= (equal to)',
            self::Gt => '> (greater than)',
            self::Gte => '>= (greater than or equal)',
            self::Lt => '< (less than)',
            self::Lte => '<= (less than or equal)',
        };
    }
}
