<?php

namespace App\Observers;

use App\Models\Course;
use App\Services\CloudinaryService;

class CourseObserver
{
    public function __construct(private CloudinaryService $cloudinary) {}

    public function updating(Course $course): void
    {
        if ($course->isDirty('thumbnail') && $course->getOriginal('thumbnail')) {
            $this->cloudinary->delete($course->getOriginal('thumbnail'));
        }
    }

    public function deleted(Course $course): void
    {
        if ($course->thumbnail) {
            $this->cloudinary->delete($course->thumbnail);
        }
    }
}
