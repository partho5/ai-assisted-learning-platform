<?php

namespace App\Observers;

use App\Models\User;
use App\Services\CloudinaryService;

class UserObserver
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function updating(User $user): void
    {
        if ($user->isDirty('avatar') && $user->getOriginal('avatar')) {
            $this->cloudinary->delete($user->getOriginal('avatar'));
        }
    }

    public function deleted(User $user): void
    {
        if ($user->avatar) {
            $this->cloudinary->delete($user->avatar);
        }
    }
}
