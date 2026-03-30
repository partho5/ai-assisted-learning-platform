import { useCallback, useRef } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Callout } from '@/extensions/callout-extension';
import { SectionBlock as SectionBlockExt } from '@/extensions/section-block-extension';

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
    onClick,
    active = false,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                active
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
            }`}
        >
            {children}
        </button>
    );
}

function Sep() {
    return <div className="mx-1 h-5 w-0.5 rounded-full bg-black/40 dark:bg-white/40" />;
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const TEXT_COLORS = ['#000000', '#ef4444', '#f97316', '#f59e0b', '#ffffff', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280'];
const HIGHLIGHT_COLORS = ['#ffff00', '#ff0000', '#00ff00', '#00ffff', '#ff8c00', '#ff69b4'];
const CALLOUT_ACCENT_COLORS: Record<string, string> = { purple: '#7F77DD', amber: '#EF9F27', teal: '#1D9E75', green: '#639922' };
const SECTION_VARIANTS: Record<string, { label: string; bg: string; border: string }> = {
    'hero-dark': { label: 'Dark', bg: '#093464', border: '#0d4080' },
    'hero-light': { label: 'Blue', bg: '#1709ed', border: '#1207c4' },
    accent: { label: 'Accent', bg: '#eff6ff', border: '#3b82f6' },
    bordered: { label: 'Bordered', bg: '#fff7ed', border: '#f97316' },
};

function Toolbar({ editor }: { editor: Editor }) {
    const colorRef = useRef<HTMLInputElement>(null);
    const highlightRef = useRef<HTMLInputElement>(null);

    const s = useEditorState({
        editor,
        selector: (ctx) => ({
            isBold: ctx.editor.isActive('bold'),
            isItalic: ctx.editor.isActive('italic'),
            isUnderline: ctx.editor.isActive('underline'),
            isStrike: ctx.editor.isActive('strike'),
            isLink: ctx.editor.isActive('link'),
            isCodeBlock: ctx.editor.isActive('codeBlock'),
            isBulletList: ctx.editor.isActive('bulletList'),
            isOrderedList: ctx.editor.isActive('orderedList'),
            isHighlight: ctx.editor.isActive('highlight'),
            isTable: ctx.editor.isActive('table'),
            headingLevel: ctx.editor.isActive('heading', { level: 1 }) ? '1'
                : ctx.editor.isActive('heading', { level: 2 }) ? '2'
                : ctx.editor.isActive('heading', { level: 3 }) ? '3'
                : '',
            currentColor: ctx.editor.getAttributes('textStyle').color as string | undefined,
            currentHighlight: ctx.editor.getAttributes('highlight').color as string | undefined,
        }),
    });

    const setLink = useCallback(() => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('URL', prev ?? '');
        if (url === null) { return; }
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    }, [editor]);

    const addImage = useCallback(() => {
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    return (
        <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border-b border-border bg-muted/50 px-2 py-1.5">
            {/* Heading */}
            <select
                className="h-6 cursor-pointer rounded border-0 bg-transparent text-xs focus:outline-none"
                value={s.headingLevel}
                onChange={(e) => {
                    const level = Number(e.target.value);
                    if (!level) {
                        editor.chain().focus().setParagraph().run();
                    } else {
                        editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
                    }
                }}
            >
                <option value="">Paragraph</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
            </select>

            <Sep />

            {/* Font size */}
            <select
                className="h-6 cursor-pointer rounded border-0 bg-transparent text-xs focus:outline-none"
                defaultValue=""
                onChange={(e) => {
                    const size = e.target.value;
                    if (size) {
                        (editor.chain().focus() as any).setFontSize(size).run();
                    } else {
                        (editor.chain().focus() as any).unsetFontSize().run();
                    }
                }}
            >
                <option value="">Size</option>
                {FONT_SIZES.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
            </select>

            <Sep />

            {/* Basic formatting */}
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={s.isBold} title="Bold"><b>B</b></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={s.isItalic} title="Italic"><i>I</i></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={s.isUnderline} title="Underline"><u>U</u></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={s.isStrike} title="Strikethrough"><s>S</s></ToolbarBtn>

            <Sep />

            {/* Text color */}
            <input
                ref={colorRef}
                type="color"
                className="sr-only"
                defaultValue="#000000"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
            <ToolbarBtn onClick={() => colorRef.current?.click()} active={!!s.currentColor} title="Text color">
                <span className="flex flex-col items-center leading-none">
                    <span className="font-bold text-sm">A</span>
                    <span className="block h-0.5 w-3 rounded" style={{ backgroundColor: s.currentColor ?? '#000' }} />
                </span>
            </ToolbarBtn>
            <div className="flex items-center gap-0.5">
                {TEXT_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); }}
                        title={c}
                        className="h-4 w-4 rounded border border-border shadow-sm"
                        style={{ backgroundColor: c }}
                    />
                ))}
                <ToolbarBtn onClick={() => editor.chain().focus().unsetColor().run()} title="Remove color">✕</ToolbarBtn>
            </div>

            <Sep />

            {/* Highlight */}
            <input
                ref={highlightRef}
                type="color"
                className="sr-only"
                defaultValue="#fef08a"
                onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
            />
            <ToolbarBtn onClick={() => highlightRef.current?.click()} active={s.isHighlight} title="Highlight">
                <span className="flex flex-col items-center leading-none">
                    <span className="text-sm">H</span>
                    <span className="block h-0.5 w-3 rounded" style={{ backgroundColor: s.currentHighlight ?? '#fef08a' }} />
                </span>
            </ToolbarBtn>
            <div className="flex items-center gap-0.5">
                {HIGHLIGHT_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHighlight({ color: c }).run(); }}
                        title={c}
                        className="h-4 w-4 rounded border border-border shadow-sm"
                        style={{ backgroundColor: c }}
                    />
                ))}
                <ToolbarBtn onClick={() => editor.chain().focus().unsetHighlight().run()} title="Remove highlight">✕</ToolbarBtn>
            </div>

            <Sep />

            {/* Lists */}
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={s.isBulletList} title="Bullet list">≡</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={s.isOrderedList} title="Ordered list">#≡</ToolbarBtn>

            <Sep />

            {/* Link, image & code */}
            <ToolbarBtn onClick={setLink} active={s.isLink} title="Link">🔗</ToolbarBtn>
            <ToolbarBtn onClick={addImage} title="Insert image">🖼</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={s.isCodeBlock} title="Code block">{`</>`}</ToolbarBtn>

            <Sep />

            {/* Table */}
            <ToolbarBtn
                onClick={() => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                active={s.isTable}
                title="Insert table"
            >
                ⊞
            </ToolbarBtn>
            {s.isTable && (
                <>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).addColumnAfter().run()} title="Add column">+C</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).deleteColumn().run()} title="Delete column">−C</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).addRowAfter().run()} title="Add row">+R</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).deleteRow().run()} title="Delete row">−R</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).deleteTable().run()} title="Delete table">✕T</ToolbarBtn>
                </>
            )}

            <Sep />

            {/* Callout */}
            <div className="flex items-center gap-0.5">
                {Object.entries(CALLOUT_ACCENT_COLORS).map(([v, color]) => (
                    <button
                        key={v}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertCallout(v as any).run(); }}
                        title={`Insert ${v} callout`}
                        className="h-4 w-4 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            <Sep />

            {/* Section block */}
            <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground mr-0.5">Section:</span>
                {Object.entries(SECTION_VARIANTS).map(([v, { label, bg, border }]) => (
                    <button
                        key={v}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertSection(v as any).run(); }}
                        title={`Insert ${label} section`}
                        className="h-4 w-4 rounded border shadow-sm"
                        style={{ backgroundColor: bg, borderColor: border }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    disabled?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
}

export default function RichTextEditor({ value, onChange, disabled = false, placeholder, autoFocus = false }: RichTextEditorProps) {
    const editor = useEditor({
        autofocus: autoFocus ? 'end' : false,
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            FontSize,
            Color,
            Highlight.configure({ multicolor: true }),
            Link.configure({ openOnClick: false }),
            Image.configure({ inline: false, allowBase64: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Callout,
            SectionBlockExt,
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) { return null; }

    return (
        <div className={`tiptap-editor rounded-md border border-input bg-card text-sm ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <Toolbar editor={editor} />
            <div className="min-h-48 max-h-[60vh] overflow-y-auto rounded-b-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                <EditorContent
                    editor={editor}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}
