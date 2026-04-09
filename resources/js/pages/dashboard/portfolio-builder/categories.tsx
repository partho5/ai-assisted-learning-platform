import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Edit2, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';

interface Category {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    projects_count: number;
}

interface Props {
    categories: Category[];
}

export default function PortfolioCategories({ categories }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);
    const [editingId, setEditingId] = useState<number | null>(null);

    const createForm = useForm({ name: '' });
    const editForm = useForm({ name: '' });

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(`/${l}/dashboard/portfolio-builder/categories`, {
            onSuccess: () => createForm.reset(),
        });
    }

    function startEdit(cat: Category) {
        setEditingId(cat.id);
        editForm.setData('name', cat.name);
    }

    function handleUpdate(e: FormEvent) {
        e.preventDefault();
        if (!editingId) return;
        editForm.put(`/${l}/dashboard/portfolio-builder/categories/${editingId}`, {
            onSuccess: () => setEditingId(null),
        });
    }

    function handleDelete(id: number) {
        if (!confirm('Delete this category? Projects in it will become uncategorized.')) return;
        router.delete(`/${l}/dashboard/portfolio-builder/categories/${id}`);
    }

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Categories', href: `/${l}/dashboard/portfolio-builder/categories` },
        ]}>
            <Head title="Portfolio Categories" />

            <h1 className="mb-6 text-2xl font-bold">Categories</h1>

            {/* Create form */}
            <Card className="mb-6">
                <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="flex gap-2">
                        <Input
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            placeholder="Category name..."
                        />
                        <Button type="submit" disabled={createForm.processing}>Add</Button>
                    </form>
                    {createForm.errors.name && <p className="mt-1 text-sm text-destructive">{createForm.errors.name}</p>}
                </CardContent>
            </Card>

            {/* Category list */}
            <Card>
                <CardContent className="pt-6">
                    {categories.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-muted-foreground">
                            <FolderOpen className="mb-2 h-8 w-8" />
                            <p className="text-sm">No categories yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                                    {editingId === cat.id ? (
                                        <form onSubmit={handleUpdate} className="flex flex-1 gap-2">
                                            <Input
                                                value={editForm.data.name}
                                                onChange={(e) => editForm.setData('name', e.target.value)}
                                                autoFocus
                                            />
                                            <Button type="submit" size="sm" disabled={editForm.processing}>Save</Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                        </form>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="font-medium">{cat.name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {cat.projects_count} project{cat.projects_count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </PortfolioBuilderLayout>
    );
}
