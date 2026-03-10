<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Re-index changed course content daily at 3 AM.
// Only embeds chunks whose content_hash differs — zero cost for unchanged content.
Schedule::command('rag:index')->dailyAt('03:00');
