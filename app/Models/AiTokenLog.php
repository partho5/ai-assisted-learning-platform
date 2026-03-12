<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiTokenLog extends Model
{
    protected $fillable = ['model', 'method', 'input_tokens', 'output_tokens', 'cost_cents'];

    /**
     * OpenAI pricing in cents per 1M tokens (as of March 2025).
     * Update if pricing changes.
     */
    private static array $PRICING = [
        'gpt-4o-mini' => ['input' => 15, 'output' => 60],        // cents per 1M tokens
        'text-embedding-3-small' => ['input' => 2, 'output' => 0], // cents per 1M tokens
    ];

    /**
     * Calculate cost in cents given model, input tokens, and output tokens.
     */
    public static function calculateCost(string $model, int $inputTokens, ?int $outputTokens = null): int
    {
        $pricing = self::$PRICING[$model] ?? ['input' => 0, 'output' => 0];
        $inputCost = ($inputTokens / 1_000_000) * $pricing['input'];
        $outputCost = $outputTokens ? (($outputTokens / 1_000_000) * $pricing['output']) : 0;

        return (int) round($inputCost + $outputCost);
    }
}
