import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, FolderOpen, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';

interface Category {
    id: number;
    name: string;
}

interface Project {
    id: number;
    title: string;
    slug: string;
    featured_image: string | null;
    is_published: boolean;
    category: Category | null;
    tech_tags: string[] | null;
    sort_order: number;
}

interface Props {
    projects: Project[];
    categories: Category[];
}

export default function PortfolioProjects({ projects }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const [items, setItems] = useState<Project[]>(projects);

    useEffect(() => setItems(projects), [projects]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    function handleDelete(id: number) {
        if (!confirm('Delete this project? This cannot be undone.')) return;
        router.delete(`/${l}/dashboard/portfolio-builder/projects/${id}`);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((p) => p.id === active.id);
        const newIndex = items.findIndex((p) => p.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(items, oldIndex, newIndex);
        setItems(reordered);

        router.post(
            `/${l}/dashboard/portfolio-builder/projects/reorder`,
            { order: reordered.map((p) => p.id) },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Projects', href: `/${l}/dashboard/portfolio-builder/projects` },
        ]}>
            <Head title="Portfolio Projects" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    {items.length > 1 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Drag the handle to reorder. Changes save automatically.
                        </p>
                    )}
                </div>
                <Link href={`/${l}/dashboard/portfolio-builder/projects/create`}>
                    <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
                </Link>
            </div>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                        <FolderOpen className="mb-3 h-12 w-12" />
                        <p className="mb-4 text-lg font-medium">No projects yet</p>
                        <Link href={`/${l}/dashboard/portfolio-builder/projects/create`}>
                            <Button><Plus className="mr-2 h-4 w-4" /> Create Your First Project</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {items.map((project) => (
                                <SortableProjectRow
                                    key={project.id}
                                    project={project}
                                    locale={l}
                                    onDelete={() => handleDelete(project.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </PortfolioBuilderLayout>
    );
}

function SortableProjectRow({
    project,
    locale,
    onDelete,
}: {
    project: Project;
    locale: string;
    onDelete: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card>
            <CardContent className="flex items-center gap-4 py-4">
                <button
                    type="button"
                    className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder project"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                {/* Thumbnail */}
                {project.featured_image ? (
                    <img
                        src={project.featured_image}
                        alt={project.title}
                        className="h-16 w-24 shrink-0 rounded-md object-cover"
                    />
                ) : (
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{project.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        {project.category && (
                            <Badge variant="outline">{project.category.name}</Badge>
                        )}
                        {project.is_published ? (
                            <Badge variant="default">Published</Badge>
                        ) : (
                            <Badge variant="secondary">Draft</Badge>
                        )}
                        {project.tech_tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                    <Link href={`/${locale}/dashboard/portfolio-builder/projects/${project.id}/edit`}>
                        <Button variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
            </Card>
        </div>
    );
}
