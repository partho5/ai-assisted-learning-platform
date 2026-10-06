/**
 * Turns pasted rich text or markdown into plain Unicode-styled text.
 *
 * Two sources are understood, detected internally (the user never picks one):
 * the `text/html` clipboard flavour (Word, Google Docs, web pages, AI chat UIs
 * all copy bold/italic/lists as HTML even when the visible text has no markers)
 * and markdown in `text/plain`. Bold + italic collapses to italic, headings
 * become bold, top-level bullets use • (nested items use →) and numbered items keep their
 * numbers.
 */

import { toStyle } from '@/lib/unicode-text';

const BULLET = '•';
const ARROW = '→';
const INDENT = '   ';

const BULLET_LINE = /^(\s*)[-*+•·●○▪◦‣]\s+(.*)$/;
const NUMBERED_LINE = /^(\s*)(\d+[.)])\s+(.*)$/;
const HEADING_LINE = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;
const FENCE_LINE = /^\s*(```|~~~)/;
const PROTECTED_SPAN =
    /(`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+)/;
const LINK_SPAN = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/;
const EMPHASIS =
    /(\*\*\*|\*\*|\*)(?=\S)([^\n]*?\S)\1|(?<![A-Za-z0-9_])(___|__|_)(?=\S)([^\n]*?\S)\3(?![A-Za-z0-9_])/;

interface InlineStyle {
    bold: boolean;
    italic: boolean;
    heading: boolean;
}

function styleText(text: string, style: InlineStyle): string {
    if (style.heading) {
        return toStyle(text, 'bold');
    }
    if (style.italic) {
        return toStyle(text, 'italic');
    }
    if (style.bold) {
        return toStyle(text, 'bold');
    }
    return text;
}

function indentFor(level: number): string {
    return INDENT.repeat(Math.max(0, level));
}

function renderEmphasis(text: string, style: InlineStyle): string {
    let output = '';
    let rest = text;

    for (;;) {
        const match = EMPHASIS.exec(rest);
        if (!match) {
            return output + styleText(rest, style);
        }

        const marker = match[1] ?? match[3];
        const inner = match[2] ?? match[4];

        output += styleText(rest.slice(0, match.index), style);
        output += renderEmphasis(inner, {
            ...style,
            bold: style.bold || marker.length >= 2,
            italic: style.italic || marker.length !== 2,
        });
        rest = rest.slice(match.index + match[0].length);
    }
}

function renderInlineMarkdown(text: string, style: InlineStyle): string {
    return text
        .split(PROTECTED_SPAN)
        .map((part, index) => {
            if (index % 2 === 0) {
                return renderEmphasis(part, style);
            }
            if (part.startsWith('`')) {
                return part.slice(1, -1);
            }
            const link = LINK_SPAN.exec(part);
            if (link) {
                return `${renderEmphasis(link[1], style)} (${link[2]})`;
            }
            return part;
        })
        .join('');
}

export function convertMarkdown(text: string): string {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const indentStack: number[] = [];
    let inFence = false;

    const plain: InlineStyle = { bold: false, italic: false, heading: false };

    const levelFor = (indent: number): number => {
        while (
            indentStack.length > 0 &&
            indent < indentStack[indentStack.length - 1]
        ) {
            indentStack.pop();
        }
        if (
            indentStack.length === 0 ||
            indent > indentStack[indentStack.length - 1]
        ) {
            indentStack.push(indent);
        }
        return indentStack.length - 1;
    };

    const indentWidth = (whitespace: string): number =>
        whitespace.replace(/\t/g, '    ').length;

    return lines
        .map((line) => {
            if (FENCE_LINE.test(line)) {
                inFence = !inFence;
                return null;
            }
            if (inFence) {
                return line;
            }

            const heading = HEADING_LINE.exec(line);
            if (heading) {
                indentStack.length = 0;
                return renderInlineMarkdown(heading[1], {
                    ...plain,
                    heading: true,
                });
            }

            const bullet = BULLET_LINE.exec(line);
            if (bullet) {
                const level = levelFor(indentWidth(bullet[1]));
                return `${indentFor(level)}${level === 0 ? BULLET : ARROW} ${renderInlineMarkdown(bullet[2], plain)}`;
            }

            const numbered = NUMBERED_LINE.exec(line);
            if (numbered) {
                const level = levelFor(indentWidth(numbered[1]));
                const marker = numbered[2];
                return `${indentFor(level)}${marker} ${renderInlineMarkdown(numbered[3], plain)}`;
            }

            if (line.trim() !== '') {
                indentStack.length = 0;
            }

            return renderInlineMarkdown(
                line.replace(/^\s{0,3}>\s?/, ''),
                plain,
            );
        })
        .filter((line): line is string => line !== null)
        .join('\n');
}

