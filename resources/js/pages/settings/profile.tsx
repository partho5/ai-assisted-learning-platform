import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import type { SocialLink } from '@/types/auth';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

const PLATFORM_OPTIONS = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter / X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'github', label: 'GitHub' },
    { value: 'stackoverflow', label: 'Stack Overflow' },
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'hackerrank', label: 'HackerRank' },
    { value: 'codeforces', label: 'Codeforces' },
    { value: 'medium', label: 'Medium' },
    { value: 'devto', label: 'Dev.to' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'producthunt', label: 'Product Hunt' },
    { value: 'website', label: 'Website / Portfolio' },
    { value: 'skool', label: 'Skool' },
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
        (auth.user.social_links as SocialLink[] | null) ?? [],
    );

    function addSocialLink() {
        setSocialLinks((prev) => [...prev, { platform: 'website', url: '' }]);
    }

    function removeSocialLink(index: number) {
        setSocialLinks((prev) => prev.filter((_, i) => i !== index));
    }

    function updateSocialLink(index: number, field: keyof SocialLink, value: string) {
        setSocialLinks((prev) =>
            prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your name, email address, and public profile details"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                    <InputError className="mt-2" message={errors.email} />

                                    {mustVerifyEmail && auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the verification email.
                                                </Link>
                                            </p>

                                            {status === 'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has been sent to your email address.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="headline">Headline</Label>
                                    <Input
                                        id="headline"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.headline ?? ''}
                                        name="headline"
                                        placeholder="e.g. Full-stack developer | Laravel enthusiast"
                                        maxLength={255}
                                    />
                                    <InputError className="mt-2" message={errors.headline} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        rows={4}
                                        defaultValue={auth.user.bio ?? ''}
                                        placeholder="Tell people a bit about yourself..."
                                        maxLength={2000}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring mt-1 block w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <InputError className="mt-2" message={errors.bio} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="avatar">Avatar URL</Label>
                                    <Input
                                        id="avatar"
                                        type="url"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.avatar ?? ''}
                                        name="avatar"
                                        placeholder="https://..."
                                    />
                                    <p className="text-xs text-muted-foreground">Paste a URL to your profile photo.</p>
                                    <InputError className="mt-2" message={errors.avatar} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Social &amp; website links</Label>
                                    <div className="space-y-2">
                                        {socialLinks.map((link, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <select
                                                    name={`social_links[${index}][platform]`}
                                                    value={link.platform}
                                                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                                >
                                                    {PLATFORM_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <Input
                                                    name={`social_links[${index}][url]`}
                                                    type="url"
                                                    value={link.url}
                                                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    size="compact"
                                                    onClick={() => removeSocialLink(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="secondary" size="compact" onClick={addSocialLink}>
                                            + Add Link
                                        </Button>
                                    </div>
                                    <InputError className="mt-2" message={errors['social_links']} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="portfolio_visibility">Portfolio visibility</Label>
                                    <select
                                        id="portfolio_visibility"
                                        name="portfolio_visibility"
                                        defaultValue={auth.user.portfolio_visibility ?? 'public'}
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring mt-1 h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                    >
                                        <option value="public">Public — anyone can find and view it</option>
                                        <option value="unlisted">Unlisted — only accessible via direct link</option>
                                        <option value="private">Private — only visible to you</option>
                                    </select>
                                    <InputError className="mt-2" message={errors.portfolio_visibility} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing} data-test="update-profile-button">
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">Saved</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
