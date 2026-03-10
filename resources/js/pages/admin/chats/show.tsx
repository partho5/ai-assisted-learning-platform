import { Head, Link, usePage } from '@inertiajs/react';
import { Bot, User as UserIcon, ArrowLeft, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    sent_at: string;
}

interface ChatIdentity {
    type: 'user' | 'guest';
    name: string;
    username: string | null;
    avatar: string | null;
}

interface Session {
    id: number;
    identity: ChatIdentity;
    context_type: string;
    context_key: string;
    context_url: string;
    started_at: string;
    messages: Message[];
}

interface Props {
    session: Session;
}

const CONTEXT_TYPE_LABEL: Record<string, string> = {
    platform: 'Platform',
    course: 'Course',
    resource: 'Resource',
};

export default function AdminChatShow({ session }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: `/${l}/admin/dashboard` },
        { title: 'Chat Session #' + session.id, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Chat Session #${session.id}`} />

            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Link
                            href={`/${l}/admin/dashboard`}
                            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to dashboard
                        </Link>
                        <h1 className="text-xl font-bold">Chat Session #{session.id}</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Started {session.started_at}</p>
                    </div>
                    <Badge variant="secondary" className="mt-7 shrink-0">
                        {CONTEXT_TYPE_LABEL[session.context_type] ?? session.context_type}
                    </Badge>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4 text-sm">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User</p>
                        {session.identity.type === 'user' ? (
                            <>
                                <p className="font-medium">{session.identity.name}</p>
                                <p className="text-xs text-muted-foreground">@{session.identity.username}</p>
                            </>
                        ) : (
                            <p className="text-muted-foreground">Guest (anonymous)</p>
                        )}
                    </div>
                    <div className="h-full w-px bg-border" />
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Context key</p>
                        <p className="font-mono text-xs">{session.context_key}</p>
                    </div>
                    <div className="h-full w-px bg-border" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Page URL</p>
                        <a
                            href={session.context_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 truncate text-xs text-primary hover:underline"
                        >
                            <Globe className="h-3 w-3 shrink-0" />
                            <span className="truncate">{session.context_url}</span>
                        </a>
                    </div>
                    <div className="h-full w-px bg-border" />
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Messages</p>
                        <p className="font-medium">{session.messages.length}</p>
                    </div>
                </div>

                {/* Chat transcript */}
                <div className="space-y-4">
                    {session.messages.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">No messages in this session.</p>
                    ) : (
                        session.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {msg.role === 'user' ? (
                                        <UserIcon className="h-4 w-4" />
                                    ) : (
                                        <Bot className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[75%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div
                                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                            msg.role === 'user'
                                                ? 'rounded-tr-sm bg-primary text-primary-foreground'
                                                : 'rounded-tl-sm bg-muted text-foreground'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <p className="px-1 text-[11px] text-muted-foreground">{msg.sent_at}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
