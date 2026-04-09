<?php

namespace App\Observers;

use App\Models\PortfolioProjectMedia;
use App\Services\CloudinaryService;

class PortfolioProjectMediaObserver
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function deleted(PortfolioProjectMedia $media): void
    {
        if ($media->type === 'image') {
            $this->cloudinary->delete($media->url);
        }
    }
}
