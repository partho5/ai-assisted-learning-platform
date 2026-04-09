<x-emails.layout :subject="$messageSubject ? 'Portfolio Contact: ' . $messageSubject : 'New Portfolio Message'">
    <span class="badge success">New Message</span>
    <h1>Hi {{ $ownerName }}, you have a new portfolio message!</h1>

    <div class="detail-box">
        <div class="detail-row">
            <span class="detail-label">From</span>
            <span class="detail-value">{{ $senderName }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ $senderEmail }}</span>
        </div>
        @if($messageSubject)
        <div class="detail-row">
            <span class="detail-label">Subject</span>
            <span class="detail-value">{{ $messageSubject }}</span>
        </div>
        @endif
    </div>

    <div style="background:#f9fafb; border-radius:8px; padding:16px; margin:24px 0; border-left:4px solid #6366f1;">
        <p style="margin:0; white-space:pre-wrap; color:#374151;">{{ $messageBody }}</p>
    </div>

    <div class="btn-center">
        <a href="{{ $dashboardUrl }}" class="btn">View in Dashboard</a>
    </div>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; text-align:center; margin:0;">
        You can reply directly to the sender at {{ $senderEmail }}.
    </p>
</x-emails.layout>
