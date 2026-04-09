import { Head, Link, usePage } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PortfolioBuilderLayout from '@/layouts/portfolio-builder-layout';
import type { Paginated } from '@/types';

interface PortfolioMessage {
    id: number;
    sender_name: string;
    sender_email: string;
    subject: string | null;
    is_read: boolean;
    created_at: string;
}

interface Props {
    messages: Paginated<PortfolioMessage>;
}

export default function MessagesIndex({ messages }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    return (
        <PortfolioBuilderLayout breadcrumbs={[
            { title: 'Portfolio Builder', href: `/${l}/dashboard/portfolio-builder` },
            { title: 'Messages', href: `/${l}/dashboard/portfolio-builder/messages` },
        ]}>
            <Head title="Portfolio Messages" />

            <h1 className="mb-6 text-2xl font-bold">Messages</h1>

            {(messages.data?.length ?? 0) === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                        <Mail className="mb-3 h-12 w-12" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Messages from your portfolio contact form will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {messages.data.map((msg) => (
                        <Link
                            key={msg.id}
                            href={`/${l}/dashboard/portfolio-builder/messages/${msg.id}`}
                            className="flex items-start justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                        >
                            <div className="min-w-0">
                                <p className={`text-sm ${!msg.is_read ? 'font-semibold' : ''}`}>
                                    {msg.sender_name}
                                    <span className="ml-2 text-muted-foreground">&lt;{msg.sender_email}&gt;</span>
                                    {!msg.is_read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />}
                                </p>
                                <p className="truncate text-sm text-muted-foreground">{msg.subject || 'No subject'}</p>
                            </div>
                            <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleDateString()}
                            </span>
                        </Link>
                    ))}

                    {/* Pagination */}
                    {messages.last_page > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            {messages.links?.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`rounded-md px-3 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </PortfolioBuilderLayout>
    );
}
