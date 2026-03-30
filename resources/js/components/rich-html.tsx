import { useEffect, useRef } from 'react';

const HTML_TAG_RE = /<[a-z][\s\S]*?>/i;

interface RichHtmlProps {
    content: string;
    className?: string;
    size?: 'sm' | 'base';
    externalLinksNewTab?: boolean;
}

export default function RichHtml({ content, className = '', size = 'sm', externalLinksNewTab = false }: RichHtmlProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!externalLinksNewTab || !ref.current) return;
        const origin = window.location.origin;
        ref.current.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
            try {
                const url = new URL(a.href, window.location.href);
                if (url.origin !== origin) {
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                } else {
                    a.removeAttribute('target');
                    a.removeAttribute('rel');
                }
            } catch {
                // invalid href — leave as-is
            }
        });
    }, [content, externalLinksNewTab]);

    if (HTML_TAG_RE.test(content)) {
        const sizeClass = size === 'base' ? 'prose-base' : 'prose-sm';
        return (
            <div
                ref={ref}
                className={`prose ${sizeClass} dark:prose-invert max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return <p className={`whitespace-pre-line ${className}`}>{content}</p>;
}
