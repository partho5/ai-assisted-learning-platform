import { useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    PayPalScriptProvider,
    PayPalButtons,
    usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import {
    validateCoupon,
    createOrder,
    captureOrder,
    createSubscription,
    activateSubscription,
} from '@/actions/App/Http/Controllers/PaymentController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Course } from '@/types';


// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// ─── inner PayPal buttons (must be inside PayPalScriptProvider) ───────────────

function InnerButtons({
    course,
    locale,
    couponCode,
    originalPrice,
    finalPrice,
    onSuccess,
    onError,
}: {
    course: Course;
    locale: string;
    couponCode: string;
    originalPrice: number;
    finalPrice: number;
    onSuccess: () => void;
    onError: (msg: string) => void;
}) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    const isSubscription = course.billing_type === 'subscription';

    if (isPending) {
        return (
            <div className="space-y-2">
                {[1, 2].map((i) => (
                    <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        );
    }

    if (isRejected) {
        return (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                PayPal failed to load. Please check your internet connection or try again later.
            </p>
        );
    }

    if (isSubscription) {
        return (
            <PayPalButtons
                style={{ layout: 'vertical', label: 'subscribe', shape: 'rect', color: 'gold' }}
                createSubscription={async () => {
                    const res = await fetch(createSubscription.url({ locale, course: course.slug }), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                        body: JSON.stringify({ coupon_code: couponCode || undefined }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.subscription_id) throw new Error(data.error ?? 'Failed to create subscription');
                    return data.subscription_id;
                }}
                onApprove={async (data) => {
                    const res = await fetch(activateSubscription.url({ locale, course: course.slug }), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                        body: JSON.stringify({ subscription_id: data.subscriptionID }),
                    });
                    const json = await res.json();
                    if (!res.ok) { onError(json.error ?? 'Activation failed'); return; }
                    onSuccess();
                }}
                onError={() => onError('PayPal encountered an error. Please try again.')}
            />
        );
    }

    return (
        <PayPalButtons
            style={{ layout: 'vertical', label: 'pay', shape: 'rect', color: 'gold' }}
            createOrder={async () => {
                const res = await fetch(createOrder.url({ locale, course: course.slug }), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                    body: JSON.stringify({ coupon_code: couponCode || undefined }),
                });
                const data = await res.json();
                if (!res.ok || !data.order_id) {
                    if (data.free) { onSuccess(); throw new Error('free'); }
                    throw new Error(data.error ?? 'Failed to create order');
                }
                if (data.free) { onSuccess(); throw new Error('free'); }
                return data.order_id;
            }}
            onApprove={async (data) => {
                const res = await fetch(captureOrder.url({ locale, course: course.slug }), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                    body: JSON.stringify({ order_id: data.orderID }),
                });
                const json = await res.json();
                if (!res.ok) { onError(json.error ?? 'Capture failed'); return; }
                onSuccess();
            }}
            onError={() => onError('PayPal encountered an error. Please try again.')}
        />
    );
}

function getCsrf(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

// ─── Main checkout modal ─────────────────────────────────────────────────────

interface Props {
    course: Course;
    locale: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutModal({ course, locale, isOpen, onClose }: Props) {
    const { paypalClientId } = usePage().props;
    const overlayRef = useRef<HTMLDivElement>(null);
    const originalPrice = parseFloat(course.price ?? '0');

    const [couponInput, setCouponInput] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<null | 'valid' | 'invalid'>(null);
    const [couponMessage, setCouponMessage] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [finalPrice, setFinalPrice] = useState(originalPrice);
    const [isFreeViaCode, setIsFreeViaCode] = useState(false);
    const [validating, setValidating] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [paypalError, setPaypalError] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCouponInput('');
            setCouponCode('');
            setCouponStatus(null);
            setCouponMessage('');
            setDiscountPercent(0);
            setFinalPrice(originalPrice);
            setIsFreeViaCode(false);
            setSucceeded(false);
            setPaypalError('');
        }
    }, [isOpen, originalPrice]);

    // Close on backdrop click
    function handleBackdrop(e: React.MouseEvent) {
        if (e.target === overlayRef.current) { onClose(); }
    }

    async function applyCoupon() {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setValidating(true);
        setCouponStatus(null);
        setPaypalError('');

        try {
            const res = await fetch(validateCoupon.url({ locale, course: course.slug }), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();

            if (!res.ok || !data.valid) {
                setCouponStatus('invalid');
                setCouponMessage(data.message ?? 'Invalid or expired code.');
                return;
            }

            setCouponStatus('valid');
            setCouponCode(code);
            setDiscountPercent(data.discount_percent);
            setFinalPrice(data.final_price);
            setIsFreeViaCode(data.is_free);
            setCouponMessage(`${data.discount_percent}% off applied!`);
        } finally {
            setValidating(false);
        }
    }

    async function handleFreeEnroll() {
        // 100% coupon — hit the createOrder endpoint which will short-circuit
        const res = await fetch(createOrder.url({ locale, course: course.slug }), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getCsrf() },
            body: JSON.stringify({ coupon_code: couponCode }),
        });
        const data = await res.json();
        if (data.success || data.free) {
            handleSuccess();
        } else {
            setPaypalError(data.error ?? 'Something went wrong.');
        }
    }

    function handleSuccess() {
        setSucceeded(true);
        setTimeout(() => {
            onClose();
            router.reload({ only: ['enrollment'] });
        }, 2000);
    }

    if (!isOpen) return null;

    const isSubscription = course.billing_type === 'subscription';
    const currencySymbol = course.currency === 'USD' ? '$' : course.currency + ' ';

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdrop}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
        >
            <div className="w-full max-w-md rounded-t-2xl bg-background sm:rounded-2xl shadow-2xl border border-border overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {isSubscription ? 'Subscribe' : 'Purchase'}
                        </p>
                        <p className="mt-0.5 font-semibold leading-tight text-foreground line-clamp-1">{course.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-5 py-5 space-y-5">
                    {/* Success state */}
                    {succeeded ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <span className="text-5xl">🎉</span>
                            <p className="text-lg font-semibold text-foreground">You're enrolled!</p>
                            <p className="text-sm text-muted-foreground">Full access has been granted. Redirecting…</p>
                        </div>
                    ) : (
                        <>
                            {/* Price display */}
                            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {isSubscription
                                            ? `Monthly · ${course.subscription_duration_months} month${(course.subscription_duration_months ?? 1) > 1 ? 's' : ''}`
                                            : 'One-time payment'}
                                    </span>
                                    <div className="text-right">
                                        {couponStatus === 'valid' && discountPercent > 0 && (
                                            <span className="mr-2 text-sm text-muted-foreground line-through">
                                                {fmt(originalPrice, course.currency)}
                                            </span>
                                        )}
                                        <span className="text-2xl font-bold text-foreground">
                                            {isFreeViaCode ? 'Free' : fmt(finalPrice, course.currency)}
                                        </span>
                                        {isSubscription && !isFreeViaCode && (
                                            <span className="text-xs text-muted-foreground">/month</span>
                                        )}
                                    </div>
                                </div>
                                {isSubscription && !isFreeViaCode && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Total: {fmt(finalPrice * (course.subscription_duration_months ?? 1), course.currency)} over {course.subscription_duration_months} months — then yours forever.
                                    </p>
                                )}
                            </div>

                            {/* Coupon code */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Have a coupon code?</p>
                                <div className="flex gap-2">
                                    <Input
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                                        placeholder="MYCODE"
                                        className="flex-1 font-mono tracking-wider uppercase text-sm"
                                        disabled={couponStatus === 'valid'}
                                    />
                                    <Button
                                        size="compact"
                                        variant="secondary"
                                        onClick={applyCoupon}
                                        disabled={validating || !couponInput.trim() || couponStatus === 'valid'}
                                    >
                                        {validating ? '…' : couponStatus === 'valid' ? 'Applied' : 'Apply'}
                                    </Button>
                                </div>
                                {couponStatus === 'valid' && (
                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ {couponMessage}</p>
                                )}
                                {couponStatus === 'invalid' && (
                                    <p className="text-xs text-destructive">{couponMessage}</p>
                                )}
                            </div>

                            {/* Error */}
                            {paypalError && (
                                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                    {paypalError}
                                </p>
                            )}

                            {/* 100% coupon = instant free button */}
                            {isFreeViaCode ? (
                                <Button className="w-full" onClick={handleFreeEnroll}>
                                    Enroll for Free
                                </Button>
                            ) : !paypalClientId ? (
                                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                    Payment is not configured yet. Set <code>PAYPAL_CLIENT_ID</code> in your <code>.env</code> file.
                                </p>
                            ) : (
                                <PayPalScriptProvider options={{
                                    clientId: paypalClientId,
                                    vault: isSubscription,
                                    intent: isSubscription ? 'subscription' : 'capture',
                                    currency: course.currency,
                                    disableFunding: 'paylater,card',
                                }}>
                                    <InnerButtons
                                        course={course}
                                        locale={locale}
                                        couponCode={couponCode}
                                        originalPrice={originalPrice}
                                        finalPrice={finalPrice}
                                        onSuccess={handleSuccess}
                                        onError={(msg) => setPaypalError(msg)}
                                    />
                                </PayPalScriptProvider>
                            )}

                            <p className="text-center text-[11px] text-muted-foreground">
                                Payments are securely processed by PayPal. You can request a refund within 30 days.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
