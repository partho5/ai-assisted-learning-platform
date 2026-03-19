<x-emails.layout :subject="'Payment Confirmed — ' . $courseTitle">
    <span class="badge success">Payment Confirmed</span>
    <h1>You're enrolled, {{ $userName }}!</h1>
    <p class="subtitle">Your payment was successful. You now have full access to the course below.</p>

    <div class="detail-box">
        <div class="detail-row">
            <span class="detail-label">Course</span>
            <span class="detail-value">{{ $courseTitle }}</span>
        </div>
        @if($discountAmount > 0)
        <div class="detail-row">
            <span class="detail-label">Original Price</span>
            <span class="detail-value">{{ $currency }} {{ number_format($originalAmount, 2) }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Discount</span>
            <span class="detail-value" style="color:#065f46;">− {{ $currency }} {{ number_format($discountAmount, 2) }}</span>
        </div>
        @endif
        <div class="detail-row">
            <span class="detail-label">Amount Paid</span>
            <span class="detail-value highlight">
                {{ $finalAmount > 0 ? $currency . ' ' . number_format($finalAmount, 2) : 'Free (coupon applied)' }}
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ $paidAt }}</span>
        </div>
    </div>

    <div class="btn-center">
        <a href="{{ $courseUrl }}" class="btn">Start Learning</a>
    </div>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; text-align:center; margin:0;">
        Questions? Reply to this email and we'll be happy to help.
    </p>
</x-emails.layout>
