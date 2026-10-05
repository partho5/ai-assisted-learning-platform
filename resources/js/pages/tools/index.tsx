import { Head, Link } from '@inertiajs/react';
import { show } from '@/actions/App/Http/Controllers/ToolController';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import ToolsLayout from '@/layouts/tools-layout';

interface ToolSummary {
    slug: string;
    name: string;
    description: string;
}

interface Meta {
    title: string;
    description: string;
    image?: string;
    url: string;
}

export default function ToolsIndex({
    tools,
    meta,
}: {
    tools: ToolSummary[];
    meta: Meta;
}) {
    return (
        <ToolsLayout>
            <Head title={meta.title}>
                <meta name="description" content={meta.description} />
                <link rel="canonical" href={meta.url} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={meta.url} />
                {meta.image && (
                    <meta property="og:image" content={meta.image} />
                )}
            </Head>

            <div className="space-y-8">
                <header className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Free Online Tools
                    </h1>
                    <p className="max-w-2xl text-lg text-muted-foreground">
                        {meta.description}
                    </p>
                </header>

                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((tool) => (
                        <li key={tool.slug}>
                            <Link
                                href={show.url({
                                    locale: 'en',
                                    slug: tool.slug,
                                })}
                                className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {tool.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {tool.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </ToolsLayout>
    );
}
