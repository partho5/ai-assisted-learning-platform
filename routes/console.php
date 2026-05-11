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

// Nudge enrolled_count up by 1 on a random 1-in-3 subset of published courses every 6 hours.
// Offset to 1:12/7:12/13:12/19:12 to avoid contention with heavier scheduled jobs.
Schedule::command('bots:enroll-count')
    ->cron('12 1,7,13,19 * * *')
    ->withoutOverlapping(300)   // 5-hour TTL — auto-releases before next 6-hour run if process crashes
    ->runInBackground();

// Back up the PostgreSQL database and upload to Dropbox every N hours (DB_BACKUP_INTERVAL_HOURS).
// Keeps only the last 2 copies on Dropbox; local dump is deleted after upload.
Schedule::command('backup:database')
    ->cron(sprintf('0 */%d * * *', config('backup.interval_hours', 24)))
    ->withoutOverlapping()
    ->runInBackground();
