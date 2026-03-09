import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/hooks/use-chat';

interface Props {
    message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
    if (message.role === 'system') {
        if (message.content === 'session-break') {
            return (
                <div className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] text-muted-foreground">↑ Previous session</span>
                    <div className="h-px flex-1 bg-border" />
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] text-muted-foreground">{message.content}</span>
                <div className="h-px flex-1 bg-border" />
            </div>
        );
    }

    const isUser = message.role === 'user';

    return (
        <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    isUser
                        ? 'rounded-tr-sm bg-indigo-600 text-white'
                        : 'rounded-tl-sm border border-border bg-card text-card-foreground',
                )}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none break-words [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(message.content) }}
                    />
                )}
                {message.streaming && (
                    <span className="ml-1 inline-block h-3 w-1 animate-pulse rounded-sm bg-current opacity-60" />
                )}
            </div>
        </div>
    );
}

/**
 * Minimal markdown → HTML for AI responses.
 * Handles: code blocks, inline code, bold, bullet lists, line breaks.
 * Full CommonMark is overkill for a chat UI.
 */
function markdownToHtml(text: string): string {
    return (
        text
            // Fenced code blocks
            .replace(
                /```(\w*)\n?([\s\S]*?)```/g,
                (_, lang, code: string) =>
                    `<pre><code class="language-${lang || 'text'}">${escHtml(code.trim())}</code></pre>`,
            )
            // Inline code
            .replace(/`([^`]+)`/g, (_, code: string) => `<code>${escHtml(code)}</code>`)
            // Headings (h1–h4, must be at start of line)
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Unordered list items
            .replace(/^[ \t]*[-*] (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
            // Collapse adjacent </ul><ul>
            .replace(/<\/ul>\s*<ul>/g, '')
            // Paragraphs from double newlines
            .replace(/\n{2,}/g, '</p><p>')
            .replace(/^(?!<[a-z])/, '<p>')
            .replace(/(?<![>])$/, '</p>')
            // Single newline → <br> (only outside block elements)
            .replace(/(?<!>)\n(?!<)/g, '<br>')
    );
}

function escHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
