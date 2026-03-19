<?php

namespace App\Mail;

use App\Models\Course;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly Course $course,
        public readonly Payment $payment,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->user->email,
            subject: 'Payment Confirmed — '.$this->course->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment.confirmed',
            with: [
                'userName' => $this->user->name,
                'courseTitle' => $this->course->title,
                'courseUrl' => route('courses.show', ['locale' => config('app.locale'), 'course' => $this->course->slug]),
                'originalAmount' => (float) $this->payment->original_amount,
                'discountAmount' => (float) $this->payment->discount_amount,
                'finalAmount' => (float) $this->payment->final_amount,
                'currency' => strtoupper($this->payment->currency),
                'paidAt' => $this->payment->created_at->format('d M Y, H:i'),
            ],
        );
    }
}
