import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import CloudinaryImageUpload from '@/components/cloudinary-image-upload';
import RichTextEditor from '@/components/rich-text-editor';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';

interface Category {
    id: number;
    name: string;
}

interface MediaItem {
    type: 'image' | 'youtube';
    url: string;
}

interface Project {
    id: number;
    title: string;
    slug: string;
    description: string;
    category_id: number | null;
    featured_image: string | null;
    external_url: string | null;
    tech_tags: string[] | null;
    meta_description: string | null;
    is_published: boolean;
    media: { id: number; type: 'image' | 'youtube'; url: string; sort_order: number }[];
}

interface Props {
    project: Project;
    categories: Category[];
}

export default function EditProject({ project, categories }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const form = useForm({
        title: project.title,
        description: project.description,
        category_id: (project.category_id ?? '') as string | number,
        featured_image: project.featured_image ?? '',
        external_url: project.external_url ?? '',
        tech_tags: project.tech_tags ?? [],
        meta_description: project.meta_description ?? '',
        is_published: project.is_published,
        media: project.media.map((m) => ({ type: m.type, url: m.url })) as MediaItem[],
    });

    const [newTag, setNewTag] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');

    function addTag() {
        const val = newTag.trim();
        if (val && !form.data.tech_tags.includes(val)) {
            form.setData('tech_tags', [...form.data.tech_tags, val]);
            setNewTag('');
        }
    }

    function removeTag(i: number) {
        form.setData('tech_tags', form.data.tech_tags.filter((_, idx) => idx !== i));
    }

    function addMediaImage(url: string) {
        if (url) {
            form.setData('media', [...form.data.media, { type: 'image', url }]);
        }
    }

    function addYouTube() {
        const url = youtubeUrl.trim();
        if (!url) return;
        let embedUrl = url;
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s/]+)/);
        if (match) {
            embedUrl = `https://www.youtube.com/embed/${match[1]}`;
        }
        form.setData('media', [...form.data.media, { type: 'youtube', url: embedUrl }]);
        setYoutubeUrl('');
    }

    function removeMedia(i: number) {
        form.setData('media', form.data.media.filter((_, idx) => idx !== i));
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        // Auto-add any pending YouTube URL before submitting
        const pendingYt = youtubeUrl.trim();
        if (pendingYt) {
            let embedUrl = pendingYt;
            const match = pendingYt.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s/]+)/);
            if (match) {
                embedUrl = `https://www.youtube.com/embed/${match[1]}`;
            }
            form.data.media = [...form.data.media, { type: 'youtube', url: embedUrl }];
            setYoutubeUrl('');
        }
        form.put(`/${l}/dashboard/portfolio-builder/projects/${project.id}`);
    }

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Projects', href: `/${l}/dashboard/portfolio-builder/projects` },
            { title: 'Edit', href: `/${l}/dashboard/portfolio-builder/projects/${project.id}/edit` },
        ]}>
            <Head title={`Edit: ${project.title}`} />

            <h1 className="mb-6 text-2xl font-bold">Edit Project</h1>

            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                            {form.errors.title && <p className="mt-1 text-sm text-destructive">{form.errors.title}</p>}
                        </div>

                        <div>
                            <Label>Description *</Label>
                            <RichTextEditor value={form.data.description} onChange={(html) => form.setData('description', html)} />
                            {form.errors.description && <p className="mt-1 text-sm text-destructive">{form.errors.description}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="category_id">Category</Label>
                                <select
                                    id="category_id"
                                    value={form.data.category_id}
                                    onChange={(e) => form.setData('category_id', e.target.value ? Number(e.target.value) : '')}
                                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">No category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="external_url">External URL</Label>
                                <Input id="external_url" type="url" value={form.data.external_url} onChange={(e) => form.setData('external_url', e.target.value)} placeholder="https://..." />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="meta_description">Meta Description</Label>
                            <textarea
                                id="meta_description"
                                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                rows={2}
                                maxLength={300}
                                value={form.data.meta_description}
                                onChange={(e) => form.setData('meta_description', e.target.value)}
                                placeholder="SEO description (auto-generated from content if empty)"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
                    <CardContent>
                        <CloudinaryImageUpload
                            value={form.data.featured_image}
                            onChange={(url) => form.setData('featured_image', url)}
                            aspectHint="16:9"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Media Gallery</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {form.data.media.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {form.data.media.map((m, i) => (
                                    <div key={i} className="group relative rounded-md border">
                                        {m.type === 'image' ? (
                                            <img src={m.url} alt="" className="aspect-video w-full rounded-md object-cover" />
                                        ) : (
                                            <iframe
                                                src={m.url}
                                                className="aspect-video w-full rounded-md"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(i)}
                                            className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="space-y-3">
                            <CloudinaryImageUpload value="" onChange={addMediaImage} />
                            <div className="flex gap-2">
                                <Input
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="YouTube URL (watch, share, or shorts link)"
                                    className="flex-1 min-w-0"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addYouTube(); } }}
                                />
                                <Button type="button" variant="outline" onClick={addYouTube}>
                                    <Plus className="mr-1 h-3 w-3" /> YouTube
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Tech Tags</CardTitle></CardHeader>
                    <CardContent>
                        <div className="mb-3 flex flex-wrap gap-2">
                            {form.data.tech_tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="gap-1">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(i)}><X className="h-3 w-3" /></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tech..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                            <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between pt-6">
                        <label className="flex cursor-pointer items-center gap-3">
                            <input type="checkbox" checked={form.data.is_published} onChange={(e) => form.setData('is_published', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                            <span className="text-sm font-medium">Publish this project</span>
                        </label>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </PortfolioBuilderLayout>
    );
}
