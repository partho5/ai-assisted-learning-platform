import { useCallback, useRef } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
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
    return <div className="mx-0.5 h-4 w-px bg-border" />;
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const TEXT_COLORS = ['#000000', '#ff0000', '#cc5500', '#aa8800', '#008800', '#003399', '#6600cc', '#cc0066', '#006666', '#555555'];
const HIGHLIGHT_COLORS = ['#ffff00', '#ff0000', '#00ff00', '#00ffff', '#ff8c00', '#ff69b4'];
const CALLOUT_ACCENT_COLORS: Record<string, string> = { purple: '#7F77DD', amber: '#EF9F27', teal: '#1D9E75', green: '#639922' };

function Toolbar({ editor }: { editor: Editor }) {
    const colorRef = useRef<HTMLInputElement>(null);
    const highlightRef = useRef<HTMLInputElement>(null);

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

    const currentColor = editor.getAttributes('textStyle').color as string | undefined;
    const currentHighlight = editor.getAttributes('highlight').color as string | undefined;

    return (
        <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border-b border-border bg-muted/50 px-2 py-1.5">
            {/* Heading */}
            <select
                className="h-6 cursor-pointer rounded border-0 bg-transparent text-xs focus:outline-none"
                value={
                    editor.isActive('heading', { level: 1 }) ? '1'
                    : editor.isActive('heading', { level: 2 }) ? '2'
                    : editor.isActive('heading', { level: 3 }) ? '3'
                    : ''
                }
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
                {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <Sep />

            {/* Basic formatting */}
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolbarBtn>

            <Sep />

            {/* Text color */}
            <input
                ref={colorRef}
                type="color"
                className="sr-only"
                defaultValue="#000000"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
            <ToolbarBtn onClick={() => colorRef.current?.click()} active={!!currentColor} title="Text color">
                <span className="flex flex-col items-center leading-none">
                    <span className="font-bold text-sm">A</span>
                    <span className="block h-0.5 w-3 rounded" style={{ backgroundColor: currentColor ?? '#000' }} />
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
            <ToolbarBtn onClick={() => highlightRef.current?.click()} active={editor.isActive('highlight')} title="Highlight">
                <span className="flex flex-col items-center leading-none">
                    <span className="text-sm">H</span>
                    <span className="block h-0.5 w-3 rounded" style={{ backgroundColor: currentHighlight ?? '#fef08a' }} />
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
            <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">≡</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">#≡</ToolbarBtn>

            <Sep />

            {/* Link, image & code */}
            <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="Link">🔗</ToolbarBtn>
            <ToolbarBtn onClick={addImage} title="Insert image">🖼</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">{`</>`}</ToolbarBtn>

            <Sep />

            {/* Table */}
            <ToolbarBtn
                onClick={() => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                active={editor.isActive('table')}
                title="Insert table"
            >
                ⊞
            </ToolbarBtn>
            {editor.isActive('table') && (
                <>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).addColumnAfter().run()} title="Add column">+C</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).deleteColumn().run()} title="Delete column">−C</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).addRowAfter().run()} title="Add row">+R</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).deleteRow().run()} title="Delete row">−R</ToolbarBtn>
                    <ToolbarBtn onClick={() => (editor.chain().focus() as any).deleteTable().run()} title="Delete table" >✕T</ToolbarBtn>
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
            <EditorContent
                editor={editor}
                placeholder={placeholder}
                className="focus-within:ring-ring rounded-b-md focus-within:ring-2 focus-within:ring-offset-1"
            />
        </div>
    );
}
