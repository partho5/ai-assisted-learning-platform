import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    store as testStore,
    update as testUpdate,
    destroy as testDestroy,
} from '@/actions/App/Http/Controllers/TestController';
import {
    store as questionStore,
    update as questionUpdate,
    destroy as questionDestroy,
    reorder as questionReorder,
} from '@/actions/App/Http/Controllers/TestQuestionController';
import {
    store as optionStore,
    update as optionUpdate,
    destroy as optionDestroy,
} from '@/actions/App/Http/Controllers/TestQuestionOptionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Course, CourseModule, CourseResource, Test, TestQuestion, TestQuestionOption } from '@/types';

interface Props {
    course: Course;
    module: CourseModule;
    resource: CourseResource;
    test: Test | null;
    questions: TestQuestion[];
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
    short_text: 'Short Text',
    paragraph: 'Paragraph',
    multiple_choice: 'Multiple Choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
    date: 'Date',
    time: 'Time',
};

const TYPES_WITH_OPTIONS = ['multiple_choice', 'checkboxes', 'dropdown'];

// ─── Test Settings Form ───────────────────────────────────────────────────────

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
        title: test?.title ?? `${resource.title} — Test`,
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
        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Test Settings</h2>
                {test && (
                    <Button type="button" variant="danger" size="compact" onClick={handleDestroy}>
                        Delete Test
                    </Button>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Label>Title</Label>
                    <Input
                        className="mt-1"
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                    />
                </div>
                <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <textarea
                        rows={2}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={form.data.description}
                        onChange={(e) => form.setData('description', e.target.value)}
                    />
                </div>
                <div>
                    <Label>Passing Score (%)</Label>
                    <Input
                        type="number" min={0} max={100} className="mt-1"
                        value={form.data.passing_score}
                        onChange={(e) => form.setData('passing_score', e.target.value)}
                        placeholder="e.g. 70"
                    />
                </div>
                <div>
                    <Label>Time Limit (minutes)</Label>
                    <Input
                        type="number" min={1} className="mt-1"
                        value={form.data.time_limit_minutes}
                        onChange={(e) => form.setData('time_limit_minutes', e.target.value)}
                        placeholder="No limit"
                    />
                </div>
                <div>
                    <Label>Max Attempts</Label>
                    <Input
                        type="number" min={1} className="mt-1"
                        value={form.data.max_attempts}
                        onChange={(e) => form.setData('max_attempts', e.target.value)}
                        placeholder="Unlimited"
                    />
                </div>
                <div className="flex items-center gap-2 pt-5">
                    <input
                        id="ai-help"
                        type="checkbox"
                        checked={form.data.ai_help_enabled}
                        onChange={(e) => form.setData('ai_help_enabled', e.target.checked)}
                        className="accent-primary"
                    />
                    <Label htmlFor="ai-help" className="cursor-pointer text-sm">Enable AI Help globally</Label>
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <Button type="submit" disabled={form.processing}>
                    {test ? 'Save Settings' : 'Create Test'}
                </Button>
            </div>
        </form>
    );
}

// ─── Option row ───────────────────────────────────────────────────────────────

