<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    /** Mentors and admins can create articles. */
    public function create(User $user): bool
    {
        return $user->isMentor() || $user->isAdmin();
    }

    /** Author or admin can edit. */
    public function update(User $user, Article $article): bool
    {
        return $user->isAdmin() || $article->author_id === $user->id;
    }

    /** Author or admin can delete. */
    public function delete(User $user, Article $article): bool
    {
        return $user->isAdmin() || $article->author_id === $user->id;
    }
}
