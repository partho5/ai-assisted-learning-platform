import { useCallback, useEffect, useRef, useState } from 'react';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    streaming?: boolean;
}

export interface ChatContext {
    type: 'platform' | 'course' | 'resource';
    /** Unique key — when this changes, a context divider is inserted */
    key: string;
    label?: string;
    /** Full URL to POST to (from Wayfinder) */
    endpoint: string;
    /** Locale string needed by routes (e.g. 'en') */
    locale: string;
}

function makeId(): string {
    return Math.random().toString(36).slice(2);
}

function buildDivider(label: string): ChatMessage {
    return { id: makeId(), role: 'system', content: `Now viewing: ${label}` };
}

export function useChat(context: ChatContext) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const prevKeyRef = useRef<string>(context.key);
    const abortRef = useRef<AbortController | null>(null);

    // Insert a divider when context switches (not on first mount)
    useEffect(() => {
        if (prevKeyRef.current !== context.key) {
            prevKeyRef.current = context.key;
            if (messages.length > 0 && context.label) {
                setMessages((prev) => [...prev, buildDivider(context.label!)]);
            }
        }
    }, [context.key, context.label, messages.length]);

    // Cancel any in-flight stream when context switches
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, [context.key]);

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

            // Build history: only user/assistant messages, cap at 10 pairs
            const historyMessages = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .slice(-20)
                .map(({ role, content }) => ({ role: role as 'user' | 'assistant', content }));

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const csrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1];

                const response = await fetch(context.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/event-stream',
                        'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
                    },
                    body: JSON.stringify({ message: text.trim(), history: historyMessages }),
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
        [context.endpoint, isLoading, messages],
    );

    const clearMessages = useCallback(() => {
        abortRef.current?.abort();
        setMessages([]);
    }, []);

    return { messages, sendMessage, isLoading, clearMessages };
}
