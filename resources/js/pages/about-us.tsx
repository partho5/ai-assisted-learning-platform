import { Head, Link, usePage } from '@inertiajs/react';
import { login, register } from '@/routes';

export default function AboutUs() {
    const { locale } = usePage().props;

    return (
        <>
            <Head title="Platform Philosophy">
                <meta
                    name="description"
                    content="Discover why we built this skill evidence learning platform and our mission to transform how people learn and demonstrate their abilities."
                />
                <meta
                    name="keywords"
                    content="skill evidence, learning platform, education technology, skills demonstration"
                />
                <meta property="og:title" content="Platform Philosophy" />
                <meta
                    property="og:description"
                    content="Discover why we built this skill evidence learning platform and our mission to transform how people learn and demonstrate their abilities."
                />
                <meta property="og:type" content="website" />
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                {/* Navigation */}
                <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href={`/${locale}/`} className="text-xl font-semibold text-slate-900 dark:text-white">
                            Skill Platform
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href={login()} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                Log in
                            </Link>
                            <Link href={register()} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Register
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
                    <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        Our Philosophy
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                        We built this platform because we believe the traditional way of learning and demonstrating skills is broken. This is our story and our mission.
                    </p>
                </section>

                {/* Main Content */}
                <section className="max-w-4xl mx-auto px-6 pb-16 space-y-16">
                    {/* The Problem */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 lg:p-12 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                            The Problem We're Solving
                        </h2>
                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                Today's learners face a fundamental disconnect: they spend months or years acquiring skills, yet struggle to prove what they've actually learned. Traditional education relies on degrees and certificates that often don't reflect real capability. Employers can't easily verify competence, and learners can't showcase their growth.
                            </p>
                            <p>
                                This creates a credibility gap where talented individuals are overlooked, and organizations can't identify the right talent. Meanwhile, learners lose motivation because their progress isn't visible or validated.
                            </p>
                        </div>
                    </div>

                    {/* Our Vision */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 lg:p-12 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                            Our Vision
                        </h2>
                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                We envision a world where everyone can learn, grow, and prove their abilities. A platform where:
                            </p>
                            <ul className="space-y-3 ml-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                                    <span>Learners build a portfolio of real, verifiable evidence of their skills</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                                    <span>Learning becomes visible, trackable, and celebrated at every step</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                                    <span>Organizations can confidently identify talent based on demonstrated ability</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">✓</span>
                                    <span>Skills become the new currency of opportunity</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Core Values */}
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                            Core Values
                        </h2>
                        <div className="grid lg:grid-cols-2 gap-6">
                            {[
                                {
                                    title: 'Evidence Over Claims',
                                    description: 'Skills are demonstrated, not just stated. Every achievement is backed by real work and tangible proof.',
                                },
                                {
                                    title: 'Inclusive Growth',
                                    description: 'Everyone deserves the chance to learn and shine. We build for all skill levels and backgrounds.',
                                },
                                {
                                    title: 'Transparency First',
                                    description: 'Complete visibility into what was learned, how, and when. No hidden criteria or mysterious assessments.',
                                },
                                {
                                    title: 'Continuous Learning',
                                    description: 'Skills are never finished. We celebrate the journey of continuous improvement and growth.',
                                },
                            ].map((value, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow"
                                >
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                                        {value.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {value.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Why We Built It */}
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-8 lg:p-12 border border-blue-200 dark:border-blue-800">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                            Why We Built This
                        </h2>
                        <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                            <p>
                                We've seen too many brilliant people struggle to get opportunities because they couldn't prove their worth. We've watched organizations overlook talented individuals because they looked in the wrong places.
                            </p>
                            <p>
                                This platform exists because we believe in removing those barriers. By creating a space where skills are visible, verified, and celebrated, we can unlock human potential at scale.
                            </p>
                            <p>
                                Every feature we build, every decision we make—it's guided by one question: <em>"Does this help people learn better and prove their abilities more authentically?"</em>
                            </p>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Ready to Start Your Learning Journey?
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            Join us in building a future where skills matter more than credentials.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link
                                href={register()}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href={`/${locale}/dashboard`}
                                className="px-8 py-3 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Explore Dashboard
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-16">
                    <div className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-600 dark:text-slate-400">
                        <p>© {new Date().getFullYear()} Skill Evidence Learning Platform. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