const SKIPPED_TAGS = new Set(['STYLE', 'SCRIPT', 'HEAD', 'TITLE', 'META']);
const BLOCK_TAGS = new Set([
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'DD',
    'DIV',
    'DL',
    'DT',
    'FIGURE',
    'FOOTER',
    'HEADER',
    'HR',
    'PRE',
    'SECTION',
    'TABLE',
    'TR',
]);
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const ORDERED_MARKER = /^\s*(\d+|[a-zA-Z]|[ivxIVX]+)[.)]/;

function readCssProperty(el: Element, property: string): string | null {
    const style = el.getAttribute('style');
    if (!style) {
        return null;
    }
    const match = new RegExp(
        `(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`,
        'i',
    ).exec(style);
    return match ? match[1].trim().toLowerCase() : null;
}

function isBoldWeight(weight: string): boolean {
    if (weight === 'bold' || weight === 'bolder') {
        return true;
    }
    const numeric = Number.parseInt(weight, 10);
    return !Number.isNaN(numeric) && numeric >= 600;
}

function resolveBold(el: Element, inherited: boolean): boolean {
    const weight = readCssProperty(el, 'font-weight');
    if (weight !== null) {
        return isBoldWeight(weight);
    }
    return ['B', 'STRONG'].includes(el.tagName) ? true : inherited;
}

function resolveItalic(el: Element, inherited: boolean): boolean {
    const fontStyle = readCssProperty(el, 'font-style');
    if (fontStyle !== null) {
        return fontStyle === 'italic' || fontStyle === 'oblique';
    }
    return ['I', 'EM', 'CITE'].includes(el.tagName) ? true : inherited;
}

interface ListState {
    ordered: boolean;
    count: number;
}

interface WalkState extends InlineStyle {
    lists: ListState[];
    insideListItem: boolean;
}

class HtmlLineBuilder {
    readonly lines: string[] = [];
    formatted = false;
    private line = '';
    private pendingPrefix: string | null = null;

    get currentLength(): number {
        return this.line.length;
    }

    get currentLine(): string {
        return this.line;
    }

    appendText(text: string): void {
        if (text === '') {
            return;
        }
        if (this.pendingPrefix !== null && text.trim() !== '') {
            this.line = this.pendingPrefix + this.line + text.replace(/^ /, '');
            this.pendingPrefix = null;
            return;
        }
        if (this.line === '' && this.pendingPrefix === null) {
            this.line = text.replace(/^ /, '');
            return;
        }
        this.line += text;
    }

    startItem(prefix: string): void {
        this.flush();
        this.pendingPrefix = prefix;
        this.formatted = true;
    }

    flush(): void {
        if (this.line.trim() !== '') {
            this.lines.push(this.line.replace(/ +$/, ''));
        }
        this.line = '';
    }

    blank(): void {
        this.flush();
        this.lines.push('');
    }

    forceBreak(): void {
        this.lines.push(this.line.replace(/ +$/, ''));
        this.line = '';
    }

    result(): string {
        this.flush();
        const collapsed: string[] = [];
        for (const line of this.lines) {
            if (line === '' && collapsed[collapsed.length - 1] === '') {
                continue;
            }
            collapsed.push(line);
        }
        while (collapsed[0] === '') {
            collapsed.shift();
        }
        while (collapsed[collapsed.length - 1] === '') {
            collapsed.pop();
        }
        return collapsed.join('\n');
    }
}

function wordListLevel(el: Element): number | null {
    const mso = readCssProperty(el, 'mso-list');
    if (mso === null) {
        return null;
    }
    const level = /level(\d+)/.exec(mso);
    return level ? Number.parseInt(level[1], 10) - 1 : 0;
}

