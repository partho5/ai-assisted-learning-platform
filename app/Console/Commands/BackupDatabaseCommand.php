<?php

namespace App\Console\Commands;

use App\Services\DropboxBackupUploader;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'backup:database';

    protected $description = 'Dump the PostgreSQL database to a .sql file and upload it to Dropbox, keeping the last 2 copies.';

    public function handle(DropboxBackupUploader $dropbox): int
    {
        $filename = 'skill_evidence_'.now()->format('Y-m-d_H-i-s').'.sql';
        $localDir = storage_path('app/backups');
        $localPath = "{$localDir}/{$filename}";

        if (! is_dir($localDir)) {
            mkdir($localDir, 0755, true);
        }

        $this->info("Starting database backup → {$filename}");

        $this->dump($localPath);
        $this->info('Dump complete. Uploading to Dropbox…');

        $dropbox->uploadAndPrune($localPath, $filename);
        $this->info('Uploaded. Pruning old copies done.');

        @unlink($localPath);
        $this->info('Local file cleaned up. Backup complete.');

        return self::SUCCESS;
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    private function dump(string $localPath): void
    {
        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');
        $user = config('database.connections.pgsql.username');
        $password = config('database.connections.pgsql.password');
        $dbname = config('database.connections.pgsql.database');

        $result = Process::env(['PGPASSWORD' => $password])
            ->run(['pg_dump', '-h', $host, '-p', $port, '-U', $user, '-F', 'p', '-f', $localPath, $dbname]);

        if ($result->failed()) {
            throw new \RuntimeException('pg_dump failed: '.$result->errorOutput());
        }
    }
}
