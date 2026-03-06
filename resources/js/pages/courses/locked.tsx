import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import PublicLayout from '@/layouts/public-layout';

interface Props {
    course: {
        id: number;
        title: string;
        slug: string;
    };
    resource: {
        id: number;
        title: string;
        type: string;
    };
}

export default function LockedResource({ course, resource }: Props) {
    return (
        <PublicLayout>
            <Head title={`${resource.title} - Locked`} />

            <div className="mx-auto max-w-2xl px-4 py-16 md:px-6">
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <div className="mb-6 text-5xl">🔒</div>

                    <h1 className="mb-2 text-2xl font-bold">{resource.title}</h1>

                    <p className="mb-6 text-muted-foreground">
                        This resource is only available to learners with full course access.
                    </p>

                    <p className="mb-8 text-sm text-muted-foreground">
                        You are currently viewing this course as an observer. To unlock all resources,
                        please purchase full access to <strong>{course.title}</strong>.
                    </p>

                    <Button
                        onClick={() => window.history.back()}
                        variant="secondary"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </PublicLayout>
    );
}
