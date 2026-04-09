import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit2, ExternalLink, FolderOpen, Plus, Trash2 } from 'lucide-react';
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

    function handleDelete(id: number) {
        if (!confirm('Delete this project? This cannot be undone.')) return;
        router.delete(`/${l}/dashboard/portfolio-builder/projects/${id}`);
    }

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Projects', href: `/${l}/dashboard/portfolio-builder/projects` },
        ]}>
            <Head title="Portfolio Projects" />

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Projects</h1>
                <Link href={`/${l}/dashboard/portfolio-builder/projects/create`}>
                    <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
                </Link>
            </div>

            {projects.length === 0 ? (
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
                <div className="space-y-3">
                    {projects.map((project) => (
                        <Card key={project.id}>
                            <CardContent className="flex items-center gap-4 py-4">
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
                                    <Link href={`/${l}/dashboard/portfolio-builder/projects/${project.id}/edit`}>
                                        <Button variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleDelete(project.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </PortfolioBuilderLayout>
    );
}
