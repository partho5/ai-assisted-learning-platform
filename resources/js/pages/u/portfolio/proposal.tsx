import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PortfolioLayout from '@/layouts/portfolio-layout';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Owner {
    name: string;
    username: string;
    avatar: string | null;
    headline: string | null;
}

interface Portfolio {
    id: number;
    bio: string | null;
    secondary_bio: string | null;
    services: { headline: string; description?: string }[] | null;
    skill_tags?: { id: number; name: string }[];
}

interface Props {
    owner: Owner;
    portfolio: Portfolio;
    categories: Category[];
    appUrl: string;
    canonicalUrl: string;
    hasCourses: boolean;
}

const SUBJECT_OPTIONS = [
    'Build a software for my business',
    'Is it possible to build my idea?',
    'I want a cost estimate for a project',
    'Other',
];

export default function Proposal({ owner, portfolio, categories, canonicalUrl, hasCourses }: Props) {
    const form = useForm({ sender_name: '', sender_email: '', subject: '', body: '', honeypot: '', confirm_human: true });
    const [sent, setSent] = useState(false);

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/u/${owner.username}/portfolio/contact`, {
            onSuccess: () => setSent(true),
        });
    }

    return (
        <PortfolioLayout owner={owner} portfolio={portfolio} categories={categories} showSidebar={false} hasCourses={hasCourses}>
            <Head>
                <title>{`Send a Proposal — ${owner.name}`}</title>
                <meta name="description" content={`Send ${owner.name} a project proposal or inquiry.`} />
                <link rel="canonical" href={canonicalUrl} />
            </Head>

            <div className="mx-auto max-w-xl">
                {owner.avatar && (
                    <div className="mb-6 flex justify-center">
                        <img
                            src={owner.avatar}
                            alt={owner.name}
                            className="h-28 w-28 rounded-full border-4 border-gray-100 object-cover shadow-md sm:h-32 sm:w-32 md:h-40 md:w-40"
                        />
                    </div>
                )}

                <h1 className="mb-2 text-center text-3xl font-black text-blue-700 md:text-4xl">Send a Proposal</h1>
                <p className="mb-8 text-center text-sm text-gray-500">
                    Tell {owner.name} about your project and get a response by email.
                </p>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl ring-1 ring-black/[0.02] sm:p-8">
                    {sent ? (
                        <div className="py-8 text-center">
                            <p className="text-lg font-semibold text-green-600">Proposal sent!</p>
                            <p className="mt-2 text-sm text-gray-500">{owner.name} will get back to you via email.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-6">
                            <input
                                type="text"
                                name="honeypot"
                                value={form.data.honeypot}
                                onChange={(e) => form.setData('honeypot', e.target.value)}
                                className="hidden"
                                tabIndex={-1}
                                autoComplete="off"
                            />

                            <div>
                                <Label htmlFor="sender_name" className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Your Name *</Label>
                                <Input
                                    id="sender_name"
                                    value={form.data.sender_name}
                                    onChange={(e) => form.setData('sender_name', e.target.value)}
                                    required
                                    className="mt-1.5 h-14 rounded-xl border-gray-200 px-4 text-base shadow-sm transition-all hover:border-gray-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                                    placeholder="Your name"
                                />
                                {form.errors.sender_name && <p className="mt-1 text-xs text-red-500">{form.errors.sender_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="sender_email" className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Your Email *</Label>
                                <Input
                                    id="sender_email"
                                    type="email"
                                    value={form.data.sender_email}
                                    onChange={(e) => form.setData('sender_email', e.target.value)}
                                    required
                                    className="mt-1.5 h-14 rounded-xl border-gray-200 px-4 text-base shadow-sm transition-all hover:border-gray-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                                    placeholder="I will reply to this email"
                                />
                                {form.errors.sender_email && <p className="mt-1 text-xs text-red-500">{form.errors.sender_email}</p>}
                            </div>

                            <div>
                                <Label htmlFor="subject" className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Subject</Label>
                                <Select value={form.data.subject} onValueChange={(value) => form.setData('subject', value)}>
                                    <SelectTrigger
                                        id="subject"
                                        className="mt-1.5 h-14 w-full rounded-xl border-gray-200 px-4 text-base shadow-sm transition-all hover:border-gray-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                                    >
                                        <SelectValue placeholder="Choose a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBJECT_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.subject && <p className="mt-1 text-xs text-red-500">{form.errors.subject}</p>}
                            </div>

                            <div>
                                <Label htmlFor="body" className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Message *</Label>
                                <textarea
                                    id="body"
                                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    rows={5}
                                    value={form.data.body}
                                    onChange={(e) => form.setData('body', e.target.value)}
                                    required
                                    placeholder="Describe your project or idea..."
                                />
                                {form.errors.body && <p className="mt-1 text-xs text-red-500">{form.errors.body}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl disabled:opacity-50"
                            >
                                {form.processing ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </PortfolioLayout>
    );
}
