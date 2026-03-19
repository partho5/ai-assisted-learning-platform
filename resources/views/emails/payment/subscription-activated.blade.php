<x-emails.layout :subject="'Subscription Active — ' . $courseTitle">
    <span class="badge success">Subscription Active</span>
    <h1>Welcome aboard, {{ $userName }}!</h1>
    <p class="subtitle">Your subscription is now active. Enjoy uninterrupted access for the duration below.</p>

    <div class="detail-box">
        <div class="detail-row">
            <span class="detail-label">Course</span>
            <span class="detail-value">{{ $courseTitle }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Billing</span>
            <span class="detail-value">{{ $currency }} {{ number_format($finalAmount, 2) }} / month</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Access Until</span>
            <span class="detail-value highlight">{{ $expiresAt }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Started</span>
            <span class="detail-value">{{ $startedAt }}</span>
        </div>
    </div>

    <div class="btn-center">
        <a href="{{ $courseUrl }}" class="btn">Go to Course</a>
    </div>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; text-align:center; margin:0;">
        You can manage your subscription from your account settings at any time.
    </p>
</x-emails.layout>
