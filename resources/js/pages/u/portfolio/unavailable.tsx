import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    owner: { name: string; username: string };
    portfolioUrl: string;
}

export default function ProjectUnavailable({ owner, portfolioUrl }: Props) {
    return (
        <>
            <Head title="Project Unavailable" />
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
                <div className="max-w-md text-center">
                    <div className="mb-6 text-6xl">🔒</div>
                    <h1 className="mb-3 text-2xl font-bold text-gray-900">Project Not Available</h1>
                    <p className="mb-8 text-gray-600">
                        This project is currently not accessible. It may have been unpublished or is under revision.
                    </p>
                    <Link href={portfolioUrl}>
                        <Button variant="default" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            View {owner.name}'s Portfolio
                        </Button>
                    </Link>
                </div>
            </div>
        </>
    );
}
