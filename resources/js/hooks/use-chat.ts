import { useCallback, useEffect, useRef, useState } from 'react';
import { getGuestUserId } from '@/lib/guest-id';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    streaming?: boolean;
    /** ISO string — only present on messages loaded from DB history */
    created_at?: string;
}

export interface ChatContext {
    type: 'platform' | 'course' | 'resource';
    /** Unique key — when this changes, a context divider is inserted */
    key: string;
    label?: string;
    /** Full URL to POST to (from Wayfinder) */
    endpoint: string;
    /** History endpoint URL (from Wayfinder) */
    historyEndpoint: string;
    /** Locale string needed by routes (e.g. 'en') */
    locale: string;
    /** Extra data merged into every POST body (e.g. visible course list) */
    extra?: Record<string, unknown>;
}

function makeId(): string {
    return Math.random().toString(36).slice(2);
}

export function useChat(context: ChatContext, isOpen: boolean) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const prevKeyRef = useRef<string>(context.key);
    const abortRef = useRef<AbortController | null>(null);
    const historyLoadedForKey = useRef<string | null>(null);
    // Oldest DB message id seen — used as the `before_id` cursor
    const oldestIdRef = useRef<number | null>(null);

    // When context switches: abort in-flight stream, clear messages immediately,
    // reset pagination state. The history-load effect below will fetch the new
    // context's history if the panel is open.
    useEffect(() => {
        if (prevKeyRef.current !== context.key) {
            prevKeyRef.current = context.key;
            abortRef.current?.abort();
            historyLoadedForKey.current = null;
            oldestIdRef.current = null;
            setHasMore(false);
            setMessages([]);
        }
    }, [context.key]);

    // Cancel any in-flight stream on unmount
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    // Load history when panel opens for this context (once per context key)
    useEffect(() => {
        if (!isOpen || historyLoadedForKey.current === context.key) {
            return;
        }

        historyLoadedForKey.current = context.key;
        loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, context.key]);

    const loadHistory = useCallback(async (beforeId?: number) => {
        setIsLoadingHistory(true);

        try {
            const guestUserId = getGuestUserId();
            const params = new URLSearchParams({
                context_key: context.key,
                guest_user_id: guestUserId,
            });

            if (beforeId) {
                params.set('before_id', String(beforeId));
            }

            const res = await fetch(`${context.historyEndpoint}?${params.toString()}`, {
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                return;
            }

            const data = (await res.json()) as {
                messages: Array<{ id: number; role: MessageRole; content: string; created_at: string }>;
                has_more: boolean;
            };

            setHasMore(data.has_more);

            if (data.messages.length === 0) {
                return;
            }

            const loaded: ChatMessage[] = data.messages.map((m) => ({
                id: String(m.id),
                role: m.role,
                content: m.content,
                created_at: m.created_at,
            }));

            // Track oldest id for pagination cursor
            oldestIdRef.current = data.messages[0].id;

            if (beforeId) {
                // Prepend older messages above existing ones
                setMessages((prev) => [...loaded, ...prev]);
            } else {
                // Initial load — append a session-break marker so the user can see
                // where their previous session ended and new messages begin.
                const sessionBreak: ChatMessage = {
                    id: 'session-break',
                    role: 'system',
                    content: 'session-break',
                };
                setMessages([...loaded, sessionBreak]);
            }
        } catch {
            // Silently ignore — history is non-critical
        } finally {
            setIsLoadingHistory(false);
        }
    }, [context.historyEndpoint, context.key]);

    const loadOlderMessages = useCallback(() => {
        if (!hasMore || isLoadingHistory || oldestIdRef.current === null) {
            return;
        }

        loadHistory(oldestIdRef.current);
    }, [hasMore, isLoadingHistory, loadHistory]);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isLoading) {
                return;
            }

            // Append user message immediately
            const userMsg: ChatMessage = { id: makeId(), role: 'user', content: text.trim() };
            const assistantMsgId = makeId();
            const assistantMsg: ChatMessage = { id: assistantMsgId, role: 'assistant', content: '', streaming: true };

            setMessages((prev) => [...prev, userMsg, assistantMsg]);
            setIsLoading(true);

            // Build history: only user/assistant messages, cap at 20 entries
            const historyMessages = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .slice(-20)
                .map(({ role, content }) => ({ role: role as 'user' | 'assistant', content }));

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const csrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1];
                const guestUserId = getGuestUserId();

                const response = await fetch(context.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/event-stream',
                        'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
                    },
                    body: JSON.stringify({
                        message: text.trim(),
                        history: historyMessages,
                        guest_user_id: guestUserId,
                        context_key: context.key,
                        context_url: window.location.href,
                        ...(context.extra ?? {}),
                    }),
                    signal: controller.signal,
                });

                if (!response.ok || !response.body) {
                    throw new Error(`Request failed: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: ')) {
                            continue;
                        }

                        const data = trimmed.slice(6);
                        if (data === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data) as { chunk: string };
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantMsgId
                                        ? { ...m, content: m.content + parsed.chunk }
                                        : m,
                                ),
                            );
                        } catch {
                            // ignore malformed chunk
                        }
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMsgId
                            ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false }
                            : m,
                    ),
                );
            } finally {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMsgId ? { ...m, streaming: false } : m,
                    ),
                );
                setIsLoading(false);
            }
        },
        [context.endpoint, context.key, isLoading, messages],
    );

    const clearMessages = useCallback(async () => {
        abortRef.current?.abort();

        try {
            const csrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1];
            const guestUserId = getGuestUserId();
            const params = new URLSearchParams({
                context_key: context.key,
                guest_user_id: guestUserId,
            });

            await fetch(`${context.historyEndpoint}?${params.toString()}`, {
                method: 'DELETE',
                headers: {
                    'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
                    Accept: 'application/json',
                },
            });
        } catch {
            // Silently ignore — messages will still be cleared locally
        }

        setMessages([]);
        setHasMore(false);
        oldestIdRef.current = null;
        // Allow re-loading history if the panel is re-opened
        historyLoadedForKey.current = null;
    }, [context.historyEndpoint, context.key]);

    return {
        messages,
        sendMessage,
        isLoading,
        isLoadingHistory,
        hasMore,
        loadOlderMessages,
        clearMessages,
    };
}
