import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { resource as resourceChatAction } from '@/actions/App/Http/Controllers/AiChatController';
import { index as chatHistory } from '@/routes/chat/history';
import { complete as markComplete } from '@/actions/App/Http/Controllers/ResourceCompletionController';
import {
    store as startAttempt,
    saveAnswers,
    submit as submitAttempt,
} from '@/actions/App/Http/Controllers/TestAttemptController';
import { FloatingChatButton } from '@/components/chat/floating-chat-button';
import RichHtml from '@/components/rich-html';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import PublicLayout from '@/layouts/public-layout';
import type {
    BreadcrumbItem,
    Enrollment,
    ResourceCompletion,
    TestAttempt,
    TestQuestion,
} from '@/types';
import type { ResourceType } from '@/types/course';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SidebarResource {
    id: number;
    title: string;
    type: ResourceType;
    is_free: boolean;
    order: number;
}

interface SidebarModule {
    id: number;
    title: string;
    order: number;
    resources: SidebarResource[];
}

interface LearnCourse {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    description: string | null;
    modules: SidebarModule[];
}

interface EnrichedResource {
    id: number;
    module_id: number;
    title: string;
    type: ResourceType;
    url: string | null;
    content: string | null;
    source: string | null;
    estimated_time: number | null;
    mentor_note: string | null;
    why_this_resource: string | null;
    is_free: boolean;
    order: number;
    test?: {
        id: number;
        title: string | null;
        passing_score: number | null;
        questions: TestQuestion[];
    } | null;
    completion: ResourceCompletion | null;
    forumThread: {
        id: number;
        slug: string;
        title: string;
        replies_count: number;
        last_activity_at: string | null;
        category: { id: number; slug: string } | null;
    } | null;
    activeAttempt: (TestAttempt & {
        answers: Array<{ test_question_id: number; answer_value: string | null }>;
    }) | null;
    previousAttempts: Array<{
        id: number;
        attempt_number: number;
        status: string;
        score: number | null;
        submitted_at: string | null;
        endorsed_at: string | null;
    }>;
}

interface Props {
    course: LearnCourse;
    initialResourceId: number;
    resources: EnrichedResource[];
    enrollment: Enrollment | null;
    ogUrl: string;
    isPreview?: boolean;
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status?: string }) {
    if (status === 'endorsed') return <span className="text-green-500">✓</span>;
    if (status === 'submitted') return <span className="text-yellow-500">⏳</span>;
    if (status === 'grading') return <span className="text-blue-500">🤖</span>;
    return <span className="text-muted-foreground/40">○</span>;
}

// ─── Resource content renderer ────────────────────────────────────────────────

function ResourceContent({ resource }: { resource: EnrichedResource }) {
    if (resource.type === 'video' && resource.url) {
        const youtubeMatch = resource.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        const vimeoMatch = resource.url.match(/vimeo\.com\/(\d+)/);
        let embedUrl = '';
        if (youtubeMatch) embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        else if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        else embedUrl = resource.url;

        return (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allow="fullscreen"
                    allowFullScreen
                    loading="lazy"
                    title={resource.title}
                />
            </div>
        );
    }

    if (resource.type === 'article') {
        return (
            <div className="rounded-lg border border-border bg-card p-2">
                <div className="mb-3 flex items-center gap-2">
                    <Badge variant="secondary">Article</Badge>
                    {resource.source && <span className="text-sm text-muted-foreground">{resource.source}</span>}
                </div>
                {resource.why_this_resource && <RichHtml content={resource.why_this_resource} className="mb-4 text-sm text-muted-foreground" />}
                {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="default">Open Article ↗</Button>
                    </a>
                )}
            </div>
        );
    }

    if (resource.type === 'text') {
        return (
            <div className="rounded-lg border border-border bg-card p-2">
                <div
                    className="prose dark:prose-invert rich-html max-w-none text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: resource.content || '' }}
                />
            </div>
        );
    }

    if (resource.type === 'document' && resource.url) {
        return (
            <div className="rounded-lg border border-border bg-card p-2">
                <div className="mb-3">
                    <Badge variant="secondary">Document</Badge>
                </div>
                <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
                    className="h-[600px] w-full rounded border"
                    loading="lazy"
                    title={resource.title}
                />
                <div className="mt-2">
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="default">Download ↗</Button>
                    </a>
                </div>
            </div>
        );
    }

    if (resource.type === 'audio' && resource.url) {
        return (
            <div className="rounded-lg border border-border bg-card p-2">
                <audio controls className="w-full">
                    <source src={resource.url} />
                    Your browser does not support audio.
                </audio>
            </div>
        );
    }

    if (resource.type === 'image' && resource.url) {
        return (
            <div className="rounded-lg border border-border bg-card p-2">
                <img
                    src={resource.url}
                    alt={resource.title}
                    loading="lazy"
                    className="max-h-[600px] w-full rounded object-contain"
                />
            </div>
        );
    }

    if (resource.type === 'assignment') {
        return null;
    }

    return (
        <div className="rounded-lg border border-border bg-card p-2 text-muted-foreground">
            No preview available.
        </div>
    );
}

