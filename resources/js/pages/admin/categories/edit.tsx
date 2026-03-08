import { Head, useForm, usePage } from '@inertiajs/react';
import {
    index as categoriesIndex,
    update as categoryUpdate,
} from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category } from '@/types';

interface Props {
    category: Category;
}

export default function CategoryEdit({ category }: Props) {
    const { locale, ui } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ui.nav.dashboard, href: `/${l}/admin/dashboard` },
        { title: ui.nav.categories, href: categoriesIndex.url(l) },
        { title: 'Edit Category', href: '#' },
    ];

    const form = useForm({
        name: category.name,
        description: category.description ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(categoryUpdate({ locale: l, category: category.id }));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${category.name}`} />

            <div className="mx-auto max-w-xl p-4 md:p-6">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit Category</h1>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <Label>
                            Name <span className="ml-1 text-destructive">*</span>
                        </Label>
                        <Input
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            disabled={form.processing}
                        />
                        {form.errors.name && <p className="text-xs text-destructive">{form.errors.name}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Description</Label>
                        <textarea
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
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
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
