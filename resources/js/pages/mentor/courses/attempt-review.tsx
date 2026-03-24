import { Head, useForm, usePage } from '@inertiajs/react';
import { endorse as endorseAttempt } from '@/actions/App/Http/Controllers/TestAttemptController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, TestAttempt, TestAttemptAnswer, TestQuestion } from '@/types';

function resolveAnswerDisplay(question: TestQuestion, value: string | null): string | null {
    if (value === null) return null;
    if (question.question_type === 'checkboxes') {
        const ids: number[] = JSON.parse(value) ?? [];
        return ids.map((id) => question.options.find((o) => o.id === id)?.label ?? String(id)).join(', ');
    }
    if (question.question_type === 'multiple_choice' || question.question_type === 'dropdown') {
        const id = parseInt(value, 10);
        return question.options.find((o) => o.id === id)?.label ?? value;
    }
    return value;
}

interface AttemptWithRelations extends TestAttempt {
    test: {
        id: number;
        title: string;
        questions: TestQuestion[];
    };
    answers: TestAttemptAnswer[];
    user: { id: number; name: string; username: string; avatar: string | null };
}

interface Props {
    attempt: AttemptWithRelations;
}

export default function AttemptReview({ attempt }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const form = useForm<{
        mentor_feedback: string;
        score_overrides: Array<{ answer_id: number; points: number }>;
    }>({
        mentor_feedback: attempt.mentor_feedback ?? '',
        score_overrides: [],
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Submissions', href: '#' },
        { title: `${attempt.user.name} — Attempt #${attempt.attempt_number}`, href: '#' },
    ];

    function setOverride(answerId: number, points: number) {
        const existing = form.data.score_overrides.findIndex((o) => o.answer_id === answerId);
        const updated = [...form.data.score_overrides];
        if (existing >= 0) {
            updated[existing] = { answer_id: answerId, points };
        } else {
            updated.push({ answer_id: answerId, points });
        }
        form.setData('score_overrides', updated);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.submit(endorseAttempt({ locale: l, attempt: attempt.id }));
    }

    const isEndorsed = attempt.status === 'endorsed';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review — ${attempt.user.name}`} />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                {/* Header */}
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="font-bold">{attempt.test.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                {attempt.user.name} (@{attempt.user.username}) — Attempt #{attempt.attempt_number}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {attempt.score !== null && (
                                <Badge variant="secondary">{attempt.score}%</Badge>
                            )}
                            <Badge>{attempt.status}</Badge>
                        </div>
                    </div>
                </div>

                {/* Answers */}
                <div className="space-y-3">
                    {attempt.test.questions.map((question) => {
                        const answer = attempt.answers.find((a) => a.test_question_id === question.id);
                        const isAiPending = answer?.ai_grading_status === 'pending' || answer?.ai_grading_status === 'processing';
                        const currentOverride = form.data.score_overrides.find((o) => o.answer_id === answer?.id);

                        return (
                            <div key={question.id} className="rounded-lg border border-border bg-card p-4">
                                <div className="mb-2 flex items-start justify-between gap-3">
                                    <p className="text-sm font-medium leading-relaxed">{question.body}</p>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {answer?.points_earned ?? 0} / {question.points}
                                    </span>
                                </div>

                                <div className="mb-2 rounded bg-muted/50 px-3 py-2 text-sm">
                                    {resolveAnswerDisplay(question, answer?.answer_value ?? null) ?? <span className="text-muted-foreground italic">No answer</span>}
                                </div>

                                {isAiPending && (
                                    <div className="mb-2 space-y-1">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-2/3" />
                                    </div>
                                )}

                                {answer?.ai_explanation && !isAiPending && (
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        <span className="font-medium">AI: </span>{answer.ai_explanation}
                                    </div>
                                )}

                                {/* Score override */}
                                {!isEndorsed && answer && (
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">Override points:</Label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={question.points}
                                            defaultValue={answer.points_earned ?? 0}
                                            onChange={(e) => setOverride(answer.id, Number(e.target.value))}
                                            className="w-16 rounded border border-input bg-background px-2 py-1 text-xs"
                                        />
                                        <span className="text-xs text-muted-foreground">/ {question.points}</span>
                                        {currentOverride && (
                                            <Badge variant="secondary" className="text-xs">overridden</Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Endorse form */}
                {!isEndorsed ? (
                    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <h2 className="font-semibold">Endorse Submission</h2>
                        <div>
                            <Label>Feedback (optional)</Label>
                            <textarea
                                rows={4}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                value={form.data.mentor_feedback}
                                onChange={(e) => form.setData('mentor_feedback', e.target.value)}
                                placeholder="Leave feedback for the learner…"
                            />
                        </div>
                        <Button type="submit" disabled={form.processing} className="w-full">
                            {form.processing ? 'Endorsing…' : 'Endorse Submission'}
                        </Button>
                    </form>
                ) : (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center dark:border-green-900 dark:bg-green-950/30">
                        <p className="font-medium text-green-700 dark:text-green-400">Submission Endorsed ✓</p>
                        {attempt.mentor_feedback && (
                            <p className="mt-2 text-sm text-muted-foreground">{attempt.mentor_feedback}</p>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
