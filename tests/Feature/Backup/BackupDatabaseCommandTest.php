<?php

namespace Tests\Feature\Backup;

use App\Services\DropboxBackupUploader;
use Illuminate\Support\Facades\Process;
use Tests\TestCase;

class BackupDatabaseCommandTest extends TestCase
{
    public function test_backup_command_calls_pg_dump_and_uploads_to_dropbox(): void
    {
        Process::fake();

        $uploader = $this->mock(DropboxBackupUploader::class);
        $uploader->shouldReceive('uploadAndPrune')
            ->once()
            ->withArgs(function (string $localPath, string $filename) {
                return str_ends_with($filename, '.sql') && str_starts_with($filename, 'skill_evidence_');
            });

        $this->artisan('backup:database')->assertSuccessful();

        Process::assertRan(fn ($process) => in_array('pg_dump', $process->command));
    }

    public function test_backup_command_throws_when_pg_dump_fails(): void
    {
        Process::fake([
            '*' => Process::result(exitCode: 1, errorOutput: 'pg_dump: connection failed'),
        ]);

        $this->mock(DropboxBackupUploader::class)
            ->shouldNotReceive('uploadAndPrune');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/pg_dump failed/');

        $this->artisan('backup:database');
    }
}
