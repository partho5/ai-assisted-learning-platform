<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    public function isCloudinaryUrl(string $url): bool
    {
        return str_contains($url, 'res.cloudinary.com');
    }

    /**
     * Extract the Cloudinary public ID from a URL.
     *
     * Handles URLs like:
     *   https://res.cloudinary.com/{cloud}/image/upload/v1234567890/folder/file.jpg
     *   https://res.cloudinary.com/{cloud}/image/upload/w_300,h_200/v1234567890/folder/file.jpg
     */
    public function extractPublicId(string $url): ?string
    {
        // Split on '/image/upload/' and take everything after
        $parts = explode('/image/upload/', $url, 2);
        if (count($parts) < 2) {
            return null;
        }

        $path = $parts[1];

        // Strip optional transformation segment (e.g. "w_300,h_200/")
        $path = preg_replace('#^[^/]*,[^/]*/+#', '', $path);

        // Strip version prefix (e.g. "v1234567890/")
        $path = preg_replace('#^v\d+/#', '', $path);

        // Strip file extension
        $path = preg_replace('#\.[a-z0-9]+$#i', '', $path);

        return $path ?: null;
    }

    /**
     * Delete an image from Cloudinary by URL.
     * Silently skips non-Cloudinary URLs or missing credentials.
     */
    public function delete(string $url): void
    {
        if (! $this->isCloudinaryUrl($url)) {
            return;
        }

        $publicId = $this->extractPublicId($url);
        if (! $publicId) {
            return;
        }

        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');

        if (! $cloudName || ! $apiKey || ! $apiSecret) {
            Log::warning('Cloudinary credentials not configured; skipping image deletion.', ['url' => $url]);

            return;
        }

        $timestamp = time();
        $signature = sha1("public_id={$publicId}&timestamp={$timestamp}{$apiSecret}");

        try {
            Http::post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
                'public_id' => $publicId,
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to delete Cloudinary image.', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
