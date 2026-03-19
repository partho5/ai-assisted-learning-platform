<x-emails.layout :subject="'You\'re enrolled in ' . $courseTitle">
    <span class="badge success">Enrollment Confirmed</span>
    <h1>Welcome to the course, {{ $userName }}!</h1>
    <p class="subtitle">You've successfully enrolled. Start learning at your own pace — your progress is saved automatically.</p>

    <div class="detail-box">
        <div class="detail-row">
            <span class="detail-label">Course</span>
            <span class="detail-value">{{ $courseTitle }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Access</span>
            <span class="detail-value highlight">Free</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Enrolled On</span>
            <span class="detail-value">{{ $enrolledAt }}</span>
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
