import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-10">
            <h2 className="mb-3 text-lg font-semibold text-primary">{title}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </div>
    );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-10 rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
            <div className="space-y-2 text-sm leading-relaxed text-foreground">{children}</div>
        </div>
    );
}

export default function RefundPolicy() {
    return (
        <PublicLayout hidePlatformChat>
            <Head title="Refund Policy">
                <meta
                    name="description"
                    content="SkillEvidence Refund Policy — how platform credit works and how to request a refund within 7 days."
                />
                <meta name="robots" content="index, follow" />
            </Head>

            <section className="mx-auto max-w-3xl px-5 py-20">
                {/* Header */}
                <div className="mb-12 border-b border-border pb-8">
                    <div className="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-widest text-primary uppercase">
                        Legal
                    </div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
                        Refund Policy
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Last updated: 15 March 2026
                    </p>
                </div>

                {/* Summary highlight */}
                <HighlightBox>
                    <p className="font-semibold text-lg text-green-600">
                        Unlike traditional platforms, we let you access part of
                        the course for free so you can judge the quality before
                        enrolling. So in most cases, you won’t need to request a
                        refund.
                    </p>
                    <p>
                        In case you are not satisfied with a course, you may request
                        a refund within <strong>7 days of purchase</strong>.
                        Approved refunds are issued as{' '}
                        <strong>SkillEvidence platform credit</strong> — not as
                        cash — which you can use to enrol in any other course on
                        the platform. Platform credit is valid for{' '}
                        <strong>1 year</strong> and cannot be converted to cash.
                    </p>
                </HighlightBox>

                <PolicySection title="1. Eligibility Window">
                    <p>
                        Refund requests must be submitted within{' '}
                        <strong className="text-foreground">
                            7 calendar days
                        </strong>{' '}
                        of the original purchase date. Requests submitted after
                        this window will not be eligible.
                    </p>
                    <p>A course is not eligible for a refund if:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>
                            You have completed more than 50% of the course
                            content.
                        </li>
                        <li>
                            You have submitted an assignment or test attempt for
                            mentor review.
                        </li>
                        <li>
                            The purchase was made using platform credit from a
                            previous refund.
                        </li>
                        <li>The 7-day window has passed.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="2. How Refunds Are Issued">
                    <p>
                        All approved refunds are issued exclusively as{' '}
                        <strong className="text-foreground">
                            SkillEvidence Platform Credit
                        </strong>
                        . This means:
                    </p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>
                            Credit is added to your account and can be used to
                            purchase any course on SkillEvidence.
                        </li>
                        <li>
                            Credit cannot be withdrawn as money or transferred
                            to another user.
                        </li>
                        <li>
                            Credit cannot be redeemed for cash under any
                            circumstances.
                        </li>
                        <li>
                            Credit expires{' '}
                            <strong className="text-foreground">5 years</strong>{' '}
                            from the date it is issued.
                        </li>
                        <li>
                            Credit balances are visible in your account
                            settings.
                        </li>
                    </ul>
                    <p>
                        By completing a purchase on SkillEvidence, you
                        acknowledge and agree that any refund you may be
                        eligible for will be issued as platform credit, not as a
                        cash refund.
                    </p>
                </PolicySection>

                <PolicySection title="3. How to Request a Refund">
                    <p>To request a refund, email us at:</p>
                    <p>
                        <a
                            href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}
                            className="font-medium text-primary underline underline-offset-4"
                        >
                            {import.meta.env.VITE_CONTACT_EMAIL}
                        </a>
                    </p>
                    <p>Include in your email:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>Your account email address.</li>
                        <li>
                            The name of the course you are requesting a refund
                            for.
                        </li>
                        <li>The reason for your request.</li>
                    </ul>
                    <p>
                        We aim to process all refund requests within{' '}
                        <strong className="text-foreground">
                            3 business days
                        </strong>
                        . You will receive an email confirmation when credit has
                        been added to your account.
                    </p>
                </PolicySection>

                <PolicySection title="4. Exceptional Circumstances">
                    <p>
                        If a course is removed from the platform by its Mentor
                        or by SkillEvidence administration, all learners who
                        purchased it will automatically receive full platform
                        credit equal to the purchase price, regardless of the
                        7-day window.
                    </p>
                    <p>
                        Technical issues that prevent access to course content
                        may be eligible for credit on a case-by-case basis.
                        Contact us and we will investigate.
                    </p>
                </PolicySection>

                <PolicySection title="5. No Chargebacks">
                    <p>
                        Initiating a chargeback or dispute through PayPal or
                        your bank instead of following this policy may result in
                        immediate suspension of your SkillEvidence account
                        pending review. We strongly encourage you to contact us
                        first — we are happy to help.
                    </p>
                </PolicySection>

                <PolicySection title="6. Changes to This Policy">
                    <p>
                        We may update this policy from time to time. Changes
                        will not apply retroactively to purchases made before
                        the updated policy was published.
                    </p>
                </PolicySection>

                <PolicySection title="7. Contact">
                    <p>
                        Questions about a refund or your platform credit
                        balance? Email{' '}
                        <a
                            href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}
                            className="text-primary underline underline-offset-4"
                        >
                            {import.meta.env.VITE_CONTACT_EMAIL}
                        </a>
                        .
                    </p>
                </PolicySection>
            </section>
        </PublicLayout>
    );
}
