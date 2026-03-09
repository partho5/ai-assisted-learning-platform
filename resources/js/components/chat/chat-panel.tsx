import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useChat, type ChatContext } from '@/hooks/use-chat';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatSuggestions } from '@/components/chat/chat-suggestions';

interface Props {
    context: ChatContext;
    isOpen: boolean;
    onClose: () => void;
}

export function ChatPanel({ context, isOpen, onClose }: Props) {
    const { flash } = usePage().props;
    const { messages, sendMessage, isLoading, isLoadingHistory, hasMore, loadOlderMessages, clearMessages } =
        useChat(context, isOpen);
    const [draft, setDraft] = useState('');
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [showMergeBanner, setShowMergeBanner] = useState(!!flash.chat_merged);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    // Preserve scroll position when prepending older messages
    const scrollHeightBeforeRef = useRef<number>(0);

    // Scroll to bottom on new messages (not when loading older ones)
    useEffect(() => {
        if (isOpen && !isLoadingHistory && scrollHeightBeforeRef.current === 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isOpen, isLoadingHistory]);

    // Restore scroll position after older messages are prepended
    useEffect(() => {
        if (!isLoadingHistory && scrollRef.current && scrollHeightBeforeRef.current > 0) {
            const diff = scrollRef.current.scrollHeight - scrollHeightBeforeRef.current;
            scrollRef.current.scrollTop = diff;
            scrollHeightBeforeRef.current = 0;
        }
    }, [isLoadingHistory]);

    // Focus input when panel opens; reset confirm state when panel closes
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setConfirmingClear(false);
        }
    }, [isOpen]);

    function handleSubmit() {
        if (!draft.trim() || isLoading) {
            return;
        }
        sendMessage(draft.trim());
        setDraft('');
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    function handleLoadOlder() {
        if (scrollRef.current) {
            scrollHeightBeforeRef.current = scrollRef.current.scrollHeight;
        }
        loadOlderMessages();
    }

    async function handleClear() {
        if (!confirmingClear) {
            setConfirmingClear(true);
            return;
        }
        setConfirmingClear(false);
        await clearMessages();
    }

    const nonSystemMessages = messages.filter((m) => m.role !== 'system');
    const showSuggestions = nonSystemMessages.length === 0 && !isLoadingHistory;
    const showEmpty = nonSystemMessages.length === 0 && !isLoadingHistory;

    return (
        <>
            {/* Backdrop — mobile only */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div
                className={cn(
                    'fixed bottom-0 right-0 z-50 flex flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out',
                    'h-[80vh] w-full md:bottom-[88px] md:right-6 md:h-[560px] md:w-[380px] md:rounded-2xl md:border md:border-border',
                    isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-[calc(100%+2rem)]',
                )}
                aria-hidden={!isOpen}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <div>
                            <p className="text-sm font-semibold leading-none">AI Assistant</p>
                            {context.type === 'resource' && context.label && (
                                <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-muted-foreground">
                                    {context.label}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 0 && (
                            confirmingClear ? (
                                <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-muted-foreground">Delete history?</span>
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="rounded-lg px-2 py-1 text-[11px] text-red-500 transition-colors hover:bg-red-500/10"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmingClear(false)}
                                        className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
                                    >
                                        No
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    Clear
                                </button>
                            )
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close chat"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-600 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
                    {/* Guest-merge notice */}
                    {showMergeBanner && (
                        <div className="mb-3 flex items-start gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-[11px] text-indigo-400">
                            <span className="mt-0.5 shrink-0">✓</span>
                            <span className="flex-1">Your previous chat history has been linked to your account.</span>
                            <button
                                type="button"
                                onClick={() => setShowMergeBanner(false)}
                                className="shrink-0 opacity-60 hover:opacity-100"
                                aria-label="Dismiss"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Initial history skeleton */}
                    {isLoadingHistory && messages.length === 0 && (
                        <div className="flex flex-col gap-3">
                            {[80, 60, 90, 50].map((w, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'h-8 animate-pulse rounded-2xl bg-muted',
                                        i % 2 === 0 ? 'self-end' : 'self-start',
                                    )}
                                    style={{ width: `${w}%` }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {showEmpty && (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                            <span className="text-3xl">💬</span>
                            <p className="text-sm font-medium text-foreground">
                                {context.type === 'platform'
                                    ? 'Ask me anything about SkillEvidence'
                                    : context.type === 'course'
                                      ? 'Ask me anything about this course'
                                      : 'Ask me anything about this resource'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {context.type === 'platform'
                                    ? 'How it works, enrollment, tiers, and more.'
                                    : context.type === 'course'
                                      ? "I know what this course covers and who it's for."
                                      : 'I have context about what you\'re studying.'}
                            </p>
                        </div>
                    )}

                    {/* Message list */}
                    {messages.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {/* Load older trigger */}
                            {hasMore && (
                                <div className="flex justify-center py-1">
                                    <button
                                        type="button"
                                        onClick={handleLoadOlder}
                                        disabled={isLoadingHistory}
                                        className="text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                                    >
                                        {isLoadingHistory ? (
                                            <span className="flex items-center gap-1">
                                                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                                                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                                                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                                            </span>
                                        ) : (
                                            '↑ Load earlier messages'
                                        )}
                                    </button>
                                </div>
                            )}

                            {messages.map((m) => (
                                <ChatMessage key={m.id} message={m} />
                            ))}

                            {isLoading && messages[messages.length - 1]?.streaming !== true && (
                                <div className="flex justify-start">
                                    <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5">
                                        <span className="flex gap-1">
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Suggestions (only when no messages yet) */}
                {showSuggestions && (
                    <ChatSuggestions
                        contextType={context.type}
                        resourceType={context.type === 'resource' ? (context as ResourceChatContext).resourceType : undefined}
                        onSelect={(text) => {
                            sendMessage(text);
                        }}
                    />
                )}

                {/* Input */}
                <div className="px-3 pb-3 pt-2">
                    <div className="group rounded-2xl border border-border bg-muted/30 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                        <textarea
                            ref={inputRef}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything…"
                            rows={2}
                            disabled={isLoading}
                            className="block max-h-36 w-full resize-none bg-transparent px-4 pb-1 pt-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                            style={{ fieldSizing: 'content' } as React.CSSProperties}
                        />
                        <div className="flex items-center justify-between px-3 pb-2 pt-1">
                            <p className="text-[12px] text-foreground transition-colors group-focus-within:text-[10px] group-focus-within:text-muted-foreground">
                                Shift+Enter for new line
                            </p>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!draft.trim() || isLoading}
                                aria-label="Send message"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Type helper used inline above
interface ResourceChatContext extends ChatContext {
    type: 'resource';
    resourceType: string;
}
