<?php

namespace Tests\Feature\Mail;

use App\Mail\CourseEnrolledMail;
use App\Mail\PaymentConfirmedMail;
use App\Mail\PaymentRefundedMail;
use App\Mail\SubscriptionActivatedMail;
use App\Mail\SubscriptionCancelledMail;
use App\Models\Course;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PaymentMailTest extends TestCase
{
    use RefreshDatabase;

    private function makePayment(User $user, Course $course, array $overrides = []): Payment
    {
        return Payment::create(array_merge([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => 'captured',
            'billing_type' => 'one_time',
            'original_amount' => 99.00,
            'discount_amount' => 0.00,
            'final_amount' => 99.00,
            'currency' => 'USD',
        ], $overrides));
    }

    // ─── PaymentConfirmedMail ─────────────────────────────────────────────────

    public function test_payment_confirmed_mail_is_queued(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => '99.00', 'billing_type' => 'one_time']);
        $payment = $this->makePayment($user, $course);

        Mail::queue(new PaymentConfirmedMail($user, $course, $payment));

        Mail::assertQueued(PaymentConfirmedMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_payment_confirmed_mail_contains_correct_data(): void
    {
        $user = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $course = Course::factory()->published()->create(['title' => 'Test Course', 'price' => '99.00', 'billing_type' => 'one_time']);
        $payment = $this->makePayment($user, $course, ['discount_amount' => 10.00, 'final_amount' => 89.00]);

        $mail = new PaymentConfirmedMail($user, $course, $payment);
        $content = $mail->content();

        $this->assertEquals('emails.payment.confirmed', $content->view);
        $this->assertEquals('John Doe', $content->with['userName']);
        $this->assertEquals('Test Course', $content->with['courseTitle']);
        $this->assertEquals(99.00, $content->with['originalAmount']);
        $this->assertEquals(10.00, $content->with['discountAmount']);
        $this->assertEquals(89.00, $content->with['finalAmount']);
        $this->assertEquals('USD', $content->with['currency']);
    }

    public function test_payment_confirmed_mail_subject_includes_course_title(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['title' => 'My Amazing Course', 'price' => '50.00', 'billing_type' => 'one_time']);
        $payment = $this->makePayment($user, $course);

        $mail = new PaymentConfirmedMail($user, $course, $payment);

        $this->assertEquals('Payment Confirmed — My Amazing Course', $mail->envelope()->subject);
    }

    // ─── SubscriptionActivatedMail ────────────────────────────────────────────

    public function test_subscription_activated_mail_is_queued(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => '9.99', 'billing_type' => 'subscription']);
        $payment = $this->makePayment($user, $course, ['billing_type' => 'subscription', 'status' => 'active']);

        Mail::queue(new SubscriptionActivatedMail($user, $course, $payment, '01 Apr 2026'));

        Mail::assertQueued(SubscriptionActivatedMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_subscription_activated_mail_contains_expiry_date(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => '9.99', 'billing_type' => 'subscription']);
        $payment = $this->makePayment($user, $course, ['billing_type' => 'subscription', 'status' => 'active']);

        $mail = new SubscriptionActivatedMail($user, $course, $payment, '01 Apr 2026');
        $content = $mail->content();

        $this->assertEquals('01 Apr 2026', $content->with['expiresAt']);
        $this->assertEquals('emails.payment.subscription-activated', $content->view);
    }

    // ─── SubscriptionCancelledMail ────────────────────────────────────────────

    public function test_subscription_cancelled_mail_is_queued(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => '9.99', 'billing_type' => 'subscription']);

        Mail::queue(new SubscriptionCancelledMail($user, $course));

        Mail::assertQueued(SubscriptionCancelledMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_subscription_cancelled_mail_subject_and_view(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['title' => 'Pro Plan', 'price' => '9.99', 'billing_type' => 'subscription']);

        $mail = new SubscriptionCancelledMail($user, $course);

        $this->assertEquals('Subscription Cancelled — Pro Plan', $mail->envelope()->subject);
        $this->assertEquals('emails.payment.subscription-cancelled', $mail->content()->view);
    }

    // ─── PaymentRefundedMail ──────────────────────────────────────────────────

    public function test_payment_refunded_mail_is_queued(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => '99.00', 'billing_type' => 'one_time']);
        $payment = $this->makePayment($user, $course, ['status' => 'refunded']);

        Mail::queue(new PaymentRefundedMail($user, $course, $payment));

        Mail::assertQueued(PaymentRefundedMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_payment_refunded_mail_contains_correct_amount(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => '99.00', 'billing_type' => 'one_time']);
        $payment = $this->makePayment($user, $course, ['final_amount' => 99.00, 'status' => 'refunded']);

        $mail = new PaymentRefundedMail($user, $course, $payment);
        $content = $mail->content();

        $this->assertEquals(99.00, $content->with['finalAmount']);
        $this->assertEquals('USD', $content->with['currency']);
        $this->assertEquals('emails.payment.refunded', $content->view);
    }

    // ─── CourseEnrolledMail ───────────────────────────────────────────────────

    public function test_course_enrolled_mail_is_queued(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $course = Course::factory()->published()->create(['price' => null, 'billing_type' => 'one_time']);

        Mail::queue(new CourseEnrolledMail($user, $course));

        Mail::assertQueued(CourseEnrolledMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_course_enrolled_mail_subject_and_data(): void
    {
        $user = User::factory()->create(['name' => 'Jane']);
        $course = Course::factory()->published()->create(['title' => 'Intro to AI', 'price' => null, 'billing_type' => 'one_time']);

        $mail = new CourseEnrolledMail($user, $course);

        $this->assertEquals("You're enrolled in Intro to AI", $mail->envelope()->subject);
        $this->assertEquals('emails.enrollment.welcome', $mail->content()->view);
        $this->assertEquals('Jane', $mail->content()->with['userName']);
    }
}
