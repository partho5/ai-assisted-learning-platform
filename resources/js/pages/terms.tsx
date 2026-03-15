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

export default function Terms() {
    return (
        <PublicLayout hidePlatformChat>
            <Head title="Terms and Conditions">
                <meta
                    name="description"
                    content="SkillEvidence Terms and Conditions — the rules and agreements that govern use of our learning platform."
                />
                <meta name="robots" content="index, follow" />
            </Head>

            <section className="mx-auto max-w-3xl px-5 py-20">
                {/* Header */}
                <div className="mb-12 border-b border-border pb-8">
                    <div className="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                        Legal
                    </div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Terms &amp; Conditions</h1>
                    <p className="text-sm text-muted-foreground">Last updated: 15 March 2026</p>
                </div>

                <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
                    By creating an account or using SkillEvidence you agree to these Terms and Conditions. Please read them
                    carefully before using the platform.
                </p>

                <PolicySection title="1. Definitions">
                    <ul className="ml-5 list-disc space-y-1">
                        <li>
                            <strong className="text-foreground">"Platform"</strong> — the SkillEvidence website and all
                            related services.
                        </li>
                        <li>
                            <strong className="text-foreground">"Learner"</strong> — any registered user who enrols in
                            courses.
                        </li>
                        <li>
                            <strong className="text-foreground">"Mentor"</strong> — a user who creates and publishes
                            courses.
                        </li>
                        <li>
                            <strong className="text-foreground">"Content"</strong> — all course materials, lessons,
                            assessments, and resources available on the Platform.
                        </li>
                    </ul>
                </PolicySection>

                <PolicySection title="2. Eligibility">
                    <p>
                        You must be at least 13 years old to use the Platform. By registering, you confirm that the
                        information you provide is accurate and that you have the authority to enter into this agreement.
                    </p>
                </PolicySection>

                <PolicySection title="3. Accounts">
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials. You must
                        notify us immediately at{' '}
                        <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
                            {import.meta.env.VITE_CONTACT_EMAIL}
                        </a>{' '}
                        if you suspect unauthorised access to your account.
                    </p>
                    <p>
                        You may not share, transfer, or sell your account. Each account is personal and intended for a
                        single individual.
                    </p>
                </PolicySection>

                <PolicySection title="4. Acceptable Use">
                    <p>You agree not to:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>Upload, share, or distribute content that is illegal, harmful, or infringes third-party rights.</li>
                        <li>Attempt to reverse-engineer, scrape, or copy Platform content or code.</li>
                        <li>Use the Platform to spam, harass, or deceive other users.</li>
                        <li>Impersonate another person or create misleading accounts.</li>
                        <li>Circumvent any access controls or payment mechanisms.</li>
                    </ul>
                    <p>We reserve the right to suspend or terminate accounts that violate these rules without prior notice.</p>
                </PolicySection>

                <PolicySection title="5. Course Enrolment and Access">
                    <p>
                        Enrolment grants you a limited, non-exclusive, non-transferable licence to access and use the
                        course for personal, non-commercial learning purposes. Access continues for the lifetime of the
                        Platform unless terminated for a breach of these Terms.
                    </p>
                    <p>
                        Free resources are accessible without an account. Full course access, assessments, and portfolio
                        recording require enrolment.
                    </p>
                </PolicySection>

                <PolicySection title="6. Payments">
                    <p>
                        Payments are processed securely via PayPal. Prices are shown in USD unless otherwise stated. We
                        reserve the right to change prices at any time; changes will not affect already-purchased enrolments.
                    </p>
                    <p>
                        For our refund policy, please read the{' '}
                        <a href="/en/refund-policy" className="text-primary underline underline-offset-4">
                            Refund Policy
                        </a>{' '}
                        page.
                    </p>
                </PolicySection>

                <PolicySection title="7. Intellectual Property">
                    <p>
                        All Platform code, design, and branding are owned by SkillEvidence. Course content is owned by the
                        respective Mentor who created it. You may not reproduce, distribute, or create derivative works
                        without written permission from the rights holder.
                    </p>
                    <p>
                        By submitting test answers or portfolio work, you grant us a limited licence to store and display
                        that work within the Platform and on your public portfolio (subject to your visibility settings).
                    </p>
                </PolicySection>

                <PolicySection title="8. Mentor Responsibilities">
                    <p>Mentors who publish courses on the Platform agree to:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>Ensure course content is accurate and does not infringe third-party rights.</li>
                        <li>Review and grade assignment submissions within a reasonable timeframe.</li>
                        <li>Not publish content that is misleading, harmful, or violates our Acceptable Use policy.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="9. AI-Assisted Features">
                    <p>
                        The Platform uses AI services to grade open-ended answers and power the course tutor. AI-generated
                        feedback is provided as guidance only and may occasionally be inaccurate. Mentor review is required
                        for final endorsements. We are not liable for errors in AI-generated feedback.
                    </p>
                </PolicySection>

                <PolicySection title="10. Limitation of Liability">
                    <p>
                        To the fullest extent permitted by law, SkillEvidence is not liable for any indirect, incidental,
                        or consequential damages arising from your use of the Platform. Our total liability to you for any
                        claim will not exceed the amount you paid us in the 12 months preceding the claim.
                    </p>
                </PolicySection>

                <PolicySection title="11. Termination">
                    <p>
                        You may delete your account at any time from your profile settings. We may suspend or terminate
                        your account if you breach these Terms. Upon termination, your access to paid content ceases and
                        platform credit is forfeited.
                    </p>
                </PolicySection>

                <PolicySection title="12. Changes to These Terms">
                    <p>
                        We may update these Terms from time to time. Material changes will be communicated via email or
                        an in-platform notice at least 14 days before they take effect. Continued use after changes take
                        effect constitutes your acceptance.
                    </p>
                </PolicySection>

                <PolicySection title="13. Governing Law">
                    <p>
                        These Terms are governed by applicable law. Any disputes will be resolved through good-faith
                        negotiation first. If unresolved, disputes will be submitted to the courts of the jurisdiction
                        where SkillEvidence is registered.
                    </p>
                </PolicySection>

                <PolicySection title="14. Contact">
                    <p>
                        Questions about these Terms? Email us at{' '}
                        <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
                            {import.meta.env.VITE_CONTACT_EMAIL}
                        </a>
                        .
                    </p>
                </PolicySection>
            </section>
        </PublicLayout>
    );
}
