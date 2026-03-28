import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    store as testStore,
    update as testUpdate,
    destroy as testDestroy,
} from '@/actions/App/Http/Controllers/TestController';
import {
    store as questionStoreAction,
    update as questionUpdateAction,
    destroy as questionDestroyAction,
} from '@/actions/App/Http/Controllers/TestQuestionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Course, CourseModule, CourseResource, Test, TestQuestion, TestQuestionOption } from '@/types';
import type { QuestionType } from '@/types/test';

interface Props {
    course: Course;
    module: CourseModule;
    resource: CourseResource;
    test: Test | null;
    questions: TestQuestion[];
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    paragraph: 'Written Answer',
    multiple_choice: 'Multiple Choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
    date: 'Date',
    time: 'Time',
};

const TYPES_WITH_OPTIONS: QuestionType[] = ['multiple_choice', 'checkboxes', 'dropdown'];
const OPERATOR_LABELS: Record<string, string> = {
    eq: '= (equal to)',
    gt: '> (greater than)',
    gte: '>= (greater than or equal)',
    lt: '< (less than)',
    lte: '<= (less than or equal)',
};

// ─── Info tooltip icon ────────────────────────────────────────────────────────
function InfoTip({ text }: { text: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="ml-1.5 inline-flex cursor-default items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground w-4.5 h-4.5 leading-none select-none">?</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">{text}</TooltipContent>
        </Tooltip>
    );
}

// ─── Shared styles ───────────────────────────────────────────────────────────
const SELECT_CLS =
    'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const TEXTAREA_CLS =
    'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

// ─── Section label inside a form ─────────────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            {children}
        </div>
    );
}

// ─── Local option type (may not have a server ID yet) ────────────────────────
interface LocalOption {
    id?: number;
    tempId: string;
    label: string;
    is_correct: boolean;
}

