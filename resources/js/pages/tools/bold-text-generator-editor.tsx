import { Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { CopyButton } from '@/components/tools/copy-button';
import { Button } from '@/components/ui/button';
import ToolsLayout from '@/layouts/tools-layout';
import {
    applyToSelection,
    TEXT_STYLE_LIST,
    toStyle,
    type TextStyleId,
} from '@/lib/unicode-text';

interface Meta {
    title: string;
    description: string;
    image?: string;
    url: string;
}

const FAQ: { question: string; answer: string }[] = [
    {
        question: 'Is this real bold text?',
        answer: 'It is made of special Unicode characters that look bold, not formatting. That is why it can be pasted into sites that do not support rich text, such as LinkedIn, X and Instagram.',
    },
    {
        question: 'Does it work for every language?',
        answer: 'No. Only Latin letters (A–Z, a–z) and, for bold, digits (0–9) can be converted. Other characters, including Bengali, are left unchanged.',
    },
    {
        question: 'Why is there no italic for numbers?',
        answer: 'Unicode has no italic digits in this character set, so numbers stay as they are when you apply Italic.',
    },
    {
        question: 'Are there any downsides?',
        answer: 'Some platforms, fonts and screen readers display or read these characters poorly, and the text is not searchable as normal words. Use it sparingly for emphasis, not for whole posts.',
    },
    {
        question: 'Is my text sent anywhere?',
        answer: 'No. The conversion happens entirely in your browser.',
    },
];

const PLATFORMS = [
    'LinkedIn posts, headlines and About sections',
    'X (Twitter) posts and bios',
    'Instagram captions and bios',
    'WhatsApp and Telegram messages',
    'Discord and Slack messages',
    'Facebook posts and profile intros',
];

const textareaClass =
    'w-full rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40';

function FullTextConverter() {
    const [input, setInput] = useState('');
    const outputRef = useRef<HTMLTextAreaElement>(null);
    const output = toStyle(input, 'bold');

    return (
        <section aria-labelledby="converter-heading" className="space-y-4">
            <div>
                <h2
                    id="converter-heading"
                    className="text-xl font-semibold tracking-tight"
                >
                    Convert text to bold
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Type or paste below. The bold version appears instantly.
                </p>
            </div>

            <div className="space-y-2">
                <label htmlFor="bold-input" className="text-sm font-medium">
                    Your text
                </label>
                <textarea
                    id="bold-input"
                    rows={4}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your text here…"
                    className={textareaClass}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="bold-output" className="text-sm font-medium">
                    Bold result
                </label>
                <textarea
                    id="bold-output"
                    ref={outputRef}
                    rows={4}
                    readOnly
                    value={output}
                    placeholder="𝗬𝗼𝘂𝗿 𝗯𝗼𝗹𝗱 𝘁𝗲𝘅𝘁 𝘄𝗶𝗹𝗹 𝗮𝗽𝗽𝗲𝗮𝗿 𝗵𝗲𝗿𝗲…"
                    className={`${textareaClass} bg-muted/40`}
                />
            </div>

            <div className="flex flex-wrap gap-3">
                <Button
                    type="button"
                    variant="enroll"
                    size="compact"
                    disabled={output === ''}
                    onClick={() => outputRef.current?.select()}
                >
                    Convert
                </Button>
                <CopyButton text={output} disabled={output === ''} />
            </div>
        </section>
    );
}

function MixedStyleEditor() {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState('');
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const hasSelection = selection.start !== selection.end;

    const syncSelection = () => {
        const el = textareaRef.current;
        if (el) {
            setSelection({ start: el.selectionStart, end: el.selectionEnd });
        }
    };

    const applyStyle = (style: TextStyleId) => {
        const el = textareaRef.current;
        if (!el || el.selectionStart === el.selectionEnd) {
            return;
        }

        const result = applyToSelection(
            el.value,
            el.selectionStart,
            el.selectionEnd,
            style,
        );

        el.focus();
        el.setSelectionRange(result.selectionStart, result.replacedEnd);

        const inserted = document.execCommand(
            'insertText',
            false,
            result.replacement,
        );

        if (!inserted) {
            setValue(result.value);
        }

        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(result.selectionStart, result.selectionEnd);
            setSelection({
                start: result.selectionStart,
                end: result.selectionEnd,
            });
        });
    };

    return (
        <section aria-labelledby="editor-heading" className="space-y-4">
            <div>
                <h2
                    id="editor-heading"
                    className="text-xl font-semibold tracking-tight"
                >
                    Style only part of your text
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Write your passage, highlight a word or phrase, then choose
                    a style. Only the highlighted part changes.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
                <div
                    className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2"
                    role="toolbar"
                    aria-label="Text style"
                >
                    {TEXT_STYLE_LIST.map((style) => (
                        <Button
                            key={style.id}
                            type="button"
                            variant="utility"
                            size="compact"
                            disabled={!hasSelection}
                            aria-label={`${style.label} selected text`}
                            title={`${style.label} selected text`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyStyle(style.id)}
                        >
                            <span aria-hidden="true" className="text-base">
                                {style.sample}
                            </span>
                            {style.label}
                        </Button>
                    ))}
                    <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
                        {hasSelection
                            ? 'Choose a style'
                            : 'Select some text first'}
                    </span>
                </div>

                <textarea
                    ref={textareaRef}
                    aria-label="Passage to style"
                    rows={7}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        syncSelection();
                    }}
                    onSelect={syncSelection}
                    onBlur={syncSelection}
                    placeholder="I am a AI Expert, build RAG applications like chatbot"
                    className="block w-full resize-y bg-transparent px-4 py-3 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                />
            </div>

            <div className="flex flex-wrap gap-3">
                <CopyButton
                    text={value}
                    label="Copy Passage"
                    copiedLabel="Copied"
                    disabled={value === ''}
                />
            </div>
        </section>
    );
}

