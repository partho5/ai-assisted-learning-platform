import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';

interface PortfolioMessage {
    id: number;
    sender_name: string;
    sender_email: string;
    subject: string | null;
    body: string;
    is_read: boolean;
    created_at: string;
}

interface Props {
    message: PortfolioMessage;
}

export default function MessageShow({ message }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    function handleDelete() {
        if (!confirm('Delete this message?')) return;
        router.delete(`/${l}/dashboard/portfolio-builder/messages/${message.id}`);
    }

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Messages', href: `/${l}/dashboard/portfolio-builder/messages` },
            { title: message.subject || 'Message', href: `/${l}/dashboard/portfolio-builder/messages/${message.id}` },
        ]}>
            <Head title={message.subject || 'Message'} />

            <div className="mb-6 flex items-center justify-between">
                <Link href={`/${l}/dashboard/portfolio-builder/messages`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Messages
                </Link>
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{message.subject || 'No subject'}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        From: <strong>{message.sender_name}</strong> &lt;{message.sender_email}&gt;
                        <span className="ml-4">{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="whitespace-pre-wrap text-sm">{message.body}</div>
                </CardContent>
            </Card>
        </PortfolioBuilderLayout>
    );
}
