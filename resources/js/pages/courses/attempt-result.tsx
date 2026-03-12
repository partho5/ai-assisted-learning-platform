import { Head, router, usePage } from '@inertiajs/react';
import { usePoll } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { toggleShowcase } from '@/actions/App/Http/Controllers/PortfolioController';
import { platform } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
}

const STATUS_LABELS: Record<string, string> = {
    in_progress: 'In Progress',
    submitted: 'Submitted',
    grading: 'Grading',
    graded: 'Graded',
    endorsed: 'Endorsed',
};

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
                        {isPending ? '...' : `${answer?.points_earned ?? 0} / ${question.points}`}
                    </Badge>
                )}
            </div>

            <div className="mb-2 rounded bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {answer?.answer_value ?? <span className="italic">No answer</span>}
            </div>

            {isAiGraded && isPending && (
                <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
            )}

            {isAiGraded && !isPending && answer?.ai_explanation && (
                <p className="text-xs text-muted-foreground">{answer.ai_explanation}</p>
            )}
        </div>
    );
}

export default function AttemptResult({ attempt, isShowcased }: Props) {
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
        { title: attempt.test.title, href: '#' },
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

            <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
                {/* Score header */}
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                    <h1 className="mb-1 text-xl font-bold">{attempt.test.title}</h1>
                    <p className="mb-4 text-sm text-muted-foreground">Attempt #{attempt.attempt_number}</p>

                    {isGrading ? (
                        <div className="space-y-2">
                            <Skeleton className="mx-auto h-14 w-24 rounded-full" />
                            <p className="text-sm text-muted-foreground">AI is grading your answers…</p>
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
                                        variant={isShowcased ? 'default' : 'outline'}
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

                <Button variant="secondary" onClick={() => window.history.back()}>
                    Back
                </Button>
            </div>

            <FloatingChatButton context={chatContext} />
        </AppLayout>
    );
}