function makeTempId(): string {
    return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

// ─── Local question state ────────────────────────────────────────────────────
interface LocalQuestion {
    serverId?: number;
    tempId: string;
    question_type: QuestionType;
    body: string;
    hint: string;
    points: number;
    correct_answer: string;
    ai_rubric: string;
    numeric_operator: string;
    ai_help_enabled: boolean;
    is_required: boolean;
    order: number;
    options: LocalOption[];
    dirty: boolean;
    saving: boolean;
    expanded: boolean;
}

function serverQuestionToLocal(q: TestQuestion, expanded: boolean = false): LocalQuestion {
    const hasOpts = TYPES_WITH_OPTIONS.includes(q.question_type);
    return {
        serverId: q.id,
        tempId: makeTempId(),
        question_type: q.question_type,
        body: q.body,
        hint: q.hint ?? '',
        points: q.points,
        correct_answer: q.correct_answer ?? '',
        ai_rubric: q.ai_rubric ?? '',
        numeric_operator: q.numeric_operator ?? 'eq',
        ai_help_enabled: q.ai_help_enabled,
        is_required: q.is_required,
        order: q.order,
        options: hasOpts
            ? q.options.map((o) => ({
                  id: o.id,
                  tempId: makeTempId(),
                  label: o.label,
                  is_correct: isOptionCorrect(o.id, q.question_type, q.correct_answer ?? ''),
              }))
            : [],
        dirty: false,
        saving: false,
        expanded,
    };
}

function isOptionCorrect(optId: number, qType: QuestionType, correctAnswer: string): boolean {
    if (!correctAnswer) return false;
    if (qType === 'checkboxes') {
        try {
            const ids: number[] = JSON.parse(correctAnswer);
            return Array.isArray(ids) && ids.includes(optId);
        } catch {
            return false;
        }
    }
    return String(optId) === correctAnswer.trim();
}

function makeBlankQuestion(order: number): LocalQuestion {
    return {
        tempId: makeTempId(),
        question_type: 'multiple_choice',
        body: '',
        hint: '',
        points: 3,
        correct_answer: '',
        ai_rubric: '',
        numeric_operator: 'eq',
        ai_help_enabled: false,
        is_required: true,
        order,
        options: [
            { tempId: makeTempId(), label: '', is_correct: false },
            { tempId: makeTempId(), label: '', is_correct: false },
        ],
        dirty: true,
        saving: false,
        expanded: true,
    };
}

// ─── Test Settings Form ──────────────────────────────────────────────────────

function TestSettingsForm({
    course,
    module,
    resource,
    test,
    locale,
}: {
    course: Course;
    module: CourseModule;
    resource: CourseResource;
    test: Test | null;
    locale: string;
}) {
    const form = useForm({
        title: test?.title ?? `Self-Test on ${resource.title}`,
        description: test?.description ?? '',
        passing_score: String(test?.passing_score ?? ''),
        time_limit_minutes: String(test?.time_limit_minutes ?? ''),
        max_attempts: String(test?.max_attempts ?? ''),
        ai_help_enabled: test?.ai_help_enabled ?? false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (test) {
            form.submit(testUpdate({ locale, course: course.slug, module: module.id, resource: resource.id, test: test.id }));
        } else {
            form.submit(testStore({ locale, course: course.slug, module: module.id, resource: resource.id }));
        }
    }

    function handleDestroy() {
        if (!test) return;
        if (!confirm('Delete this test and all its questions? This cannot be undone.')) return;
        router.delete(testDestroy.url({ locale, course: course.slug, module: module.id, resource: resource.id, test: test.id }));
    }

    return (
        <form onSubmit={submit} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-semibold">Test Settings</h2>
                {test && (
                    <Button type="button" variant="danger" size="compact" onClick={handleDestroy}>
                        Delete Test
                    </Button>
                )}
            </div>

            <div className="space-y-4 p-5">
                <FormSection title="Basic Info">
                    <div className="space-y-3">
                        <div>
                            <Label>Title</Label>
                            <Input className="mt-1" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <textarea
                                rows={2}
                                className={TEXTAREA_CLS}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder="Optional overview shown to learners before they start"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Scoring &amp; Limits">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <Label>Passing Score (%)</Label>
                            <Input type="number" min={0} max={100} className="mt-1" value={form.data.passing_score} onChange={(e) => form.setData('passing_score', e.target.value)} placeholder="e.g. 70" />
                        </div>
                        <div>
                            <Label>Time Limit (min)</Label>
                            <Input type="number" min={1} className="mt-1" value={form.data.time_limit_minutes} onChange={(e) => form.setData('time_limit_minutes', e.target.value)} placeholder="No limit" />
                        </div>
                        <div>
                            <Label>Max Attempts</Label>
                            <Input type="number" min={1} className="mt-1" value={form.data.max_attempts} onChange={(e) => form.setData('max_attempts', e.target.value)} placeholder="Unlimited" />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Features">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={form.data.ai_help_enabled}
                            onChange={(e) => form.setData('ai_help_enabled', e.target.checked)}
                            className="accent-primary h-4 w-4"
                        />
                        <div>
                            <p className="text-sm font-medium leading-none">Enable AI Help globally</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Learners can request AI hints on any question in this test</p>
                        </div>
                    </label>
                </FormSection>
            </div>

            <div className="flex justify-end border-t border-border px-5 py-3">
                <Button type="submit" disabled={form.processing}>
                    {test ? 'Save Settings' : 'Create Test'}
                </Button>
            </div>
        </form>
    );
}

// ─── Question Card ───────────────────────────────────────────────────────────

function QuestionCard({
    question: q,
    testId,
    locale,
    onUpdate,
    onDelete,
}: {
    question: LocalQuestion;
    testId: number;
    locale: string;
    onUpdate: (tempId: string, updated: LocalQuestion) => void;
    onDelete: (tempId: string) => void;
}) {
    const hasOpts = TYPES_WITH_OPTIONS.includes(q.question_type);
    const isAiGraded = q.question_type === 'paragraph';
    const isDateOrTime = q.question_type === 'date' || q.question_type === 'time';

    const [focusOptionId, setFocusOptionId] = useState<string | null>(null);
    const optionInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    useEffect(() => {
        if (focusOptionId) {
            const input = optionInputRefs.current.get(focusOptionId);
            if (input) {
                input.focus();
                setFocusOptionId(null);
            }
        }
    }, [focusOptionId, q.options]);

    // ── Local state mutators ───────────────────────────────────────────────
    const set = useCallback(
        <K extends keyof LocalQuestion>(key: K, value: LocalQuestion[K]) => {
            onUpdate(q.tempId, { ...q, [key]: value, dirty: true });
        },
        [q, onUpdate],
    );

    function setOption(optTempId: string, patch: Partial<LocalOption>) {
        onUpdate(q.tempId, {
            ...q,
            dirty: true,
            options: q.options.map((o) => (o.tempId === optTempId ? { ...o, ...patch } : o)),
        });
    }

    function addOption() {
        const newTempId = makeTempId();
        onUpdate(q.tempId, {
            ...q,
            dirty: true,
            options: [...q.options, { tempId: newTempId, label: '', is_correct: false }],
        });
        setFocusOptionId(newTempId);
    }

    function removeOption(optTempId: string) {
        onUpdate(q.tempId, {
            ...q,
            dirty: true,
            options: q.options.filter((o) => o.tempId !== optTempId),
        });
    }

    function markCorrect(optTempId: string) {
        if (q.question_type === 'checkboxes') {
            // Toggle checkbox
            setOption(optTempId, { is_correct: !q.options.find((o) => o.tempId === optTempId)?.is_correct });
        } else {
            // Radio: only one correct
            onUpdate(q.tempId, {
                ...q,
                dirty: true,
                options: q.options.map((o) => ({
                    ...o,
                    is_correct: o.tempId === optTempId,
                })),
            });
        }
    }

    function handleTypeChange(newType: QuestionType) {
        const newHasOpts = TYPES_WITH_OPTIONS.includes(newType);
        const options = newHasOpts
            ? q.options.length > 0
                ? q.options
                : [
                      { tempId: makeTempId(), label: '', is_correct: false },
                      { tempId: makeTempId(), label: '', is_correct: false },
                  ]
            : [];

        onUpdate(q.tempId, {
            ...q,
            question_type: newType,
            options,
            correct_answer: '',
            ai_rubric: newType === 'paragraph' ? q.ai_rubric : '',
            numeric_operator: newType === 'date' || newType === 'time' ? q.numeric_operator || 'eq' : '',
            dirty: true,
        });
    }

    // ── Save ───────────────────────────────────────────────────────────────
    async function save() {
        if (!q.body.trim()) return;

        onUpdate(q.tempId, { ...q, saving: true });

        const payload: Record<string, unknown> = {
            question_type: q.question_type,
            body: q.body,
            hint: q.hint || null,
            points: q.points,
            is_required: q.is_required,
            ai_help_enabled: q.ai_help_enabled,
            order: q.order,
        };

        if (isAiGraded) {
            payload.ai_rubric = q.ai_rubric || null;
        } else if (isDateOrTime) {
            payload.correct_answer = q.correct_answer || null;
            payload.numeric_operator = q.numeric_operator || 'eq';
        } else if (!hasOpts) {
            payload.correct_answer = q.correct_answer || null;
        }

        if (hasOpts) {
            payload.options = q.options
                .filter((o) => o.label.trim())
                .map((o, i) => ({
                    ...(o.id ? { id: o.id } : {}),
                    label: o.label.trim(),
                    is_correct: o.is_correct,
                }));
        }

        const isNew = !q.serverId;
        const url = isNew
            ? questionStoreAction.url({ locale, test: testId })
            : questionUpdateAction.url({ locale, test: testId, question: q.serverId! });

        try {
            const res = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                const msg = errData?.message || `Save failed (${res.status})`;
                alert(msg);
                onUpdate(q.tempId, { ...q, saving: false });
                return;
            }

            const saved: TestQuestion = await res.json();
            onUpdate(q.tempId, serverQuestionToLocal(saved, q.expanded));
        } catch {
            alert('Network error — could not save question.');
            onUpdate(q.tempId, { ...q, saving: false });
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this question?')) return;

        if (!q.serverId) {
            onDelete(q.tempId);
            return;
        }

        try {
            await fetch(
                questionDestroyAction.url({ locale, test: testId, question: q.serverId }),
                {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                },
            );
            onDelete(q.tempId);
        } catch {
            alert('Network error — could not delete question.');
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {/* Collapsed header */}
            <div
                className="flex cursor-pointer items-center gap-3 bg-muted/40 px-4 py-3 hover:bg-muted/60 transition-colors"
                onClick={() => onUpdate(q.tempId, { ...q, expanded: !q.expanded })}
            >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-border text-[11px] font-semibold text-muted-foreground">
                    {q.order}
                </span>
                <span className="flex-1 truncate text-sm font-medium">
                    {q.body || 'New question'}
                    {q.dirty && !q.serverId && <span className="ml-2 text-xs text-amber-500">(unsaved)</span>}
                    {q.dirty && q.serverId && <span className="ml-2 text-xs text-amber-500">(modified)</span>}
                </span>
                <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="secondary" className="text-xs capitalize">{QUESTION_TYPE_LABELS[q.question_type]}</Badge>
                    <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">{q.points} mark</span>
                    <button onClick={handleDelete} className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10">
                        Delete
                    </button>
                    <span className="text-xs text-muted-foreground">{q.expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {/* Expanded body */}
            {q.expanded && (
                <div className="border-t border-border bg-card px-5 py-5 space-y-4">
                    {/* Question setup */}
                    <FormSection title="Question">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs">Question Text</Label>
                                <textarea
                                    rows={2}
                                    className={TEXTAREA_CLS}
                                    value={q.body}
                                    onChange={(e) => set('body', e.target.value)}
                                    placeholder="Type your question here…"
                                    autoFocus={!q.serverId}
                                />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <Label className="text-xs">Type</Label>
                                    <select
                                        className={SELECT_CLS}
                                        value={q.question_type}
                                        onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                                    >
                                        {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label className="text-xs">Marks</Label>
                                    <Input
                                        type="number" min={1} className="mt-1 text-sm"
                                        value={q.points}
                                        onChange={(e) => set('points', Math.max(1, Number(e.target.value) || 1))}
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Answer — option-based types */}
                    {hasOpts && (
                        <FormSection title="Answer Options">
                            <p className="mb-2 text-xs text-muted-foreground">
                                {q.question_type === 'checkboxes'
                                    ? 'Check all correct answers.'
                                    : 'Select the correct answer.'}
                            </p>
                            <div className="space-y-2">
                                {q.options.map((opt, idx) => (
                                    <div key={opt.tempId} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                                        <input
                                            type={q.question_type === 'checkboxes' ? 'checkbox' : 'radio'}
                                            name={`correct-${q.tempId}`}
                                            checked={opt.is_correct}
                                            onChange={() => markCorrect(opt.tempId)}
                                            className="accent-primary h-4 w-4 shrink-0"
                                            title="Mark as correct"
                                        />
                                        <Input
                                            ref={(el) => {
                                                if (el) optionInputRefs.current.set(opt.tempId, el);
                                                else optionInputRefs.current.delete(opt.tempId);
                                            }}
                                            className="flex-1 h-8 text-sm"
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt.label}
                                            onChange={(e) => setOption(opt.tempId, { label: e.target.value })}
                                        />
                                        {q.options.length > 1 && (
                                            <button
                                                onClick={() => removeOption(opt.tempId)}
                                                className="text-xs text-destructive hover:underline shrink-0"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="secondary" size="compact" onClick={addOption}>
                                    + Add Option
                                </Button>
                            </div>
                        </FormSection>
                    )}

                    {/* Answer — paragraph (AI graded) */}
                    {isAiGraded && (
                        <FormSection title="Expected Answer">
                            <div>
                                <Label className="text-xs">
                                    Describe what a good answer looks like
                                    <InfoTip text="AI will compare the learner's answer against this description and score it 0–100. Be specific about what you expect." />
                                </Label>
                                <textarea
                                    rows={3}
                                    className={TEXTAREA_CLS}
                                    value={q.ai_rubric}
                                    onChange={(e) => set('ai_rubric', e.target.value)}
                                    placeholder="e.g. The answer should mention X, Y, and Z. Full marks if all three concepts are explained clearly."
                                />
                            </div>
                        </FormSection>
                    )}

                    {/* Answer — date/time */}
                    {isDateOrTime && (
                        <FormSection title="Correct Answer">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <Label className="text-xs">Expected Value</Label>
                                    <Input
                                        type={q.question_type === 'date' ? 'date' : 'time'}
                                        className="mt-1 text-sm"
                                        value={q.correct_answer}
                                        onChange={(e) => set('correct_answer', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Comparison</Label>
                                    <select
                                        className={SELECT_CLS}
                                        value={q.numeric_operator}
                                        onChange={(e) => set('numeric_operator', e.target.value)}
                                    >
                                        {Object.entries(OPERATOR_LABELS).map(([v, l]) => (
                                            <option key={v} value={v}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </FormSection>
                    )}

                    {/* Behaviour */}
                    <FormSection title="Behaviour">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs">
                                    Hint (shown to learner on request)
                                    <InfoTip text="Shown only when the learner clicks 'Show hint'. Keep it guiding, not revealing." />
                                </Label>
                                <Input
                                    className="mt-1 text-sm"
                                    value={q.hint}
                                    onChange={(e) => set('hint', e.target.value)}
                                    placeholder="Optional hint text…"
                                />
                            </div>
                            <div className="flex gap-6">
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={q.is_required}
                                        onChange={(e) => set('is_required', e.target.checked)}
                                        className="accent-primary h-4 w-4"
                                    />
                                    Required
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={q.ai_help_enabled}
                                        onChange={(e) => set('ai_help_enabled', e.target.checked)}
                                        className="accent-primary h-4 w-4"
                                    />
                                    AI Help
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    {/* Save button */}
                    <div className="flex items-center justify-between">
                        <div>
                            {!q.dirty && q.serverId && (
                                <span className="text-xs text-green-600">Saved</span>
                            )}
                        </div>
                        <Button
                            onClick={save}
                            disabled={q.saving || !q.body.trim()}
                            className={q.dirty ? 'animate-ring-warn' : ''}
                        >
                            {q.saving ? 'Saving…' : q.serverId ? 'Save Question' : 'Create Question'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestEditor({ course, module, resource, test, questions: serverQuestions }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const [questions, setQuestions] = useState<LocalQuestion[]>(() =>
        serverQuestions.map((q) => serverQuestionToLocal(q)),
    );
    const questionsEndRef = useRef<HTMLDivElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: `/${l}/courses` },
        { title: course.title, href: `/${l}/courses/${course.slug}/edit` },
        { title: resource.title, href: '#' },
        { title: 'Test Editor', href: '#' },
    ];

    function addQuestion() {
        const nextOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.order)) + 1 : 1;
        setQuestions((prev) => [...prev, makeBlankQuestion(nextOrder)]);
        requestAnimationFrame(() => {
            questionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    const handleUpdate = useCallback((tempId: string, updated: LocalQuestion) => {
        setQuestions((prev) => prev.map((q) => (q.tempId === tempId ? updated : q)));
    }, []);

    const handleDelete = useCallback((tempId: string) => {
        setQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
    }, []);

    const unsavedCount = questions.filter((q) => q.dirty).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Test Editor — ${resource.title}`} />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Test Editor</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">{resource.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {test && (
                            <Badge variant="secondary" className="text-xs">
                                {questions.length} question{questions.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                        {unsavedCount > 0 && (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                {unsavedCount} unsaved
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Test settings */}
                <TestSettingsForm course={course} module={module} resource={resource} test={test} locale={l} />

                {/* Questions */}
                {test && (
                    <div className="space-y-3 mb-48">
                        <h2 className="font-semibold text-foreground">Questions</h2>

                        {questions.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                                <p className="text-sm font-medium text-foreground">No questions yet</p>
                                <p className="mt-1 text-xs text-muted-foreground">Click "+ Add Question" below to create your first question.</p>
                            </div>
                        )}

                        {questions.map((question) => (
                            <QuestionCard
                                key={question.tempId}
                                question={question}
                                testId={test.id}
                                locale={l}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        ))}

                        <div ref={questionsEndRef} />
                        <Button size="compact" onClick={addQuestion} className="w-full bg-green-500 hover:bg-green-600 mt-4">+ Add Question</Button>
                    </div>
                )}

                {!test && (
                    <p className="text-sm text-muted-foreground">
                        Create the test first to start adding questions.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
