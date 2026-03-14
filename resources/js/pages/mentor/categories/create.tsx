import { Head, useForm, usePage } from '@inertiajs/react';
import {
    index as categoriesIndex,
    store as categoryStore,
} from '@/actions/App/Http/Controllers/Mentor/CategoryController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export default function CategoryCreate() {
    const { locale, ui } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ui.nav.dashboard, href: `/${l}/mentor/dashboard` },
        { title: 'Categories', href: categoriesIndex.url(l) },
        { title: 'New Category', href: '#' },
    ];

    const form = useForm({
        name: '',
        description: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(categoryStore(l));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Category" />

            <div className="mx-auto max-w-xl p-4 md:p-6">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Category</h1>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <Label>
                            Name <span className="ml-1 text-destructive">*</span>
                        </Label>
                        <Input
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="e.g. Web Development"
                            disabled={form.processing}
                        />
                        {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Description</Label>
                        <textarea
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="Short description (optional)"
                            rows={3}
                            disabled={form.processing}
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {form.errors.description && (
                            <p className="text-xs text-destructive">{form.errors.description}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-sidebar-border pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => window.history.back()}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="enroll" disabled={form.processing}>
                            {form.processing ? 'Creating...' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
