import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';

interface SkillTag {
    id: number;
    name: string;
}

interface Service {
    headline: string;
    description: string;
}

interface Portfolio {
    id: number;
    bio: string | null;
    secondary_bio: string | null;
    services: Service[] | null;
    is_published: boolean;
    skill_tags: SkillTag[];
}

interface Props {
    portfolio: Portfolio;
}

export default function PortfolioSettings({ portfolio }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const form = useForm({
        bio: portfolio.bio ?? '',
        secondary_bio: portfolio.secondary_bio ?? '',
        services: portfolio.services ?? [],
        skill_tags: portfolio.skill_tags.map((t) => t.name),
        is_published: portfolio.is_published,
    });

    const [newServiceHeadline, setNewServiceHeadline] = useState('');
    const [newServiceDesc, setNewServiceDesc] = useState('');
    const [newTag, setNewTag] = useState('');
    const autoSaveRef = useRef(false);

    useEffect(() => {
        if (autoSaveRef.current) {
            autoSaveRef.current = false;
            form.put(`/${l}/dashboard/portfolio-builder/settings`, { preserveScroll: true });
        }
    }, [form.data.services]);

    function addService() {
        const headline = newServiceHeadline.trim();
        if (headline) {
            form.setData('services', [...form.data.services, { headline, description: newServiceDesc.trim() }]);
            setNewServiceHeadline('');
            setNewServiceDesc('');
            autoSaveRef.current = true;
        }
    }

    function removeService(index: number) {
        form.setData('services', form.data.services.filter((_, i) => i !== index));
    }

    function addTag() {
        const val = newTag.trim();
        if (val && !form.data.skill_tags.includes(val)) {
            form.setData('skill_tags', [...form.data.skill_tags, val]);
            setNewTag('');
        }
    }

    function removeTag(index: number) {
        form.setData('skill_tags', form.data.skill_tags.filter((_, i) => i !== index));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.put(`/${l}/dashboard/portfolio-builder/settings`);
    }

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Settings', href: `/${l}/dashboard/portfolio-builder/settings` },
        ]}>
            <Head title="Portfolio Settings" />

            <h1 className="mb-6 text-2xl font-bold">Portfolio Settings</h1>

            <form onSubmit={submit} className="space-y-6">
                {/* Bio */}
                <Card>
                    <CardHeader><CardTitle>About You</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <textarea
                                id="bio"
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                rows={4}
                                value={form.data.bio}
                                onChange={(e) => form.setData('bio', e.target.value)}
                                placeholder="Tell visitors about yourself..."
                            />
                            {form.errors.bio && <p className="mt-1 text-sm text-destructive">{form.errors.bio}</p>}
                        </div>
                        <div>
                            <Label htmlFor="secondary_bio">Secondary Bio</Label>
                            <textarea
                                id="secondary_bio"
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                rows={3}
                                value={form.data.secondary_bio}
                                onChange={(e) => form.setData('secondary_bio', e.target.value)}
                                placeholder="Additional info (optional)"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Skill Tags */}
                <Card>
                    <CardHeader><CardTitle>Skill Tags</CardTitle></CardHeader>
                    <CardContent>
                        <div className="mb-3 flex flex-wrap gap-2">
                            {form.data.skill_tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="gap-1">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(i)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Add a skill..."
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                            />
                            <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Services */}
                <Card>
                    <CardHeader><CardTitle>Services</CardTitle></CardHeader>
                    <CardContent>
                        <div className="mb-4 space-y-3">
                            {form.data.services.map((service, i) => (
                                <div key={i} className="flex items-start justify-between rounded-md border px-3 py-2">
                                    <div>
                                        <p className="text-sm font-semibold">{service.headline}</p>
                                        {service.description && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">{service.description}</p>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => removeService(i)} className="ml-2 shrink-0 pt-0.5">
                                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3 rounded-md border p-3">
                            <div>
                                <Label className="text-xs font-semibold text-gray-600">Heading</Label>
                                <Input
                                    value={newServiceHeadline}
                                    onChange={(e) => setNewServiceHeadline(e.target.value)}
                                    placeholder="e.g. Full Stack Development"
                                    className="mt-1"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-gray-600">Description</Label>
                                <Input
                                    value={newServiceDesc}
                                    onChange={(e) => setNewServiceDesc(e.target.value)}
                                    placeholder="e.g. websites, web applications, service management apps..."
                                    className="mt-1"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
                                />
                            </div>
                            <Button type="button" variant="secondary" onClick={addService}>Add Service</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Publish toggle */}
                <Card>
                    <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
                    <CardContent>
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                checked={form.data.is_published}
                                onChange={(e) => form.setData('is_published', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-sm font-medium">Publish my portfolio</span>
                        </label>
                        <p className="mt-1 text-xs text-muted-foreground">
                            When published, your portfolio is visible to anyone with the link.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </PortfolioBuilderLayout>
    );
}
