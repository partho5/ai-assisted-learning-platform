import { Head, useForm, usePage } from '@inertiajs/react';
import { update as articleUpdate } from '@/actions/App/Http/Controllers/ArticleController';
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

    const form = useForm({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? '',
        body: article.body ?? '',
        featured_image: article.featured_image ?? '',
        tags: (article.tags ?? []).join(', '),
        category_id: article.category_id ? String(article.category_id) : '',
        status: article.status,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(articleUpdate({ locale: l, article: article.slug }));
    }

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

                    {/* Slug */}
                    <div className="space-y-1.5">
                        <Label htmlFor="slug">
                            Slug *
                            <span className="ml-1 text-xs font-normal text-muted-foreground">(changing this breaks existing links)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground shrink-0">/resources/</span>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                onChange={(e) => form.setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                className="font-mono text-sm"
                                disabled={form.processing}
                            />
                        </div>
                        {form.errors.slug && <p className="text-sm text-destructive">{form.errors.slug}</p>}
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-1.5">
                        <Label htmlFor="excerpt">
                            Excerpt
                            <span className="ml-1 text-xs font-normal text-muted-foreground">(meta description — max 160 chars)</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="excerpt"
                                value={form.data.excerpt}
                                onChange={(e) => form.setData('excerpt', e.target.value.slice(0, 160))}
                                placeholder="One-sentence summary shown in Google search results…"
                                disabled={form.processing}
                            />
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${form.data.excerpt.length >= 155 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                {form.data.excerpt.length}/160
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
                            onChange={(e) => form.setData('status', e.target.value as 'draft' | 'published')}
                            disabled={form.processing}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                        >
                            {statuses.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

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

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? (isDraft ? 'Saving…' : 'Updating…')
                                : (isDraft ? 'Save Draft' : 'Update Article')}
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
