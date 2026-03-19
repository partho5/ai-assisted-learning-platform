<?php

namespace App\Mail;

use App\Models\Course;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CourseEnrolledMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly Course $course,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->user->email,
            subject: 'You\'re enrolled in '.$this->course->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.enrollment.welcome',
            with: [
                'userName' => $this->user->name,
                'courseTitle' => $this->course->title,
                'courseUrl' => route('courses.show', ['locale' => config('app.locale'), 'course' => $this->course->slug]),
                'enrolledAt' => now()->format('d M Y'),
            ],
        );
    }
}
