<?php

namespace App\Observers;

use App\Models\Resource;
use App\Services\CloudinaryService;

class ResourceObserver
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function updating(Resource $resource): void
    {
        if ($resource->isDirty('url') && $resource->getOriginal('url')) {
            $oldUrl = $resource->getOriginal('url');
            if ($this->cloudinary->isCloudinaryUrl($oldUrl)) {
                $this->cloudinary->delete($oldUrl);
            }
        }
    }

    public function deleted(Resource $resource): void
    {
        if ($resource->url && $this->cloudinary->isCloudinaryUrl($resource->url)) {
            $this->cloudinary->delete($resource->url);
        }
    }
}
