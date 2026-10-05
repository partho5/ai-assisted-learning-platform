/**
 * Unicode text styling (Mathematical Alphanumerics).
 *
 * Output is plain Unicode, never HTML/CSS, so it survives copy-paste into
 * LinkedIn, X, WhatsApp, Instagram etc. Each style is data in `TEXT_STYLES`;
 * adding a style is a one-entry change here.
 */

export type TextStyleId = 'bold' | 'italic';

export interface TextStyle {
    id: TextStyleId;
    label: string;
    /** A sample glyph rendered in the style, for toolbar buttons. */
    sample: string;
    /** Code point of the styled "A". */
    upperBase: number;
    /** Code point of the styled "a". */
    lowerBase: number;
    /** Code point of the styled "0", when the style has digits. */
    digitBase?: number;
}

export const TEXT_STYLES: Record<TextStyleId, TextStyle> = {
    bold: {
        id: 'bold',
        label: 'Bold',
        sample: '𝗕',
        upperBase: 0x1d5d4,
        lowerBase: 0x1d5ee,
        digitBase: 0x1d7ec,
    },
    italic: {
        id: 'italic',
        label: 'Italic',
        sample: '𝙄',
        upperBase: 0x1d63c,
        lowerBase: 0x1d656,
    },
};

export const TEXT_STYLE_LIST: TextStyle[] = Object.values(TEXT_STYLES);

const CODE_A = 0x41;
const CODE_a = 0x61;
const CODE_0 = 0x30;

function toStyleCodePoint(cp: number, style: TextStyle): number {
    if (cp >= CODE_A && cp < CODE_A + 26) {
        return style.upperBase + (cp - CODE_A);
    }
    if (cp >= CODE_a && cp < CODE_a + 26) {
        return style.lowerBase + (cp - CODE_a);
    }
    if (style.digitBase !== undefined && cp >= CODE_0 && cp < CODE_0 + 10) {
        return style.digitBase + (cp - CODE_0);
    }
    return cp;
}

function toAsciiCodePoint(cp: number): number {
    for (const style of TEXT_STYLE_LIST) {
        if (cp >= style.upperBase && cp < style.upperBase + 26) {
            return CODE_A + (cp - style.upperBase);
        }
        if (cp >= style.lowerBase && cp < style.lowerBase + 26) {
            return CODE_a + (cp - style.lowerBase);
        }
        if (
            style.digitBase !== undefined &&
            cp >= style.digitBase &&
            cp < style.digitBase + 10
        ) {
            return CODE_0 + (cp - style.digitBase);
        }
    }
    return cp;
}

function toAsciiCodePointForStyle(cp: number, style: TextStyle): number {
    if (cp >= style.upperBase && cp < style.upperBase + 26) {
        return CODE_A + (cp - style.upperBase);
    }
    if (cp >= style.lowerBase && cp < style.lowerBase + 26) {
        return CODE_a + (cp - style.lowerBase);
    }
    if (
        style.digitBase !== undefined &&
        cp >= style.digitBase &&
        cp < style.digitBase + 10
    ) {
        return CODE_0 + (cp - style.digitBase);
    }
    return cp;
}

function mapCodePoints(text: string, map: (cp: number) => number): string {
    return Array.from(text, (char) =>
        String.fromCodePoint(map(char.codePointAt(0) as number)),
    ).join('');
}

/** Convert any styled character back to plain ASCII; everything else is untouched. */
export function normalize(text: string): string {
    return mapCodePoints(text, toAsciiCodePoint);
}

/** Style plain text. Already-styled input is normalised first so styles never stack. */
export function toStyle(text: string, style: TextStyleId): string {
    const target = TEXT_STYLES[style];
    return mapCodePoints(normalize(text), (cp) => toStyleCodePoint(cp, target));
}

/** Remove one style only, leaving other styled characters (e.g. italic inside bold) intact. */
export function removeStyle(text: string, style: TextStyleId): string {
    const target = TEXT_STYLES[style];
    return mapCodePoints(text, (cp) => toAsciiCodePointForStyle(cp, target));
}

/**
 * True when `text` contains at least one character in `style` and nothing the
 * style could still convert (e.g. plain letters). Characters the style cannot
 * represent, such as spaces, punctuation or italic digits, are ignored.
 */
export function isFullyStyled(text: string, style: TextStyleId): boolean {
    const target = TEXT_STYLES[style];
    let hasStyled = false;

    for (const char of text) {
        const cp = char.codePointAt(0) as number;

        if (toAsciiCodePointForStyle(cp, target) !== cp) {
            hasStyled = true;
        } else if (toStyleCodePoint(cp, target) !== cp) {
            return false;
        }
    }

    return hasStyled;
}

export interface SelectionResult {
    value: string;
    /** Start of the converted range (UTF-16 offset). */
    selectionStart: number;
    /** End of the converted range (UTF-16 offset), in the new value. */
    selectionEnd: number;
    /** The styled text that replaced the range. */
    replacement: string;
    /** End of the replaced range in the original value, after boundary nudging. */
    replacedEnd: number;
}

function isLowSurrogate(code: number): boolean {
    return code >= 0xdc00 && code <= 0xdfff;
}

function isHighSurrogate(code: number): boolean {
    return code >= 0xd800 && code <= 0xdbff;
}

/**
 * Style only the `[start, end)` range of `value`, or remove the style when the
 * range is already fully in it (toggle, like a word processor). Offsets are
 * UTF-16 indices (as in `selectionStart`/`selectionEnd`); a boundary that would
 * split a surrogate pair is nudged outward so no character is cut in half.
 */
export function applyToSelection(
    value: string,
    start: number,
    end: number,
    style: TextStyleId,
): SelectionResult {
    let from = Math.max(0, Math.min(start, end, value.length));
    let to = Math.min(value.length, Math.max(start, end, 0));

    if (
        from > 0 &&
        isLowSurrogate(value.charCodeAt(from)) &&
        isHighSurrogate(value.charCodeAt(from - 1))
    ) {
        from -= 1;
    }
    if (
        to < value.length &&
        isLowSurrogate(value.charCodeAt(to)) &&
        isHighSurrogate(value.charCodeAt(to - 1))
    ) {
        to += 1;
    }

    const selected = value.slice(from, to);
    const replacement = isFullyStyled(selected, style)
        ? removeStyle(selected, style)
        : toStyle(selected, style);

    return {
        value: value.slice(0, from) + replacement + value.slice(to),
        selectionStart: from,
        selectionEnd: from + replacement.length,
        replacement,
        replacedEnd: to,
    };
}