// ─── Question field ────────────────────────────────────────────────────────────

function QuestionField({
    question,
    value,
    onChange,
}: {
    question: TestQuestion;
    value: string;
    onChange: (v: string) => void;
}) {
    if (question.question_type === 'multiple_choice' || question.question_type === 'dropdown') {
        return (
            <div className="space-y-2">
                {question.options.map((opt) => (
                    <label key={opt.id} className="flex cursor-pointer items-center gap-2 text-base">
                        <input
                            type="radio"
                            name={`q-${question.id}`}
                            value={String(opt.id)}
                            checked={value === String(opt.id)}
                            onChange={() => onChange(String(opt.id))}
                            className="accent-primary"
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        );
    }

    if (question.question_type === 'checkboxes') {
        const selected: number[] = value ? JSON.parse(value) : [];
        function toggle(id: number) {
            const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
            onChange(JSON.stringify(next.sort()));
        }
        return (
            <div className="space-y-2">
                {question.options.map((opt) => (
                    <label key={opt.id} className="flex cursor-pointer items-center gap-2 text-base">
                        <input
                            type="checkbox"
                            checked={selected.includes(opt.id)}
                            onChange={() => toggle(opt.id)}
                            className="accent-primary"
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        );
    }

    if (question.question_type === 'paragraph') {
        return (
            <textarea
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }

    if (question.question_type === 'date') {
        return <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />;
    }

    if (question.question_type === 'time') {
        return <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} />;
    }

    return <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} />;
}

// ─── Test form ─────────────────────────────────────────────────────────────────

function TestForm({
    resource,
    courseSlug,
    locale,
}: {
    resource: EnrichedResource;
    courseSlug: string;
    locale: string;
}) {
    const questions = resource.test?.questions ?? [];
    const attempt = resource.activeAttempt;

    const initialValues = Object.fromEntries(
        questions.map((q) => {
            const saved = attempt?.answers?.find((a) => a.test_question_id === q.id);
            return [q.id, saved?.answer_value ?? ''];
        }),
    );

    const [values, setValues] = useState<Record<number, string>>(initialValues);
    const [saving, setSaving] = useState(false);
    const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function updateValue(qId: number, v: string) {
        setValues((prev) => ({ ...prev, [qId]: v }));
        if (autosaveRef.current) clearTimeout(autosaveRef.current);
        autosaveRef.current = setTimeout(() => autosave(qId, v), 2000);
    }

    function buildAnswers(overrides: Record<number, string> = {}) {
        return questions.map((q) => ({
            question_id: q.id,
            value: (overrides[q.id] ?? values[q.id]) || null,
        }));
    }

    async function autosave(qId: number, v: string) {
        if (!attempt) return;
        setSaving(true);
        await fetch(saveAnswers.url({ locale, attempt: attempt.id }), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ answers: buildAnswers({ [qId]: v }) }),
        });
        setSaving(false);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!attempt) return;
        router.post(submitAttempt.url({ locale, attempt: attempt.id }), {}, { preserveScroll: true });
    }

    if (!attempt) {
        return (
            <div className="text-center">
                <Button
                    onClick={() =>
                        router.post(
                            startAttempt.url({ locale, course: courseSlug, resource: resource.id }),
                            {},
                            { preserveScroll: true },
                        )
                    }
                >
                    Start Test
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {saving && <p className="text-xs text-muted-foreground">Saving…</p>}
            {questions.map((question, index) => (
                <div key={question.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-1 flex items-start justify-between gap-2">
                        <Label className="text-base font-medium leading-relaxed">
                            {index + 1}. {question.body}
                            {question.is_required && <span className="ml-1 text-destructive">*</span>}
                        </Label>
                        <span className="shrink-0 text-sm text-muted-foreground">
                            {question.points} pt{question.points !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {question.hint && <p className="mb-2 text-sm text-muted-foreground">{question.hint}</p>}
                    <QuestionField
                        question={question}
                        value={values[question.id] ?? ''}
                        onChange={(v) => updateValue(question.id, v)}
                    />
                </div>
            ))}
            <Button type="submit" className="w-full">
                Submit Test
            </Button>
        </form>
    );
}

// ─── Single resource block ────────────────────────────────────────────────────

function ResourceBlock({
    resource,
    courseSlug,
    enrollment,
    locale,
}: {
    resource: EnrichedResource;
    courseSlug: string;
    enrollment: Enrollment | null;
    locale: string;
}) {
    const isObserverLocked = !resource.is_free && (!enrollment || enrollment.access_level === 'observer');
    const isAssignment = resource.type === 'assignment';
    const hasTest = !!resource.test;
    const isCompleted = resource.completion?.status === 'endorsed';
    const isSubmitted =
        resource.completion?.status === 'submitted' ||
        resource.completion?.status === 'in_progress';

    function handleMarkComplete() {
        router.post(
            markComplete.url({ locale, course: courseSlug, resource: resource.id }),
            {},
            { preserveScroll: true },
        );
    }

    return (
        <div>
            {/* Resource header */}
            <div className="mb-4 px-2">
                <h2 className="text-xl text-blue-600 font-bold">{resource.title}</h2>
                {resource.estimated_time && (
                    <p className="mt-0.5 text-base text-muted-foreground">
                        ~{resource.estimated_time} min
                    </p>
                )}
            </div>

            {resource.why_this_resource && !isAssignment && (
                <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-base">
                    <span className="mb-1 block font-medium">
                        Importance of this lesson:
                    </span>
                    <RichHtml
                        content={resource.why_this_resource}
                        className="text-base"
                    />
                </div>
            )}

            {/* Observer locked overlay */}
            {isObserverLocked ? (
                <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
                    <div className="mb-2 text-3xl">🔒</div>
                    <p className="text-sm font-medium">
                        This lesson requires full access
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Upgrade your enrollment to unlock all lessons.
                    </p>
                </div>
            ) : (
                <>
                    {/* Content */}
                    {!isAssignment && (
                        <div className="mb-5">
                            <ResourceContent resource={resource} />
                        </div>
                    )}

                    {/* Test / assignment — enrolled only */}
                    {hasTest && enrollment && (
                        <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    {isAssignment ? 'Assignment' : 'Self-Check'}
                                </h3>
                                {isCompleted && <Badge>Endorsed ✓</Badge>}
                                {!isCompleted && isSubmitted && (
                                    <Badge variant="secondary">Submitted</Badge>
                                )}
                            </div>

                            {resource.previousAttempts.length > 0 && (
                                <div className="rounded-lg border border-indigo-200 bg-indigo-100 p-3">
                                    <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
                                        Previous Attempts
                                    </p>
                                    <div className="space-y-1">
                                        {resource.previousAttempts.map((pa) => (
                                            <div
                                                key={pa.id}
                                                className="flex items-center justify-between text-base dark:text-gray-900"
                                            >
                                                <span>
                                                    Attempt #{pa.attempt_number}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {pa.score !== null && (
                                                        <span>{pa.score}%</span>
                                                    )}
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs capitalize"
                                                    >
                                                        {pa.status}
                                                    </Badge>
                                                    <button
                                                        onClick={() =>
                                                            router.get(
                                                                `/${locale}/test-attempts/${pa.id}/result`,
                                                            )
                                                        }
                                                        className="text-xs text-primary hover:underline dark:text-blue-600"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isCompleted && (
                                <TestForm
                                    resource={resource}
                                    courseSlug={courseSlug}
                                    locale={locale}
                                />
                            )}
                        </div>
                    )}

                    {/* Mark complete — non-test, enrolled */}
                    {!hasTest && enrollment && !isCompleted && (
                        <div className="mt-5 flex justify-end">
                            <Button onClick={handleMarkComplete}>
                                Mark as Complete
                            </Button>
                        </div>
                    )}
                    {!hasTest && enrollment && isCompleted && (
                        <div className="mt-5 flex justify-end">
                            <Badge>Completed ✓</Badge>
                        </div>
                    )}
                </>
            )}

            {resource.mentor_note && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                    <span className="font-medium">Mentor note: </span>
                    {resource.mentor_note}
                </div>
            )}

            {/* Per-resource forum link */}
            <div className="mt-6 pt-4 border-t">
                {resource.forumThread && resource.forumThread.category ? (
                    <Link
                        href={`/${locale}/forum/${resource.forumThread.category.slug}/${resource.forumThread.slug}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        <span>💬</span>
                        <span>
                            {resource.forumThread.replies_count > 0
                                ? `${resource.forumThread.replies_count} ${resource.forumThread.replies_count === 1 ? 'person' : 'people'} discussing this`
                                : 'Discuss this resource'}
                        </span>
                    </Link>
                ) : (
                    <Link
                        href={`/${locale}/forum/create?resource_id=${resource.id}&title=${encodeURIComponent('Discussion: ' + resource.title)}`}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                        <span>💬</span>
                        <span>Ask a mentor</span>
                    </Link>
                )}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Learn({ course, initialResourceId, resources, enrollment, ogUrl, isPreview = false }: Props) {
    const { locale, auth, name, appUrl: serverAppUrl } = usePage().props;
    const appUrl = String(serverAppUrl ?? '');
    const l = String(locale);
    const isGuest = !auth?.user;

    // Derived progress data
    const completionMap = useMemo(() => {
        const map: Record<number, string> = {};
        resources.forEach((r) => {
            if (r.completion?.status) map[r.id] = r.completion.status;
        });
        return map;
    }, [resources]);

    const endorsedCount = useMemo(
        () => Object.values(completionMap).filter((s) => s === 'endorsed').length,
        [completionMap],
    );
    const progressPercent =
        resources.length > 0 ? Math.round((endorsedCount / resources.length) * 100) : 0;

    // Scroll tracking state
    const [activeResourceId, setActiveResourceId] = useState(initialResourceId);
    const activeResource = useMemo(
        () => resources.find((r) => r.id === activeResourceId) ?? resources[0],
        [activeResourceId, resources],
    );
    const chatContext = useMemo(() => ({
        type: 'resource' as const,
        key: `resource-${activeResourceId}`,
        label: activeResource?.title,
        resourceType: typeof activeResource?.type === 'string' ? activeResource.type : (activeResource?.type as { value?: string })?.value ?? 'text',
        endpoint: resourceChatAction.url({ locale: l, course: course.slug, resource: activeResourceId }),
        historyEndpoint: chatHistory.url(l),
        locale: l,
        autoTrigger: enrollment?.access_level === 'full',
    }), [activeResourceId, activeResource, l, course.slug, enrollment?.access_level]);
    const mainRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const resourceRefs = useRef<Map<number, HTMLElement>>(new Map());

    // Initial scroll: hash takes priority, then initialResourceId
    useEffect(() => {
        const hash = window.location.hash;
        const match = hash.match(/^#r-(\d+)$/);
        const targetId = match ? parseInt(match[1]) : initialResourceId;
        requestAnimationFrame(() => {
            document.getElementById(`r-${targetId}`)?.scrollIntoView({ behavior: 'instant', block: 'start' });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll listener for active resource tracking
    // Guard flag: suppress sidebar sync when user triggers a click-based scroll
    const suppressSidebarSync = useRef(false);

    useEffect(() => {
        let ticking = false;

        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                // Viewport-relative threshold: 30% from top
                const threshold = window.innerHeight * 0.30;
                let bestId = resources[0]?.id ?? initialResourceId;
                let closestDistance = Infinity;

                resourceRefs.current.forEach((el, id) => {
                    const rect = el.getBoundingClientRect();
                    // Pick the resource whose top is closest to the threshold (from above)
                    if (rect.top < threshold) {
                        const distance = threshold - rect.top;
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            bestId = id;
                        }
                    }
                });

                setActiveResourceId(bestId);
                ticking = false;
            });
        }

        // Listen on both window (guest/public layout) AND main element (logged-in
        // sidebar layout where main is the constrained scroll container)
        const mainEl = mainRef.current;
        window.addEventListener('scroll', onScroll, { passive: true });
        mainEl?.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            mainEl?.removeEventListener('scroll', onScroll);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update URL hash when active resource changes
    useEffect(() => {
        history.replaceState(null, '', `#r-${activeResourceId}`);
    }, [activeResourceId]);

    // Sync sidebar: scroll active item into view (skip when user clicked a sidebar item)
    useEffect(() => {
        if (suppressSidebarSync.current) {
            suppressSidebarSync.current = false;
            return;
        }
        const sidebar = sidebarRef.current;
        const button = sidebar?.querySelector<HTMLElement>(`[data-resource-id="${activeResourceId}"]`);
        if (sidebar && button) {
            const btnTop = button.offsetTop;
            const btnBottom = btnTop + button.offsetHeight;
            if (btnTop < sidebar.scrollTop) {
                sidebar.scrollTop = btnTop - 8;
            } else if (btnBottom > sidebar.scrollTop + sidebar.clientHeight) {
                sidebar.scrollTop = btnBottom - sidebar.clientHeight + 8;
            }
        }
    }, [activeResourceId]);

    function scrollToResource(id: number) {
        suppressSidebarSync.current = true;
        setActiveResourceId(id);
        const el = document.getElementById(`r-${id}`);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 80; // minus some pixels to avoid hiding under top nav menu.
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Courses', href: `/${l}/courses` },
        { title: course.title, href: `/${l}/courses/${course.slug}` },
        { title: 'Learn', href: '#' },
    ];

    const inner = (
        <div className="flex min-h-svh flex-col">
            {isPreview && (
                <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 dark:bg-amber-500 dark:text-amber-950">
                    <span>👁 Preview mode — this course is not published yet</span>
                </div>
            )}
        <div className="flex flex-1 flex-col md:flex-row">
            {/* ── Sidebar ── */}
            <aside
                ref={sidebarRef}
                className="w-full shrink-0 overflow-y-auto border-b border-border md:w-80 md:border-b-0 md:border-r md:sticky md:top-0 md:h-screen"
            >
                <div className="p-0">
                    {/* Progress bar — enrolled only */}
                    {enrollment && (
                        <div className="mb-3 p-2">
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{progressPercent}% complete</span>
                                <span>
                                    {endorsedCount} / {resources.length}
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <h2 className="mb-3 text-sm font-semibold p-2">{course.title}</h2>

                    {/* Module + resource list */}
                    {course.modules.map((mod) => (
                        <div key={mod.id} className="mb-3">
                            <p className="mb-1 p-2 text-xs font-semibold  tracking-wide text-muted-foreground">
                                {mod.title}
                            </p>
                            <ul className="space-y-0.5">
                                {mod.resources.map((r) => {
                                    const isActive = r.id === activeResourceId;
                                    const isLocked =
                                        !r.is_free && (!enrollment || enrollment.access_level === 'observer');
                                    return (
                                        <li key={r.id}>
                                            <Tooltip>
                                            <TooltipTrigger asChild>
                                            <button
                                                data-resource-id={r.id}
                                                onClick={() =>
                                                    scrollToResource(r.id)
                                                }
                                                className={`bg-blue-50dark:bg-blue-950/40 flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-gray-900 transition-colors dark:text-gray-100 ${
                                                    isActive
                                                        ? 'border-blue-600 bg-sky-200 font-medium dark:bg-sky-600'
                                                        : ''
                                                }`}
                                            >
                                                {enrollment ? (
                                                    isLocked ? (
                                                        <span className="text-muted-foreground/40">
                                                            🔒
                                                        </span>
                                                    ) : (
                                                        <StatusIcon
                                                            status={
                                                                completionMap[
                                                                    r.id
                                                                ]
                                                            }
                                                        />
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground/40">
                                                        {r.is_free ? '○' : '○'}
                                                    </span>
                                                )}
                                                <span className="flex-1 truncate">
                                                    {r.title}
                                                </span>
                                                {r.is_free && !enrollment && (
                                                    <Badge
                                                        variant="outline"
                                                        className="py-0 text-xs font-normal"
                                                    >
                                                        Free
                                                    </Badge>
                                                )}
                                                {!r.is_free && !enrollment && (
                                                    <Badge
                                                        variant="outline"
                                                        className="py-0 text-xs font-normal"
                                                    >
                                                        🔒
                                                    </Badge>
                                                )}
                                            </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">{r.title}</TooltipContent>
                                            </Tooltip>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}

                    {/* Enroll CTA — guests and non-enrolled */}
                    {!enrollment && (
                        <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-center">
                            {isGuest ? (
                                <>
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        Sign up to track your progress
                                    </p>
                                    <div className="flex flex-col gap-1.5">
                                        <Button asChild variant="enroll" size="default" className="w-full">
                                            <Link href="/register">Sign up free</Link>
                                        </Button>
                                        <Button asChild variant="ghost" size="default" className="w-full">
                                            <Link href="/login">Log in</Link>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        Enroll to track progress &amp; submit assignments
                                    </p>
                                    <Button asChild variant="enroll" size="default" className="w-full">
                                        <Link href={`/${l}/courses/${course.slug}`}>View course</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* ── Main content — continuous scroll ── */}
            <main ref={mainRef} className="flex-1 overflow-y-auto max-w-6xl mx-auto px-1 py-6 md:py-8">
                {resources.map((resource) => (
                    <section
                        key={resource.id}
                        id={`r-${resource.id}`}
                        ref={(el) => {
                            if (el) resourceRefs.current.set(resource.id, el);
                            else resourceRefs.current.delete(resource.id);
                        }}
                        className="mb-16 scroll-mt-4 border-b border-border pb-16 last:border-0 last:pb-0"
                    >
                        <ResourceBlock
                            resource={resource}
                            courseSlug={course.slug}
                            enrollment={enrollment}
                            locale={l}
                        />
                    </section>
                ))}
            </main>
        </div>
        </div>
    );

    const activeTitle = activeResource?.title ?? course.title;
    const ogDescription = course.description
        ? course.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
        : '';
    const ogImage = course.thumbnail ?? '/logo.png';
    const absoluteOgImage = ogImage.startsWith('http') ? ogImage : `${appUrl}${ogImage}`;
    const ogHead = (
        <Head title={`${activeTitle} — ${course.title}`}>
            <meta name="description" content={`${activeTitle} — ${ogDescription}`} />
            <link rel="canonical" href={ogUrl} />
            <meta property="og:site_name" content={String(name)} />
            <meta property="og:title" content={`${activeTitle} — ${course.title} | ${String(name)}`} />
            <meta property="og:description" content={ogDescription} />
            <meta property="og:image" content={absoluteOgImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={`${activeTitle} — ${course.title}`} />
            <meta property="og:url" content={ogUrl} />
            <meta property="og:type" content="article" />
            <meta property="og:locale" content="en_US" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${activeTitle} — ${course.title} | ${String(name)}`} />
            <meta name="twitter:description" content={ogDescription} />
            <meta name="twitter:image" content={absoluteOgImage} />
            <script type="application/ld+json">{JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LearningResource',
                name: activeTitle,
                description: ogDescription,
                url: ogUrl,
                image: absoluteOgImage,
                isPartOf: {
                    '@type': 'Course',
                    name: course.title,
                    url: `${appUrl}/${l}/courses/${course.slug}`,
                },
                provider: { '@type': 'Organization', name: String(name), url: appUrl },
            })}</script>
            <script type="application/ld+json">{JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Courses', item: `${appUrl}/${l}/courses` },
                    { '@type': 'ListItem', position: 2, name: course.title, item: `${appUrl}/${l}/courses/${course.slug}` },
                    { '@type': 'ListItem', position: 3, name: activeTitle, item: ogUrl },
                ],
            })}</script>
        </Head>
    );

    if (isGuest) {
        return (
            <PublicLayout hidePlatformChat>
                {ogHead}
                {inner}
                <FloatingChatButton context={chatContext} />
            </PublicLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} hidePlatformChat>
            {ogHead}
            {inner}
            <FloatingChatButton context={chatContext} />
        </AppLayout>
    );
}
