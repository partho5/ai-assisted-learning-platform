<?php

namespace App\Observers;

use App\Models\PortfolioProject;
use App\Services\CloudinaryService;

class PortfolioProjectObserver
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function updating(PortfolioProject $project): void
    {
        if ($project->isDirty('featured_image') && $project->getOriginal('featured_image')) {
            $this->cloudinary->delete($project->getOriginal('featured_image'));
        }
    }

    public function deleted(PortfolioProject $project): void
    {
        if ($project->featured_image) {
            $this->cloudinary->delete($project->featured_image);
        }

        foreach ($project->media as $media) {
            if ($media->type === 'image') {
                $this->cloudinary->delete($media->url);
            }
        }
    }
}
