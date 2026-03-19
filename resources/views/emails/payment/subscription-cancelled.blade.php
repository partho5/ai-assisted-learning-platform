<x-emails.layout :subject="'Subscription Cancelled — ' . $courseTitle">
    <span class="badge warning">Subscription Cancelled</span>
    <h1>Your subscription has been cancelled</h1>
    <p class="subtitle">Hi {{ $userName }}, we're sorry to see you go. Your subscription to the course below has been cancelled.</p>

    <div class="detail-box">
        <div class="detail-row">
            <span class="detail-label">Course</span>
            <span class="detail-value">{{ $courseTitle }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value" style="color:#92400e;">Cancelled</span>
        </div>
    </div>

    <p>No further charges will be made. If you believe this was a mistake or have any questions, please reply to this email.</p>

    <div class="btn-center">
        <a href="{{ $coursesUrl }}" class="btn">Browse Courses</a>
    </div>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; text-align:center; margin:0;">
        You can re-enroll at any time from our course catalog.
    </p>
</x-emails.layout>
