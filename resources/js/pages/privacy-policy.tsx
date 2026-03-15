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

export default function PrivacyPolicy() {
    return (
        <PublicLayout hidePlatformChat>
            <Head title="Privacy Policy">
                <meta
                    name="description"
                    content="SkillEvidence Privacy Policy — how we collect, use, and protect your personal data."
                />
                <meta name="robots" content="index, follow" />
            </Head>

            <section className="mx-auto max-w-3xl px-5 py-20">
                {/* Header */}
                <div className="mb-12 border-b border-border pb-8">
                    <div className="mb-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                        Legal
                    </div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
                    <p className="text-sm text-muted-foreground">Last updated: 15 March 2026</p>
                </div>

                <PolicySection title="1. Who We Are">
                    <p>
                        SkillEvidence ("<strong className="text-foreground">we</strong>", "
                        <strong className="text-foreground">us</strong>", "
                        <strong className="text-foreground">our</strong>") operates the SkillEvidence learning platform
                        accessible at this website. This policy explains how we collect, use, and protect information about
                        you when you use our services.
                    </p>
                </PolicySection>

                <PolicySection title="2. Information We Collect">
                    <p>We collect information you provide directly:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>Account details — name, email address, and password.</li>
                        <li>Profile information — headline, biography, and avatar URL you choose to share.</li>
                        <li>Learning activity — course enrolments, test answers, and completion records.</li>
                        <li>Payment details — processed securely via PayPal; we do not store card numbers.</li>
                        <li>Communications — messages you send us through contact forms or support channels.</li>
                    </ul>
                    <p>We also collect data automatically when you use the platform:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>Browser type, device, and operating system.</li>
                        <li>Pages visited and time spent on each page.</li>
                        <li>IP address and approximate geographic location.</li>
                    </ul>
                </PolicySection>

                <PolicySection title="3. How We Use Your Information">
                    <p>We use your information to:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>Create and maintain your account.</li>
                        <li>Deliver courses, assessments, and AI-assisted feedback.</li>
                        <li>Process payments and issue platform credit.</li>
                        <li>Display your public portfolio (if you have set it to visible).</li>
                        <li>Send transactional emails (enrolment confirmation, password reset).</li>
                        <li>Improve platform features and fix technical issues.</li>
                        <li>Comply with legal obligations.</li>
                    </ul>
                    <p>We do not sell your personal data to third parties.</p>
                </PolicySection>

                <PolicySection title="4. Sharing Your Information">
                    <p>We share data only in limited circumstances:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>
                            <strong className="text-foreground">Mentors</strong> — can see the names and submitted work of
                            learners enrolled in their courses.
                        </li>
                        <li>
                            <strong className="text-foreground">Payment processor</strong> — PayPal receives transaction
                            data to complete purchases.
                        </li>
                        <li>
                            <strong className="text-foreground">AI providers</strong> — anonymised quiz answers are sent to
                            an AI service for automated grading.
                        </li>
                        <li>
                            <strong className="text-foreground">Legal requirement</strong> — when required by law or to
                            protect user safety.
                        </li>
                    </ul>
                </PolicySection>

                <PolicySection title="5. Public Portfolio">
                    <p>
                        If your portfolio visibility is set to <em>Public</em>, your name, headline, bio, and showcased
                        course completions are visible to anyone with the link — including search engines. You can change
                        your visibility setting to <em>Unlisted</em> or <em>Private</em> at any time from your profile
                        settings.
                    </p>
                </PolicySection>

                <PolicySection title="6. Data Retention">
                    <p>
                        We retain your account and learning data for as long as your account is active. If you delete your
                        account, your personal data is removed within 30 days. Aggregated, anonymised data may be retained
                        longer for analytics purposes.
                    </p>
                </PolicySection>

                <PolicySection title="7. Cookies">
                    <p>
                        We use essential cookies to keep you logged in and remember your preferences. We do not use
                        advertising or tracking cookies. You can disable cookies in your browser settings, but some platform
                        features will not work correctly without them.
                    </p>
                </PolicySection>

                <PolicySection title="8. Your Rights">
                    <p>Depending on your location, you may have the right to:</p>
                    <ul className="ml-5 list-disc space-y-1">
                        <li>Access the personal data we hold about you.</li>
                        <li>Correct inaccurate data.</li>
                        <li>Request deletion of your data.</li>
                        <li>Object to or restrict certain processing.</li>
                        <li>Export your data in a portable format.</li>
                    </ul>
                    <p>
                        To exercise any of these rights, email us at{' '}
                        <a href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`} className="text-primary underline underline-offset-4">
                            {import.meta.env.VITE_CONTACT_EMAIL}
                        </a>
                        .
                    </p>
                </PolicySection>

                <PolicySection title="9. Security">
                    <p>
                        We use industry-standard measures — encrypted connections (HTTPS), hashed passwords, and
                        restricted access controls — to protect your data. No method of transmission over the internet is
                        completely secure. We encourage you to use a strong, unique password.
                    </p>
                </PolicySection>

                <PolicySection title="10. Changes to This Policy">
                    <p>
                        We may update this policy from time to time. When we make material changes, we will notify you by
                        email or via a banner on the platform. Continued use of the platform after changes take effect
                        constitutes your acceptance of the revised policy.
                    </p>
                </PolicySection>

                <PolicySection title="11. Contact">
                    <p>
                        Questions about this policy? Contact us at{' '}
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
