<?php

namespace App\Http\Controllers;

use App\Mail\PaymentConfirmedMail;
use App\Mail\PaymentRefundedMail;
use App\Mail\SubscriptionActivatedMail;
use App\Mail\SubscriptionCancelledMail;
use App\Models\CouponCode;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Partner;
use App\Models\PartnerCommission;
use App\Models\PartnerReferral;
use App\Models\Payment;
use App\Models\User;
use App\Services\PayPalClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    public function __construct(private readonly PayPalClient $paypal) {}

    // ─── Coupon validation (public — called from checkout modal) ─────────────

    public function validateCoupon(Request $request, Course $course): JsonResponse
    {
        $request->validate(['code' => ['required', 'string', 'max:50']]);

        $coupon = CouponCode::where('code', strtoupper($request->input('code')))
            ->where(fn ($q) => $q->whereNull('course_id')->orWhere('course_id', $course->id))
            ->first();

        if (! $coupon || ! $coupon->isUsable()) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired coupon code.'], 422);
        }

        $originalPrice = (float) $course->price;
        $finalPrice = $coupon->applyTo($originalPrice);

        return response()->json([
            'valid' => true,
            'discount_percent' => $coupon->discount_percent,
            'original_price' => $originalPrice,
            'final_price' => $finalPrice,
            'is_free' => $coupon->isFullDiscount() || $finalPrice <= 0,
        ]);
    }

    // ─── One-time payment (Orders API) ───────────────────────────────────────

    public function createOrder(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user(), 401);
        abort_unless($course->isPaid() && ! $course->isSubscription(), 400);

        $coupon = $this->resolveCoupon($request->input('coupon_code'), $course);
        $amounts = $this->calculateAmounts((float) $course->price, $coupon);
        $referredByPartnerId = $this->resolveReferralPartner($request, $course);

        if ($amounts['final'] <= 0) {
            // 100% discount — grant access directly without PayPal
            return $this->grantFreeAccess($request->user(), $course, $coupon, $amounts, $referredByPartnerId);
        }

        $order = $this->paypal->createOrder(
            $amounts['final'],
            $course->currency,
            "Enrollment: {$course->title}",
        );

        // Persist a pending payment to track this order
        Payment::create([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'coupon_code_id' => $coupon?->id,
            'referred_by_partner_id' => $referredByPartnerId,
            'paypal_order_id' => $order['id'],
            'status' => 'pending',
            'billing_type' => 'one_time',
            'original_amount' => $amounts['original'],
            'discount_amount' => $amounts['discount'],
            'final_amount' => $amounts['final'],
            'currency' => $course->currency,
        ]);

        return response()->json(['order_id' => $order['id']]);
    }

    public function captureOrder(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user(), 401);

        $request->validate(['order_id' => ['required', 'string']]);
        $orderId = $request->input('order_id');

        $payment = Payment::where('paypal_order_id', $orderId)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $capture = $this->paypal->captureOrder($orderId);

        if (($capture['status'] ?? '') !== 'COMPLETED') {
            $payment->update(['status' => 'failed']);

            return response()->json(['error' => 'Payment was not completed.'], 422);
        }

        DB::transaction(function () use ($payment, $request, $course) {
            $payment->update(['status' => 'captured']);

            if ($payment->coupon_code_id) {
                CouponCode::where('id', $payment->coupon_code_id)->increment('used_count');
            }

            $this->upsertFullEnrollment($request->user()->id, $course->id);
            $this->recordCommissionIfReferred($payment);
        });

        Mail::queue(new PaymentConfirmedMail($request->user(), $course, $payment->fresh()));

        return response()->json(['success' => true]);
    }

    // ─── Subscription (Billing Plans API) ───────────────────────────────────

    public function createSubscription(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user(), 401);
        abort_unless($course->isPaid() && $course->isSubscription(), 400);

        $coupon = $this->resolveCoupon($request->input('coupon_code'), $course);
        $amounts = $this->calculateAmounts((float) $course->price, $coupon);
        $referredByPartnerId = $this->resolveReferralPartner($request, $course);

        if ($amounts['final'] <= 0) {
            return $this->grantFreeAccess($request->user(), $course, $coupon, $amounts, $referredByPartnerId);
        }

        $planId = $this->ensurePlan($course, $amounts['final']);

        $subscription = $this->paypal->createSubscription(
            $planId,
            route('payment.subscription.return', ['locale' => app()->getLocale(), 'course' => $course->slug]),
            route('payment.subscription.cancel', ['locale' => app()->getLocale(), 'course' => $course->slug]),
        );

        Payment::create([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
            'coupon_code_id' => $coupon?->id,
            'referred_by_partner_id' => $referredByPartnerId,
            'paypal_subscription_id' => $subscription['id'],
            'status' => 'pending',
            'billing_type' => 'subscription',
            'original_amount' => $amounts['original'],
            'discount_amount' => $amounts['discount'],
            'final_amount' => $amounts['final'],
            'currency' => $course->currency,
        ]);

        return response()->json(['subscription_id' => $subscription['id']]);
    }

    public function activateSubscription(Request $request, Course $course): JsonResponse
    {
        abort_unless($request->user(), 401);

        $request->validate(['subscription_id' => ['required', 'string']]);
        $subscriptionId = $request->input('subscription_id');

        $payment = Payment::where('paypal_subscription_id', $subscriptionId)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $sub = $this->paypal->getSubscription($subscriptionId);

        if (! in_array($sub['status'] ?? '', ['ACTIVE', 'APPROVED'])) {
            return response()->json(['error' => 'Subscription is not active.'], 422);
        }

        $expiresAt = null;

        DB::transaction(function () use ($payment, $request, $course, &$expiresAt) {
            $payment->update(['status' => 'active']);

            if ($payment->coupon_code_id) {
                CouponCode::where('id', $payment->coupon_code_id)->increment('used_count');
            }

            $months = $course->subscription_duration_months ?? 1;
            $expiresAt = now()->addMonths($months);

            $this->upsertFullEnrollment($request->user()->id, $course->id, $expiresAt);
            $this->recordCommissionIfReferred($payment);
        });

        Mail::queue(new SubscriptionActivatedMail(
            $request->user(),
            $course,
            $payment->fresh(),
            $expiresAt->format('d M Y'),
        ));

        return response()->json(['success' => true]);
    }

    // ─── PayPal Webhook ──────────────────────────────────────────────────────

    public function webhook(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $headers = array_change_key_case($request->headers->all(), CASE_UPPER);
        $headers = array_map(fn ($v) => is_array($v) ? $v[0] : $v, $headers);

        if (! $this->paypal->verifyWebhook($headers, $rawBody)) {
            Log::warning('PayPal webhook signature verification failed');

            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $event = $request->json()->all();
        $type = $event['event_type'] ?? '';

        match ($type) {
            'BILLING.SUBSCRIPTION.ACTIVATED' => $this->handleSubscriptionActivated($event),
            'BILLING.SUBSCRIPTION.CANCELLED' => $this->handleSubscriptionCancelled($event),
            'PAYMENT.CAPTURE.REFUNDED' => $this->handleRefund($event),
            default => null,
        };

        return response()->json(['ok' => true]);
    }

    // ─── Subscription return / cancel pages (GET) ────────────────────────────

    public function subscriptionReturn(Course $course): \Illuminate\Http\RedirectResponse
    {
        return redirect()
            ->route('courses.show', ['locale' => app()->getLocale(), 'course' => $course->slug])
            ->with('success', 'Your subscription is being processed. It will be active within moments.');
    }

    public function subscriptionCancel(Course $course): \Illuminate\Http\RedirectResponse
    {
        return redirect()
            ->route('courses.show', ['locale' => app()->getLocale(), 'course' => $course->slug])
            ->with('error', 'Subscription was cancelled. No charges were made.');
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function resolveCoupon(?string $code, Course $course): ?CouponCode
    {
        if (! $code) {
            return null;
        }

        return CouponCode::where('code', strtoupper($code))
            ->where(fn ($q) => $q->whereNull('course_id')->orWhere('course_id', $course->id))
            ->first()?->isUsable() ? CouponCode::where('code', strtoupper($code))
            ->where(fn ($q) => $q->whereNull('course_id')->orWhere('course_id', $course->id))
            ->first() : null;
    }

    /**
     * @return array{original: float, discount: float, final: float}
     */
    private function calculateAmounts(float $price, ?CouponCode $coupon): array
    {
        $final = $coupon ? $coupon->applyTo($price) : $price;
        $discount = round($price - $final, 2);

        return ['original' => $price, 'discount' => $discount, 'final' => $final];
    }

    /**
     * @param  array{original: float, discount: float, final: float}  $amounts
     */
    private function grantFreeAccess(
        User $user,
        Course $course,
        ?CouponCode $coupon,
        array $amounts,
        ?int $referredByPartnerId = null,
    ): JsonResponse {
        $payment = null;

        DB::transaction(function () use ($user, $course, $coupon, $amounts, $referredByPartnerId, &$payment) {
            $payment = Payment::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'coupon_code_id' => $coupon?->id,
                'referred_by_partner_id' => $referredByPartnerId,
                'status' => 'captured',
                'billing_type' => $course->billing_type,
                'original_amount' => $amounts['original'],
                'discount_amount' => $amounts['discount'],
                'final_amount' => 0,
                'currency' => $course->currency,
            ]);

            if ($coupon) {
                $coupon->increment('used_count');
            }

            $this->upsertFullEnrollment($user->id, $course->id);
            $this->recordCommissionIfReferred($payment);
        });

        Mail::queue(new PaymentConfirmedMail($user, $course, $payment));

        return response()->json(['success' => true, 'free' => true]);
    }

    private function upsertFullEnrollment(int $userId, int $courseId, ?\Carbon\CarbonInterface $expiresAt = null): void
    {
        $enrollment = Enrollment::firstOrCreate(
            ['user_id' => $userId, 'course_id' => $courseId],
            ['access_level' => 'full', 'purchased_at' => now(), 'expires_at' => $expiresAt],
        );

        if (! $enrollment->wasRecentlyCreated) {
            $enrollment->update([
                'access_level' => 'full',
                'purchased_at' => now(),
                'expires_at' => $expiresAt,
            ]);
        }
    }

    private function ensurePlan(Course $course, float $discountedPrice): string
    {
        if ($course->paypal_plan_id) {
            return $course->paypal_plan_id;
        }

        $productId = $this->paypal->ensureProduct();
        $planId = $this->paypal->createPlan(
            $course->title,
            $discountedPrice,
            $course->currency,
            $course->subscription_duration_months ?? 1,
            $productId,
        );

        $course->update(['paypal_plan_id' => $planId]);

        return $planId;
    }

    // ─── Webhook event handlers ──────────────────────────────────────────────

    /** @param array<string, mixed> $event */
    private function handleSubscriptionActivated(array $event): void
    {
        $subscriptionId = $event['resource']['id'] ?? null;

        if (! $subscriptionId) {
            return;
        }

        $payment = Payment::where('paypal_subscription_id', $subscriptionId)->first();

        if (! $payment || $payment->status === 'active') {
            return;
        }

        $course = Course::find($payment->course_id);
        $months = $course?->subscription_duration_months ?? 1;
        $expires = now()->addMonths($months);

        DB::transaction(function () use ($payment, $expires) {
            $payment->update(['status' => 'active']);
            $this->upsertFullEnrollment($payment->user_id, $payment->course_id, $expires);
        });

        if ($course && $payment->user) {
            Mail::queue(new SubscriptionActivatedMail(
                $payment->user,
                $course,
                $payment->fresh(),
                $expires->format('d M Y'),
            ));
        }
    }

    /** @param array<string, mixed> $event */
    private function handleSubscriptionCancelled(array $event): void
    {
        $subscriptionId = $event['resource']['id'] ?? null;

        if (! $subscriptionId) {
            return;
        }

        $payment = Payment::with(['user', 'course'])
            ->where('paypal_subscription_id', $subscriptionId)
            ->first();

        if (! $payment) {
            return;
        }

        $payment->update(['status' => 'cancelled']);

        if ($payment->user && $payment->course) {
            Mail::queue(new SubscriptionCancelledMail($payment->user, $payment->course));
        }
    }

    /** @param array<string, mixed> $event */
    private function handleRefund(array $event): void
    {
        $orderId = $event['resource']['supplementary_data']['related_ids']['order_id'] ?? null;

        if (! $orderId) {
            return;
        }

        $payment = Payment::with(['user', 'course'])
            ->where('paypal_order_id', $orderId)
            ->first();

        if (! $payment) {
            return;
        }

        $payment->update(['status' => 'refunded']);

        // Revoke partner commission on refund
        PartnerCommission::where('payment_id', $payment->id)
            ->where('status', '!=', 'revoked')
            ->update(['status' => 'revoked']);

        if ($payment->user && $payment->course) {
            Mail::queue(new PaymentRefundedMail($payment->user, $payment->course, $payment));
        }
    }

    // ─── Partner referral helpers ─────────────────────────────────────────────

    /** Resolve the referring partner from either localStorage code or server-side referral record. */
    private function resolveReferralPartner(Request $request, Course $course): ?int
    {
        if (! $course->partner_commission_rate) {
            return null;
        }

        $code = $request->input('referral_code');

        if ($code) {
            $partner = Partner::where('code', $code)->active()->first();
        } else {
            // Fallback to server-side referral record
            $referral = PartnerReferral::where('course_id', $course->id)
                ->where(function ($q) use ($request) {
                    $q->where('visitor_user_id', $request->user()->id)
                        ->orWhere('visitor_session_id', $request->session()->getId());
                })
                ->active()
                ->latest('clicked_at')
                ->first();

            $partner = $referral?->partner;
        }

        if (! $partner || ! $partner->is_active) {
            return null;
        }

        // Block self-referral
        if ($partner->user_id === $request->user()->id) {
            return null;
        }

        return $partner->id;
    }

    /** Create a PartnerCommission record if the payment was referred. */
    private function recordCommissionIfReferred(Payment $payment): void
    {
        if (! $payment->referred_by_partner_id) {
            return;
        }

        $course = Course::find($payment->course_id);

        if (! $course || ! $course->partner_commission_rate) {
            return;
        }

        $baseAmount = (float) $course->price;
        $rate = (float) $course->partner_commission_rate;
        $commissionAmount = round($baseAmount * $rate / 100, 2);

        PartnerCommission::create([
            'partner_id' => $payment->referred_by_partner_id,
            'payment_id' => $payment->id,
            'course_id' => $course->id,
            'purchaser_user_id' => $payment->user_id,
            'commission_rate' => $rate,
            'base_amount' => $baseAmount,
            'commission_amount' => $commissionAmount,
            'status' => 'pending',
        ]);

        // Mark server-side referral as converted
        PartnerReferral::where('partner_id', $payment->referred_by_partner_id)
            ->where('course_id', $course->id)
            ->whereNull('converted_at')
            ->update(['converted_at' => now()]);
    }
}