function OptionRow({
    option,
    test,
    question,
    locale,
}: {
    option: TestQuestionOption;
    test: Test;
    question: TestQuestion;
    locale: string;
}) {
    const [label, setLabel] = useState(option.label);
    const [editing, setEditing] = useState(false);

    function save() {
        router.put(optionUpdate.url({ locale, test: test.id, question: question.id, option: option.id }), { label });
        setEditing(false);
    }

    function remove() {
        router.delete(optionDestroy.url({ locale, test: test.id, question: question.id, option: option.id }));
    }

    return (
        <div className="flex items-center gap-2">
            {editing ? (
                <>
                    <Input
                        className="flex-1 h-7 text-xs"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && save()}
                        autoFocus
                    />
                    <Button size="compact" onClick={save}>Save</Button>
                    <Button size="compact" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                </>
            ) : (
                <>
                    <span className="flex-1 text-sm">{option.label}</span>
                    <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                    <button onClick={remove} className="text-xs text-destructive hover:underline">×</button>
                </>
            )}
        </div>
    );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
    question,
    test,
    index,
    total,
    locale,
}: {
    question: TestQuestion;
    test: Test;
    index: number;
    total: number;
    locale: string;
}) {
    const [open, setOpen] = useState(false);
    const [newOption, setNewOption] = useState('');

    const form = useForm({
        question_type: question.question_type,
        body: question.body,
        hint: question.hint ?? '',
        points: String(question.points),
        evaluation_method: question.evaluation_method,
        numeric_operator: question.numeric_operator ?? '',
        correct_answer: question.correct_answer ?? '',
        ai_rubric: question.ai_rubric ?? '',
        ai_help_enabled: question.ai_help_enabled,
        is_required: question.is_required,
        order: String(question.order),
    });

    const hasOptions = TYPES_WITH_OPTIONS.includes(form.data.question_type);
    const isAiGraded = form.data.evaluation_method === 'ai_graded';
    const isNumeric = form.data.evaluation_method === 'numeric_comparison';

    function save(e: React.FormEvent) {
        e.preventDefault();
        form.submit(questionUpdate({ locale, test: test.id, question: question.id }));
    }

    function remove() {
        if (!confirm('Delete this question?')) return;
        router.delete(questionDestroy.url({ locale, test: test.id, question: question.id }));
    }

    function moveUp() {
        if (index === 0) return;
        router.post(questionReorder.url({ locale, test: test.id }), {
            order: [] // Will be handled by full reorder below
        });
    }

    function addOption() {
        if (!newOption.trim()) return;
        router.post(optionStore.url({ locale, test: test.id, question: question.id }), { label: newOption.trim() });
        setNewOption('');
    }

    return (
        <div className="rounded-lg border border-border bg-card">
            <div
                className="flex cursor-pointer items-center gap-3 px-4 py-3"
                onClick={() => setOpen((o) => !o)}
            >
                <span className="text-xs text-muted-foreground">{index + 1}.</span>
                <span className="flex-1 text-sm font-medium truncate">{question.body || 'Untitled question'}</span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="secondary" className="text-xs capitalize">{QUESTION_TYPE_LABELS[question.question_type]}</Badge>
                    <span className="text-xs text-muted-foreground">{question.points}pt</span>
                    <button onClick={remove} className="text-xs text-destructive hover:underline">Delete</button>
                    <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
                </div>
            </div>

            {open && (
                <div className="border-t border-border px-4 py-4">
                    <form onSubmit={save} className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label className="text-xs">Question Body</Label>
                                <textarea
                                    rows={2}
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={form.data.body}
                                    onChange={(e) => form.setData('body', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Type</Label>
                                <select
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={form.data.question_type}
                                    onChange={(e) => form.setData('question_type', e.target.value as TestQuestion['question_type'])}
                                >
                                    {Object.entries(QUESTION_TYPE_LABELS).map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs">Points</Label>
                                <Input
                                    type="number" min={0} className="mt-1 text-sm"
                                    value={form.data.points}
                                    onChange={(e) => form.setData('points', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Evaluation Method</Label>
                                <select
                                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={form.data.evaluation_method}
                                    onChange={(e) => form.setData('evaluation_method', e.target.value as TestQuestion['evaluation_method'])}
                                >
                                    <option value="exact_match">Exact Match</option>
                                    <option value="numeric_comparison">Numeric Comparison</option>
                                    <option value="ai_graded">AI Graded</option>
                                </select>
                            </div>
                            {isNumeric && (
                                <div>
                                    <Label className="text-xs">Numeric Operator</Label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={form.data.numeric_operator}
                                        onChange={(e) => form.setData('numeric_operator', e.target.value)}
                                    >
                                        <option value="eq">= (Equal)</option>
                                        <option value="gt">&gt; (Greater than)</option>
                                        <option value="gte">≥ (Greater or equal)</option>
                                        <option value="lt">&lt; (Less than)</option>
                                        <option value="lte">≤ (Less or equal)</option>
                                    </select>
                                </div>
                            )}
                            {!isAiGraded && !hasOptions && (
                                <div>
                                    <Label className="text-xs">Correct Answer</Label>
                                    <Input
                                        className="mt-1 text-sm"
                                        value={form.data.correct_answer}
                                        onChange={(e) => form.setData('correct_answer', e.target.value)}
                                        placeholder="Expected answer"
                                    />
                                </div>
                            )}
                            {isAiGraded && (
                                <div className="sm:col-span-2">
                                    <Label className="text-xs">AI Grading Rubric</Label>
                                    <textarea
                                        rows={3}
                                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={form.data.ai_rubric}
                                        onChange={(e) => form.setData('ai_rubric', e.target.value)}
                                        placeholder="Describe what a good answer looks like…"
                                    />
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <Label className="text-xs">Hint (shown to learner)</Label>
                                <Input
                                    className="mt-1 text-sm"
                                    value={form.data.hint}
                                    onChange={(e) => form.setData('hint', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_required}
                                        onChange={(e) => form.setData('is_required', e.target.checked)}
                                        className="accent-primary"
                                    />
                                    Required
                                </label>
                                <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.data.ai_help_enabled}
                                        onChange={(e) => form.setData('ai_help_enabled', e.target.checked)}
                                        className="accent-primary"
                                    />
                                    AI Help
                                </label>
                            </div>
                        </div>

                        <Button type="submit" size="compact" disabled={form.processing}>Save Question</Button>
                    </form>

                    {/* Options management */}
                    {hasOptions && (
                        <div className="mt-4 space-y-2 border-t border-border pt-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Options</p>
                            {question.options.map((opt) => (
                                <OptionRow key={opt.id} option={opt} test={test} question={question} locale={locale} />
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    className="flex-1 h-7 text-xs"
                                    placeholder="New option…"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                />
                                <Button size="compact" onClick={addOption}>Add</Button>
                            </div>
                            {hasOptions && (
                                <p className="text-xs text-muted-foreground">
                                    Correct answer: set option IDs as JSON array in question settings above (e.g. after saving options, copy their IDs).
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestEditor({ course, module, resource, test, questions }: Props) {
    const { locale } = usePage().props;
    const l = String(locale);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Courses', href: `/${l}/courses` },
        { title: course.title, href: `/${l}/courses/${course.slug}/edit` },
        { title: resource.title, href: '#' },
        { title: 'Test Editor', href: '#' },
    ];

    function addQuestion() {
        if (!test) return;
        router.post(questionStore.url({ locale: l, test: test.id }), {
            question_type: 'short_text',
            body: '',
            points: 1,
            evaluation_method: 'exact_match',
            is_required: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Test Editor — ${resource.title}`} />

            <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Test Editor</h1>
                    <Badge variant="secondary">{resource.title}</Badge>
                </div>

                {/* Test settings */}
                <TestSettingsForm
                    course={course}
                    module={module}
                    resource={resource}
                    test={test}
                    locale={l}
                />

                {/* Questions */}
                {test && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">Questions ({questions.length})</h2>
                            <Button size="compact" onClick={addQuestion}>+ Add Question</Button>
                        </div>

                        {questions.length === 0 && (
                            <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                                No questions yet. Add your first question above.
                            </p>
                        )}

                        {questions.map((question, index) => (
                            <QuestionCard
                                key={question.id}
                                question={question}
                                test={test}
                                index={index}
                                total={questions.length}
                                locale={l}
                            />
                        ))}
                    </div>
                )}

                {!test && (
                    <p className="text-sm text-muted-foreground">
                        Create a test first to start adding questions.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
