<x-emails.layout :subject="'Refund Processed — ' . $courseTitle">
    <span class="badge danger">Refund Processed</span>
    <h1>Your refund is on its way</h1>
    <p class="subtitle">Hi {{ $userName }}, your refund has been processed and will appear on your original payment method within 5–10 business days.</p>

    <div class="detail-box">
        <div class="detail-row">
            <span class="detail-label">Course</span>
            <span class="detail-value">{{ $courseTitle }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Refund Amount</span>
            <span class="detail-value highlight">{{ $currency }} {{ number_format($finalAmount, 2) }}</span>
        </div>
    </div>

    <p>If you did not request this refund or have any questions, please reply to this email immediately.</p>

    <div class="btn-center">
        <a href="{{ $coursesUrl }}" class="btn">Browse Courses</a>
    </div>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; text-align:center; margin:0;">
        Refund timelines may vary depending on your bank or card issuer.
    </p>
</x-emails.layout>
