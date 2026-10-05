<?php

namespace App\Services\Tools;

use App\Contracts\Tool;

class ToolRegistry
{
    /**
     * @var array<int, class-string<Tool>>
     */
    protected const TOOLS = [
        UnicodeBoldManager::class,
    ];

    /**
     * @return array<int, Tool>
     */
    public function all(): array
    {
        return array_map(fn (string $class): Tool => app($class), self::TOOLS);
    }

    public function find(string $slug): ?Tool
    {
        foreach ($this->all() as $tool) {
            if ($tool->slug() === $slug) {
                return $tool;
            }
        }

        return null;
    }
}
