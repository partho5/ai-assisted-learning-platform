<?php

namespace App\Observers;

use App\Models\Article;
use App\Services\CloudinaryService;

class ArticleObserver
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function updating(Article $article): void
    {
        if ($article->isDirty('featured_image') && $article->getOriginal('featured_image')) {
            $this->cloudinary->delete($article->getOriginal('featured_image'));
        }
    }

    public function deleted(Article $article): void
    {
        if ($article->featured_image) {
            $this->cloudinary->delete($article->featured_image);
        }
    }
}
