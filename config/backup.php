<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Database Backup Configuration
    |--------------------------------------------------------------------------
    |
    | Controls how often the database is backed up and how many copies to keep
    | on Dropbox. The local dump is written to storage/app/backups/ and then
    | uploaded; the local file is deleted after a successful upload.
    |
    */

    'interval_hours' => (int) env('DB_BACKUP_INTERVAL_HOURS', 24),

    'keep_copies' => 2,

    'dropbox_folder' => '/db-backups',

];
