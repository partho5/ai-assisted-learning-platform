<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class DropboxBackupUploader
{
    private readonly string $token;

    private readonly string $folder;

    private readonly int $keepCopies;

    public function __construct()
    {
        $this->token = config('services.dropbox.access_token');
        $this->folder = config('backup.dropbox_folder');
        $this->keepCopies = config('backup.keep_copies');
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Upload a local file to Dropbox and prune old backups, keeping only
     * the configured number of most-recent copies.
     */
    public function uploadAndPrune(string $localPath, string $filename): void
    {
        $this->upload($localPath, $filename);
        $this->pruneOld();
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    private function upload(string $localPath, string $filename): void
    {
        $destination = "{$this->folder}/{$filename}";

        $response = Http::withToken($this->token)
            ->withHeaders([
                'Dropbox-API-Arg' => json_encode([
                    'path' => $destination,
                    'mode' => 'overwrite',
                    'autorename' => false,
                    'mute' => true,
                ]),
                'Content-Type' => 'application/octet-stream',
            ])
            ->withBody(file_get_contents($localPath), 'application/octet-stream')
            ->post('https://content.dropboxapi.com/2/files/upload');

        $this->throwIfFailed($response, "Dropbox upload failed for {$filename}");
    }

    private function pruneOld(): void
    {
        $entries = $this->listFolder();

        if (count($entries) <= $this->keepCopies) {
            return;
        }

        // Sort ascending by server_modified so oldest are first.
        usort($entries, fn ($a, $b) => strcmp($a['server_modified'], $b['server_modified']));

        $toDelete = array_slice($entries, 0, count($entries) - $this->keepCopies);

        foreach ($toDelete as $entry) {
            $this->delete($entry['path_lower']);
        }
    }

    /**
     * @return array<int, array{path_lower: string, server_modified: string}>
     */
    private function listFolder(): array
    {
        $response = Http::withToken($this->token)
            ->acceptJson()
            ->post('https://api.dropboxapi.com/2/files/list_folder', [
                'path' => $this->folder,
                'limit' => 100,
            ]);

        // If folder does not exist yet, return empty — first backup will create it.
        if ($response->status() === 409) {
            return [];
        }

        $this->throwIfFailed($response, 'Dropbox list_folder failed');

        return $response->json('entries', []);
    }

    private function delete(string $path): void
    {
        $response = Http::withToken($this->token)
            ->acceptJson()
            ->post('https://api.dropboxapi.com/2/files/delete_v2', ['path' => $path]);

        $this->throwIfFailed($response, "Dropbox delete failed for {$path}");
    }

    private function throwIfFailed(Response $response, string $message): void
    {
        if ($response->failed()) {
            throw new \RuntimeException("{$message}: ".$response->body());
        }
    }
}
