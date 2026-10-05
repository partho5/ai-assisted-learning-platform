<?php

namespace App\Contracts;

interface Tool
{
    public function slug(): string;

    public function name(): string;

    public function description(): string;

    /**
     * Inertia page component that renders this tool.
     */
    public function component(): string;

    /**
     * @return array{title: string, description: string}
     */
    public function meta(): array;
}