function SeoContent() {
    return (
        <div className="space-y-10 border-t border-border pt-10">
            <section aria-labelledby="how-heading" className="space-y-3">
                <h2
                    id="how-heading"
                    className="text-xl font-semibold tracking-tight"
                >
                    How it works
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                    Most social platforms do not let you format text. This tool
                    swaps ordinary letters for look-alike characters from the
                    Unicode &ldquo;Mathematical Alphanumeric Symbols&rdquo;
                    block, which already contain bold and italic forms. Because
                    the result is plain text, it keeps its style when you copy
                    and paste it almost anywhere.
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                    <li>Type or paste your text.</li>
                    <li>
                        Use the converter for the whole text, or highlight part
                        of it in the editor and click Bold or Italic.
                    </li>
                    <li>Copy the result and paste it where you need it.</li>
                </ol>
            </section>

            <section aria-labelledby="where-heading" className="space-y-3">
                <h2
                    id="where-heading"
                    className="text-xl font-semibold tracking-tight"
                >
                    Where to use bold text
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {PLATFORMS.map((platform) => (
                        <li key={platform}>{platform}</li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="faq-heading" className="space-y-4">
                <h2
                    id="faq-heading"
                    className="text-xl font-semibold tracking-tight"
                >
                    Frequently asked questions
                </h2>
                <dl className="space-y-4">
                    {FAQ.map((item) => (
                        <div key={item.question}>
                            <dt className="font-medium">{item.question}</dt>
                            <dd className="mt-1 leading-relaxed text-muted-foreground">
                                {item.answer}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>
        </div>
    );
}

export default function BoldTextGeneratorEditor({ meta }: { meta: Meta }) {
    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };

    return (
        <ToolsLayout>
            <Head title={meta.title}>
                <meta name="description" content={meta.description} />
                <link rel="canonical" href={meta.url} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={meta.title} />
                <meta property="og:description" content={meta.description} />
                <meta property="og:url" content={meta.url} />
                {meta.image && (
                    <meta property="og:image" content={meta.image} />
                )}
                <script type="application/ld+json">
                    {JSON.stringify(faqJsonLd)}
                </script>
            </Head>

            <div className="space-y-12">
                <header className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        Bold Text Generator &amp; Editor
                    </h1>
                    <p className="max-w-2xl text-lg text-muted-foreground">
                        Make text 𝗯𝗼𝗹𝗱 or 𝙞𝙩𝙖𝙡𝙞𝙘 for LinkedIn, X, Instagram and
                        WhatsApp. Style the whole text, or just the words you
                        pick.
                    </p>
                </header>

                <MixedStyleEditor />
                <FullTextConverter />
                <SeoContent />
            </div>
        </ToolsLayout>
    );
}
