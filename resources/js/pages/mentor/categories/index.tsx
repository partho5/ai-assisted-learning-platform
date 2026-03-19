import { Head, Link, usePage } from '@inertiajs/react';
import {
    create as categoryCreate,
    edit as categoryEdit,
} from '@/actions/App/Http/Controllers/Mentor/CategoryController';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category } from '@/types';

interface CategoryWithCount extends Category {
    courses_count: number;
}

interface Props {
    categories: CategoryWithCount[];
}

export default function CategoriesIndex({ categories }: Props) {
    const { locale, ui, flash } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: ui.nav.dashboard, href: `/${l}/mentor/dashboard` },
        { title: 'Categories', href: categoryCreate.url(l) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />

            <div className="md:mx-2 p-4 md:p-6">
                {flash?.success && (
                    <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
                    <Button asChild variant="enroll">
                        <Link href={categoryCreate.url(l)}>New Category</Link>
                    </Button>
                </div>

                {categories.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                        No categories yet. Create one to get started.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-center">Courses</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 font-medium">{category.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {category.description ?? <span className="italic">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">
                                            {category.courses_count}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end">
                                                <Button asChild variant="utility" size="compact">
                                                    <Link href={categoryEdit.url({ locale: l, category: category.id })}>
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
