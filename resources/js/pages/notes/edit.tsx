import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    edit as notesEdit,
    update as notesUpdate,
} from '@/actions/App/Http/Controllers/PersonalNotesController';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/rich-text-editor';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    personal_notes: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Personal Notes', href: '#' },
];

export default function NotesEdit({ personal_notes }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const form = useForm({ personal_notes: personal_notes ?? '' });
    const [saved, setSaved] = useState(false);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(notesUpdate(l), {
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Personal Notes" />

            <div className="p-4 md:p-6">
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-card dark:border-sidebar-border">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-sidebar-border/70 bg-muted/40 px-6 py-4 dark:border-sidebar-border">
                        <div>
                            <h1 className="text-lg font-semibold">
                                Personal Notes
                            </h1>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Lock className="h-3 w-3" />
                                <span>Private — only you can see this</span>
                            </div>
                            <p className="mt-2">
                                Use this space for anything — ideas, links,
                                reminders, drafts…
                            </p>
                        </div>
                    </div>

                    {/* Editor */}
                    <form onSubmit={submit} className="flex flex-col gap-5 p-6">
                        <div className="notes-editor">
                            <RichTextEditor
                                value={form.data.personal_notes}
                                onChange={(content) =>
                                    form.setData('personal_notes', content)
                                }
                                disabled={form.processing}
                            />
                        </div>

                        <div className="flex items-center gap-3 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                            <Button
                                type="submit"
                                variant="secondary"
                                size="compact"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Saving…' : 'Save Notes'}
                            </Button>
                            {saved && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Saved
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
