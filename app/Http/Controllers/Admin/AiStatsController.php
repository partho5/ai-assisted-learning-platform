<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiTokenLog;
use Illuminate\Support\Facades\DB;

class AiStatsController extends Controller
{
    public function index()
    {
        // Aggregated stats grouped by model and method
        $stats = AiTokenLog::query()
            ->selectRaw('
                model,
                method,
                COUNT(*) as call_count,
                SUM(input_tokens) as total_input_tokens,
                SUM(output_tokens) as total_output_tokens,
                SUM(cost_cents) as total_cost_cents,
                MIN(created_at) as first_call_at,
                MAX(created_at) as last_call_at
            ')
            ->groupByRaw('model, method')
            ->orderByRaw('total_cost_cents DESC')
            ->get()
            ->map(function ($row) {
                return [
                    'model' => $row->model,
                    'method' => $row->method,
                    'call_count' => $row->call_count,
                    'total_input_tokens' => $row->total_input_tokens ?? 0,
                    'total_output_tokens' => $row->total_output_tokens ?? 0,
                    'total_cost_usd' => round(($row->total_cost_cents ?? 0) / 100, 4),
                    'first_call_at' => $row->first_call_at,
                    'last_call_at' => $row->last_call_at,
                ];
            });

        // Overall summary
        $summary = [
            'total_calls' => AiTokenLog::count(),
            'total_cost_usd' => round(AiTokenLog::sum(DB::raw('cost_cents')) / 100, 4),
            'total_input_tokens' => AiTokenLog::sum('input_tokens') ?? 0,
            'total_output_tokens' => AiTokenLog::sum('output_tokens') ?? 0,
        ];

        // Cost by model
        $costByModel = AiTokenLog::query()
            ->selectRaw('model, SUM(cost_cents) as cost_cents, COUNT(*) as count')
            ->groupBy('model')
            ->orderByRaw('SUM(cost_cents) DESC')
            ->pluck('cost_cents', 'model')
            ->map(fn ($cents) => round($cents / 100, 4));

        // Cost by method
        $costByMethod = AiTokenLog::query()
            ->selectRaw('method, SUM(cost_cents) as cost_cents, COUNT(*) as count')
            ->groupBy('method')
            ->orderByRaw('SUM(cost_cents) DESC')
            ->pluck('cost_cents', 'method')
            ->map(fn ($cents) => round($cents / 100, 4));

        return inertia('admin/ai-stats', [
            'stats' => $stats,
            'summary' => $summary,
            'costByModel' => $costByModel,
            'costByMethod' => $costByMethod,
        ]);
    }
}
