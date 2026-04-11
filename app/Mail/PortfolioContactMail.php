<?php

namespace App\Mail;

use App\Models\PortfolioMessage;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PortfolioContactMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $portfolioOwner,
        public readonly PortfolioMessage $message,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->message->subject
            ? 'Portfolio Contact: '.$this->message->subject
            : 'New Portfolio Message from '.$this->message->sender_name;

        return new Envelope(
            to: $this->portfolioOwner->email,
            replyTo: [$this->message->sender_email],
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.portfolio.contact',
            with: [
                'ownerName' => $this->portfolioOwner->name,
                'senderName' => $this->message->sender_name,
                'senderEmail' => $this->message->sender_email,
                'messageSubject' => $this->message->subject,
                'messageBody' => $this->message->body,
                'dashboardUrl' => route('portfolio-builder.messages.index', ['locale' => config('app.locale')]),
            ],
        );
    }
}
