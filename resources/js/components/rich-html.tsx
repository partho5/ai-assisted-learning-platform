import { useEffect, useRef } from 'react';

const HTML_TAG_RE = /<[a-z][\s\S]*?>/i;

interface RichHtmlProps {
    content: string;
    className?: string;
    size?: 'sm' | 'base';
    externalLinksNewTab?: boolean;
}

type Segment = { type: 'html'; content: string } | { type: 'ul' | 'ol'; items: string[] };

function parseSegments(html: string): Segment[] {
    if (typeof document === 'undefined') {
        return [{ type: 'html', content: html }];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstChild as HTMLElement;
    if (!container) {
        return [{ type: 'html', content: html }];
    }

    const segments: Segment[] = [];
    let htmlBuffer = '';

    for (const child of container.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            if (el.tagName === 'UL' || el.tagName === 'OL') {
                if (htmlBuffer) {
                    segments.push({ type: 'html', content: htmlBuffer });
                    htmlBuffer = '';
                }
                const items = [...el.querySelectorAll(':scope > li')].map((li) => li.innerHTML);
                segments.push({ type: el.tagName.toLowerCase() as 'ul' | 'ol', items });
            } else {
                htmlBuffer += el.outerHTML;
            }
        } else if (child.nodeType === Node.TEXT_NODE && child.textContent) {
            htmlBuffer += child.textContent;
        }
    }

    if (htmlBuffer) {
        segments.push({ type: 'html', content: htmlBuffer });
    }

    return segments;
}

function AnimatedList({ items, type }: { items: string[]; type: 'ul' | 'ol' }) {
    const stagger = type === 'ul' ? 70 : 60;

    const rows = items.map((html, i) => (
        <li key={i}>
            <div className={type === 'ul' ? 'rich-ul-item' : 'rich-ol-item'} style={{ animationDelay: `${i * stagger}ms` }}>
                {type === 'ul' ? (
                    <span className="rich-ul-dot">
                        <span className="rich-ul-dot-core" />
                        <span className="rich-ul-ring" />
                        <span className="rich-ul-ring ring-2" />
                    </span>
                ) : (
                    <span className="rich-ol-badge">{i + 1}</span>
                )}
                <span className={type === 'ul' ? 'rich-ul-text' : 'rich-ol-text'} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
        </li>
    ));

    return type === 'ul' ? <ul data-enhanced>{rows}</ul> : <ol data-enhanced>{rows}</ol>;
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

    if (!HTML_TAG_RE.test(content)) {
        return <p className={`whitespace-pre-line ${className}`}>{content}</p>;
    }

    const sizeClass = size === 'base' ? 'prose-base' : 'prose-sm';
    const segments = parseSegments(content);

    if (segments.length === 1 && segments[0].type === 'html') {
        return (
            <div
                ref={ref}
                className={`prose ${sizeClass} dark:prose-invert max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return (
        <div ref={ref} className={`prose ${sizeClass} dark:prose-invert max-w-none ${className}`}>
            {segments.map((seg, i) => {
                if (seg.type === 'html') {
                    return <div key={i} dangerouslySetInnerHTML={{ __html: seg.content }} />;
                }
                return <AnimatedList key={i} items={seg.items} type={seg.type} />;
            })}
        </div>
    );
}
