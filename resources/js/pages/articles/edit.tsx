import { Head, router, useForm, usePage } from '@inertiajs/react';
import { update as articleUpdate, preview as articlePreview } from '@/actions/App/Http/Controllers/ArticleController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CloudinaryImageUpload from '@/components/cloudinary-image-upload';
import TagSuggestions from '@/components/tag-suggestions';
import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { Article, Category } from '@/types';

interface StatusOption {
    value: string;
    label: string;
}

interface Props {
    article: Article;
    categories: Category[];
    statuses: StatusOption[];
}

export default function ArticleEdit({ article, categories, statuses }: Props) {
    const { locale } = usePage().props as Record<string, any>;
    const l = String(locale);

    // Format existing published_at as a local datetime-local value for the picker
    const existingPublishAt = article.published_at
        ? new Date(article.published_at).toISOString().slice(0, 16)
        : '';

    const form = useForm({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? '',
        body: article.body ?? '',
        featured_image: article.featured_image ?? '',
        featured_image_alt: article.featured_image_alt ?? '',
        tags: (article.tags ?? []).join(', '),
        category_id: article.category_id ? String(article.category_id) : '',
        status: article.status,
        publish_at: article.status === 'scheduled' ? existingPublishAt : '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(articleUpdate({ locale: l, article: article.slug }));
    }

    function handlePreview() {
        form.submit(articleUpdate({ locale: l, article: article.slug }), {
            onSuccess: () => {
                router.visit(articlePreview.url({ locale: l, article: article.slug }));
            },
        });
    }

    const isScheduled = form.data.status === 'scheduled';
    const isDraft = form.data.status === 'draft';

    return (
        <AppLayout>
            <Head title={`Edit: ${article.title}`} />
            <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
                <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Article</h1>
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            disabled={form.processing}
                        />
                        {form.errors.title && <p className="text-sm text-destructive">{form.errors.title}</p>}
                    </div>

                    {/* Slug — read-only in edit view */}
                    <div className="space-y-1.5">
                        <Label htmlFor="slug">
                            Slug
                            <span className="ml-1 text-xs font-normal text-muted-foreground">(read-only — changing breaks existing links)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground shrink-0">/resources/</span>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                readOnly
                                className="font-mono text-sm bg-muted/40 cursor-default select-all"
                            />
                        </div>
                    </div>

                    {/* Excerpt / meta description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="excerpt">
                            Excerpt
                            <span className="ml-1 text-xs font-normal text-muted-foreground">(meta description — ideal: up to 200 chars)</span>
                        </Label>
                        <div className="relative">
                            <textarea
                                id="excerpt"
                                rows={3}
                                value={form.data.excerpt}
                                onChange={(e) => form.setData('excerpt', e.target.value.slice(0, 500))}
                                placeholder="One-sentence summary shown in Google search results…"
                                disabled={form.processing}
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-4 py-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            />
                            <span className={`absolute right-2 bottom-2 text-xs ${form.data.excerpt.length > 200 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                {form.data.excerpt.length}/200
                            </span>
                        </div>
                        {form.errors.excerpt && <p className="text-sm text-destructive">{form.errors.excerpt}</p>}
                    </div>

                    {/* Featured image */}
                    <div className="space-y-1.5">
                        <Label>
                            Featured Image
                            <span className="ml-1 text-xs font-normal text-muted-foreground">(old image auto-deleted on change)</span>
                        </Label>
                        <CloudinaryImageUpload
                            value={form.data.featured_image}
                            onChange={(url) => form.setData('featured_image', url)}
                            aspectHint="16:9"
                            disabled={form.processing}
                        />
                        {form.errors.featured_image && <p className="text-sm text-destructive">{form.errors.featured_image}</p>}
                    </div>

                    {/* Featured image alt text */}
                    <div className="space-y-1.5">
                        <Label htmlFor="featured_image_alt">
                            Image Alt Text
                            <span className="ml-1 text-xs font-normal text-muted-foreground">(for accessibility &amp; SEO)</span>
                        </Label>
                        <Input
                            id="featured_image_alt"
                            value={form.data.featured_image_alt}
                            onChange={(e) => form.setData('featured_image_alt', e.target.value)}
                            placeholder="Describe the image…"
                            disabled={form.processing}
                        />
                        {form.errors.featured_image_alt && <p className="text-sm text-destructive">{form.errors.featured_image_alt}</p>}
                    </div>

                    {/* Tags */}
                    <div className="space-y-1.5">
                        <Label>
                            Tags
                            <span className="ml-1 text-xs font-normal text-muted-foreground">(SEO keywords)</span>
                        </Label>
                        <TagSuggestions
                            value={form.data.tags}
                            onChange={(v) => form.setData('tags', v)}
                            tagsUrl={`/${l}/resources/api/tags`}
                        />
                        {form.errors.tags && <p className="text-sm text-destructive">{form.errors.tags}</p>}
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                        <Label htmlFor="category_id">Category</Label>
                        <select
                            id="category_id"
                            value={form.data.category_id}
                            onChange={(e) => form.setData('category_id', e.target.value)}
                            disabled={form.processing}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        >
                            <option value="">— No category —</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                            ))}
                        </select>
                        {form.errors.category_id && <p className="text-sm text-destructive">{form.errors.category_id}</p>}
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <Label htmlFor="status">Status</Label>
                        <select
                            id="status"
                            value={form.data.status}
                            onChange={(e) => form.setData('status', e.target.value as 'draft' | 'scheduled' | 'published')}
                            disabled={form.processing}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        >
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Publish-at datetime — only shown when scheduled */}
                    {isScheduled && (
                        <div className="space-y-1.5">
                            <Label htmlFor="publish_at">Publish At *</Label>
                            <Input
                                id="publish_at"
                                type="datetime-local"
                                value={form.data.publish_at}
                                onChange={(e) => form.setData('publish_at', e.target.value)}
                                disabled={form.processing}
                            />
                            {form.errors.publish_at && <p className="text-sm text-destructive">{form.errors.publish_at}</p>}
                        </div>
                    )}

                    {/* Body */}
                    <div className="space-y-1.5">
                        <Label>Content *</Label>
                        <RichTextEditor
                            value={form.data.body}
                            onChange={(v) => form.setData('body', v)}
                            disabled={form.processing}
                        />
                        {form.errors.body && <p className="text-sm text-destructive">{form.errors.body}</p>}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? (isDraft ? 'Saving…' : isScheduled ? 'Scheduling…' : 'Updating…')
                                : (isDraft ? 'Save Draft' : isScheduled ? 'Schedule' : 'Update Article')}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={form.processing}
                            onClick={handlePreview}
                        >
                            Preview
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => history.back()} disabled={form.processing}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
