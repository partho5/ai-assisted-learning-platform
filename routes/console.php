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

// Auto-publish articles whose scheduled publish time has arrived.
Schedule::command('articles:publish-scheduled')->everyMinute()->withoutOverlapping();

// Check for unanswered forum threads and dispatch AI replies every 30 minutes.
Schedule::command('forum:trigger-unanswered')->everyThirtyMinutes()->withoutOverlapping();

// Back up the PostgreSQL database and upload to Dropbox every N hours (DB_BACKUP_INTERVAL_HOURS).
// Keeps only the last 2 copies on Dropbox; local dump is deleted after upload.
Schedule::command('backup:database')
    ->cron(sprintf('0 */%d * * *', config('backup.interval_hours', 24)))
    ->withoutOverlapping()
    ->runInBackground();
