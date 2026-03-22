import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { store as storeThread } from '@/actions/App/Http/Controllers/Forum/ForumThreadController';
import { index as forumIndex } from '@/actions/App/Http/Controllers/Forum/ForumController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { ForumCategory, User } from '@/types';

interface Props {
    categories: Pick<ForumCategory, 'id' | 'name' | 'slug' | 'color'>[];
    prefill: {
        category_id: number | null;
        resource_id: number | null;
        course_id: number | null;
        title: string;
    };
}

export default function CreateThread({ categories, prefill }: Props) {
    const { locale } = usePage().props as { locale: string };
    const l = String(locale);

    const form = useForm({
        title: prefill.title,
        body: '',
        category_id: prefill.category_id ?? (categories[0]?.id ?? null),
        tags: [] as string[],
        resource_id: prefill.resource_id,
        course_id: prefill.course_id,
    });

    const [tagInput, setTagInput] = useState('');

    function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
            if (tag && !form.data.tags.includes(tag) && form.data.tags.length < 5) {
                form.setData('tags', [...form.data.tags, tag]);
            }
            setTagInput('');
        }
    }

    function removeTag(tag: string) {
        form.setData('tags', form.data.tags.filter((t) => t !== tag));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(storeThread(l));
    }

    return (
        <AppLayout>
            <Head title="New Thread — Forum" />

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
                    <Link href={forumIndex.url(l)} className="hover:underline">Forum</Link>
                    <span>›</span>
                    <span className="text-foreground font-medium">New Thread</span>
                </nav>

                <h1 className="text-2xl font-bold mb-6">Ask ! what you want to learn ?</h1>

                <form onSubmit={submit} className="space-y-6">
                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <select
                            id="category"
                            value={form.data.category_id ?? ''}
                            onChange={(e) => form.setData('category_id', Number(e.target.value))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {form.errors.category_id && (
                            <p className="text-sm text-destructive">{form.errors.category_id}</p>
                        )}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            placeholder="What's your question or topic?"
                            maxLength={255}
                        />
                        {form.errors.title && (
                            <p className="text-sm text-destructive">{form.errors.title}</p>
                        )}
                    </div>

                    {/* Body */}
                    <div className="space-y-2">
                        <Label>Body *</Label>
                        <RichTextEditor
                            value={form.data.body}
                            onChange={(val) => form.setData('body', val)}
                            placeholder="Describe your question or topic in detail..."
                        />
                        {form.errors.body && (
                            <p className="text-sm text-destructive">{form.errors.body}</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (optional, up to 5)</Label>
                        <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background p-2 min-h-[42px]">
                            {form.data.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="text-muted-foreground hover:text-foreground ml-0.5"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                            {form.data.tags.length < 5 && (
                                <input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={addTag}
                                    placeholder={form.data.tags.length === 0 ? 'Add tags (press Enter or comma)' : ''}
                                    className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                />
                            )}
                        </div>
                    </div>

                    {/* Hidden fields for resource/course linking */}
                    {form.data.resource_id && (
                        <p className="text-sm text-muted-foreground">
                            This thread will be linked to a specific resource.
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={forumIndex.url(l)}>
                            <Button type="button" variant="ghost">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Posting...' : 'Post Thread'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

