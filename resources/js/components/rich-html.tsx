const HTML_TAG_RE = /<[a-z][\s\S]*?>/i;

interface RichHtmlProps {
    content: string;
    className?: string;
}

export default function RichHtml({ content, className = '' }: RichHtmlProps) {
    if (HTML_TAG_RE.test(content)) {
        return (
            <div
                className={`prose prose-sm dark:prose-invert rich-html max-w-none ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return <p className={`whitespace-pre-line ${className}`}>{content}</p>;
}