function walk(node: Node, state: WalkState, out: HtmlLineBuilder): void {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent ?? '').replace(/[\s\u00a0]+/g, ' ');
        if (text !== '' && text !== ' ') {
            if (state.heading || state.bold || state.italic) {
                out.formatted = true;
            }
        }
        out.appendText(styleText(text, state));
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    const el = node as Element;
    const tag = el.tagName.toUpperCase();

    if (SKIPPED_TAGS.has(tag)) {
        return;
    }
    if (readCssProperty(el, 'mso-list') === 'ignore') {
        return;
    }
    if (tag === 'BR') {
        out.forceBreak();
        return;
    }

    const next: WalkState = {
        ...state,
        bold: resolveBold(el, state.bold),
        italic: resolveItalic(el, state.italic),
    };

    const walkChildren = (childState: WalkState) => {
        el.childNodes.forEach((child) => walk(child, childState, out));
    };

    if (tag === 'UL' || tag === 'OL') {
        out.flush();
        const start = Number.parseInt(el.getAttribute('start') ?? '1', 10);
        const list: ListState = {
            ordered: tag === 'OL',
            count: Number.isNaN(start) ? 0 : start - 1,
        };
        walkChildren({ ...next, lists: [...state.lists, list] });
        out.flush();
        return;
    }

    if (tag === 'LI') {
        const list = state.lists[state.lists.length - 1] ?? {
            ordered: false,
            count: 0,
        };
        list.count += 1;
        const ariaLevel = Number.parseInt(
            el.getAttribute('aria-level') ?? '',
            10,
        );
        const level = Number.isNaN(ariaLevel)
            ? Math.max(0, state.lists.length - 1)
            : ariaLevel - 1;
        const marker = list.ordered
            ? `${list.count}.`
            : level > 0
              ? ARROW
              : BULLET;
        out.startItem(`${indentFor(level)}${marker} `);
        walkChildren({ ...next, insideListItem: true });
        out.flush();
        return;
    }

    const msoLevel = tag === 'P' ? wordListLevel(el) : null;
    if (msoLevel !== null) {
        const markerEl = el.querySelector('span[style*="mso-list"]');
        const markerText = (markerEl?.textContent ?? '')
            .replace(/[\s\u00a0]+/g, ' ')
            .trim();
        const ordered = ORDERED_MARKER.test(markerText);
        const marker = ordered ? markerText : msoLevel > 0 ? ARROW : BULLET;
        out.startItem(`${indentFor(msoLevel)}${marker} `);
        walkChildren({ ...next, insideListItem: true });
        out.flush();
        return;
    }

    if (HEADING_TAGS.has(tag)) {
        out.flush();
        out.formatted = true;
        walkChildren({ ...next, heading: true });
        out.blank();
        return;
    }

    if (tag === 'P') {
        out.flush();
        walkChildren(next);
        out.flush();
        if (!state.insideListItem) {
            out.blank();
        }
        return;
    }

    if (BLOCK_TAGS.has(tag)) {
        out.flush();
        walkChildren(next);
        out.flush();
        return;
    }

    if (tag === 'A') {
        const before = out.currentLine;
        walkChildren(next);
        const href = el.getAttribute('href') ?? '';
        const added = out.currentLine.slice(before.length);
        if (/^https?:\/\//i.test(href) && !added.includes(href)) {
            out.appendText(` (${href})`);
        }
        return;
    }

    walkChildren(next);
}

export function convertHtml(html: string): {
    text: string;
    formatted: boolean;
} {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = new HtmlLineBuilder();

    walk(
        doc.body,
        {
            bold: false,
            italic: false,
            heading: false,
            lists: [],
            insideListItem: false,
        },
        out,
    );

    return { text: out.result(), formatted: out.formatted };
}

/**
 * Convert clipboard content to Unicode-styled plain text. Returns `null` when
 * there is nothing to convert, so the caller can let the browser paste as usual.
 */
export function convertPastedContent(
    html: string,
    text: string,
): string | null {
    let converted: string | null = null;

    if (html.trim() !== '') {
        const fromHtml = convertHtml(html);
        if (fromHtml.formatted && fromHtml.text !== '') {
            converted = fromHtml.text;
        }
    }

    if (converted === null) {
        const fromMarkdown = convertMarkdown(text);
        converted = fromMarkdown;
    }

    return converted === text.replace(/\r\n?/g, '\n') ? null : converted;
}
