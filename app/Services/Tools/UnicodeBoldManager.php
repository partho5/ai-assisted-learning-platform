<?php

namespace App\Services\Tools;

use App\Contracts\Tool;

class UnicodeBoldManager implements Tool
{
    public function slug(): string
    {
        return 'bold-text-generator-editor';
    }

    public function name(): string
    {
        return 'Bold Text Generator & Editor';
    }

    public function description(): string
    {
        return 'Turn plain text into bold or italic Unicode text, or style just part of a sentence, then paste it anywhere.';
    }

    public function component(): string
    {
        return 'tools/bold-text-generator-editor';
    }

    /**
     * @return array{title: string, description: string}
     */
    public function meta(): array
    {
        return [
            'title' => 'Bold Text Generator & Editor — Copy and Paste Bold Unicode Text',
            'description' => 'Free bold and italic text generator. Convert text or style only selected words, then copy and paste into LinkedIn, X, Instagram, WhatsApp, Discord and bios.',
        ];
    }
}
