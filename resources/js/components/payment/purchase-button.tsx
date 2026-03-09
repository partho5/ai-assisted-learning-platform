import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CheckoutModal } from '@/components/payment/checkout-modal';
import { Button } from '@/components/ui/button';
import type { Course } from '@/types';

interface Props {
    course: Course;
    locale: string;
    /** Label override — defaults to "Buy Now" or price-formatted label */
    label?: string;
    /** Called after successful payment/enrollment */
    onSuccess?: () => void;
    className?: string;
    size?: 'default' | 'sm' | 'lg' | 'compact';
}

function fmt(price: string | null, currency: string): string {
    if (!price || parseFloat(price) === 0) return 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(price));
}

export function PurchaseButton({ course, locale, label, onSuccess, className, size = 'default' }: Props) {
    const [open, setOpen] = useState(false);

    const priceLabel = label ?? `Buy Now — ${fmt(course.price, course.currency)}`;

    function handleSuccess() {
        setOpen(false);
        if (onSuccess) {
            onSuccess();
        } else {
            router.reload({ only: ['enrollment'] });
        }
    }

    return (
        <>
            <Button
                variant="enroll"
                size={size}
                className={className}
                onClick={() => setOpen(true)}
            >
                {priceLabel}
            </Button>

            <CheckoutModal
                course={course}
                locale={locale}
                isOpen={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}
