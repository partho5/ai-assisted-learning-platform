import { Head, router, usePage } from '@inertiajs/react';
import { usePoll } from '@inertiajs/react';
import { Loader2, Sparkles, Star } from 'lucide-react';
import { toggleShowcase } from '@/actions/App/Http/Controllers/PortfolioController';
import { platform } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, TestAttempt, TestQuestion, TestAttemptAnswer } from '@/types';

interface Props {
    attempt: TestAttempt & {
        test: {
            id: number;
            title: string;
            passing_score: number | null;
            questions: TestQuestion[];
        };
        answers: TestAttemptAnswer[];
    };
    isShowcased: boolean;
    learnUrl: string | null;
}

const STATUS_LABELS: Record<string, string> = {
    in_progress: 'In Progress',
    submitted: 'Submitted',
    grading: 'Grading',
    graded: 'Graded',
    endorsed: 'Endorsed',
};

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

function AnswerCard({ question, answer }: { question: TestQuestion; answer: TestAttemptAnswer | undefined }) {
    const isPending = !answer || answer.ai_grading_status === 'pending' || answer.ai_grading_status === 'processing';
    const isAiGraded = question.evaluation_method === 'ai_graded';

    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-relaxed">{question.body}</p>
                {!isAiGraded && answer && (
                    <Badge variant={answer.is_correct ? 'default' : 'destructive'} className="shrink-0 text-xs">
                        {answer.is_correct ? `+${answer.points_earned ?? 0}` : '0'} / {question.points}
                    </Badge>
                )}
                {isAiGraded && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : `${answer?.points_earned ?? 0} / ${question.points}`}
                    </Badge>
                )}
            </div>

            <div className="mb-2 rounded bg-muted/50 px-3 py-2 text-base text-muted-foreground">
                <span className="mr-1 text-xs font-medium text-muted-foreground/60">Your answer:</span>
                {resolveAnswerDisplay(question, answer?.answer_value ?? null) ?? <span className="italic">No answer</span>}
            </div>

            {!isAiGraded && question.correct_answer && (
                <div className="mt-1 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="font-medium">Correct answer: </span>
                    {resolveAnswerDisplay(question, question.correct_answer)}
                </div>
            )}

            {isAiGraded && question.ai_rubric && (
                <div className="mt-1 rounded bg-muted/40 px-3 py-2 text-base text-muted-foreground">
                    <span className="font-medium">Grading criteria: </span>{question.ai_rubric}
                </div>
            )}

            {isAiGraded && isPending && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    AI grading in progress…
                </div>
            )}

            {isAiGraded && !isPending && answer?.ai_explanation && (
                <p className="mt-1 text-base text-muted-foreground">{answer.ai_explanation}</p>
            )}
        </div>
    );
}

export default function AttemptResult({ attempt, isShowcased, learnUrl }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    function handleToggleShowcase() {
        router.post(
            toggleShowcase.url({ locale: l, attempt: attempt.id }),
            {},
            { preserveState: true, only: ['isShowcased'] },
        );
    }
    const isGrading = attempt.status === 'grading';

    usePoll(3000, { only: ['attempt'] }, { autoStart: isGrading });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Courses', href: `/${l}/courses` },
        { title: attempt.test.title, href: learnUrl ?? '#' },
        { title: `Attempt #${attempt.attempt_number}`, href: '#' },
    ];

    const passScore = attempt.test.passing_score;
    const passed = passScore !== null && attempt.score !== null && attempt.score >= passScore;

    const chatContext = {
        type: 'platform' as const,
        key: `attempt-${attempt.id}`,
        endpoint: platform.url(l),
        historyEndpoint: chatHistory.url(l),
        locale: l,
        autoTrigger: !isGrading,
        pageContext: `Attempt result page. Test: "${attempt.test.title}", Score: ${attempt.score ?? '?'}%${passScore !== null ? `, Passing score: ${passScore}%` : ''}, Status: ${attempt.status}${passed ? ' (passed)' : passScore !== null ? ' (not passed)' : ''}.`,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Result — ${attempt.test.title}`} />

            <div className="w-full mx-auto max-w-6xl space-y-6 px-4 py-8">
                {/* Score header */}
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                    <h1 className="mb-1 text-xl font-bold">{attempt.test.title}</h1>
                    <p className="mb-4 text-sm text-muted-foreground">Attempt #{attempt.attempt_number}</p>

                    {isGrading ? (
                        <div className="flex flex-col items-center gap-3 py-2">
                            <div className="relative flex h-16 w-16 items-center justify-center">
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500 dark:border-indigo-900 dark:border-t-indigo-400" />
                                <Sparkles className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">AI is grading your answers</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">This usually takes a few seconds…</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 text-5xl font-bold">
                                {attempt.score ?? '—'}
                                <span className="text-2xl text-muted-foreground">%</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Badge>{STATUS_LABELS[attempt.status] ?? attempt.status}</Badge>
                                {passScore !== null && (
                                    <Badge variant={passed ? 'default' : 'destructive'}>
                                        {passed ? 'Passed' : `Need ${passScore}% to pass`}
                                    </Badge>
                                )}
                            </div>
                            {attempt.mentor_feedback && (
                                <div className="mt-4 rounded-lg bg-muted/60 px-4 py-3 text-left text-sm">
                                    <p className="mb-1 font-medium text-xs uppercase tracking-wide text-muted-foreground">Mentor Feedback</p>
                                    <p>{attempt.mentor_feedback}</p>
                                </div>
                            )}

                            {attempt.status === 'endorsed' && (
                                <div className="mt-4">
                                    <Button
                                        variant={isShowcased ? 'achievement' : 'secondary'}
                                        size="compact"
                                        onClick={handleToggleShowcase}
                                        className="inline-flex items-center gap-1.5"
                                    >
                                        <Star className={`h-3.5 w-3.5 ${isShowcased ? 'fill-current' : ''}`} />
                                        {isShowcased ? 'Featured on portfolio' : 'Feature on portfolio'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Answers */}
                <div className="space-y-3">
                    <h2 className="font-semibold">Your Answers</h2>
                    {attempt.test.questions.map((question) => {
                        const answer = attempt.answers?.find((a) => a.test_question_id === question.id);
                        return <AnswerCard key={question.id} question={question} answer={answer} />;
                    })}
                </div>

                <Button variant="secondary" onClick={() => learnUrl ? router.visit(learnUrl) : window.history.back()}>
                    Back
                </Button>
            </div>

            <FloatingChatButton context={chatContext} />
        </AppLayout>
    );
}
