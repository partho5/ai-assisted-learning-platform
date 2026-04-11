import { useCallback, useRef, useState } from 'react';
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

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

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

type ImgPanel = {
    open: boolean;
    uploadedUrl: string;
    url: string;
    alt: string;
    fileName: string;
    uploading: boolean;
    error: string | null;
};
const IMG_PANEL_CLOSED: ImgPanel = { open: false, uploadedUrl: '', url: '', alt: '', fileName: '', uploading: false, error: null };

function Toolbar({ editor }: { editor: Editor }) {
    const colorRef = useRef<HTMLInputElement>(null);
    const highlightRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [imgPanel, setImgPanel] = useState<ImgPanel>(IMG_PANEL_CLOSED);

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

    const handleImgFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) { return; }

        setImgPanel((p) => ({ ...p, uploading: true, error: null, fileName: file.name, url: '', uploadedUrl: '' }));

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData },
            );

            if (!res.ok) { throw new Error('Upload failed'); }

            const data = await res.json();
            setImgPanel((p) => ({ ...p, uploading: false, uploadedUrl: data.secure_url as string }));
        } catch {
            setImgPanel((p) => ({ ...p, uploading: false, error: 'Upload failed. Please try again.' }));
        } finally {
            if (fileRef.current) { fileRef.current.value = ''; }
        }
    }, []);

    const insertImage = useCallback(() => {
        const src = imgPanel.uploadedUrl || imgPanel.url.trim();
        if (src) {
            editor.chain().focus().setImage({ src, alt: imgPanel.alt.trim() || undefined } as any).run();
        }
        setImgPanel(IMG_PANEL_CLOSED);
        if (fileRef.current) { fileRef.current.value = ''; }
    }, [editor, imgPanel]);

    return (
        <>
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
            <ToolbarBtn onClick={() => setImgPanel((p) => ({ ...IMG_PANEL_CLOSED, open: !p.open }))} active={imgPanel.open} title="Insert image">🖼</ToolbarBtn>
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

        {/* Image insertion panel */}
        {imgPanel.open && (
            <div className="border-b border-border bg-muted/30 px-3 py-2 flex flex-wrap items-end gap-3">
                {/* Hidden file input */}
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImgFile} disabled={imgPanel.uploading} />

                {/* Upload button + filename */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Upload</span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={imgPanel.uploading}
                            onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}
                            className="rounded border border-border bg-background px-2 py-0.5 text-xs hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            {imgPanel.uploading ? 'Uploading…' : 'Choose file'}
                        </button>
                        <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                            {imgPanel.fileName || 'No file chosen'}
                        </span>
                    </div>
                    {imgPanel.error && <span className="text-[10px] text-destructive">{imgPanel.error}</span>}
                </div>

                {/* OR separator */}
                <span className="text-xs text-muted-foreground self-end pb-0.5">or</span>

                {/* URL input */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-[160px]">
                    <span className="text-[10px] text-muted-foreground">Image URL</span>
                    <input
                        type="url"
                        placeholder="https://..."
                        value={imgPanel.url}
                        onChange={(e) => setImgPanel((p) => ({ ...p, url: e.target.value, uploadedUrl: '', fileName: '' }))}
                        className="h-6 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>

                {/* Alt text */}
                <div className="flex flex-col gap-0.5 min-w-[140px]">
                    <span className="text-[10px] text-muted-foreground">Alt text</span>
                    <input
                        type="text"
                        placeholder="Describe the image"
                        value={imgPanel.alt}
                        onChange={(e) => setImgPanel((p) => ({ ...p, alt: e.target.value }))}
                        className="h-6 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>

                {/* Preview thumbnail */}
                {(imgPanel.uploadedUrl || imgPanel.url) && (
                    <img
                        src={imgPanel.uploadedUrl || imgPanel.url}
                        alt="preview"
                        className="h-10 w-10 rounded border border-border object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                )}

                {/* Actions */}
                <div className="flex items-end gap-1.5 self-end">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); insertImage(); }}
                        disabled={imgPanel.uploading || (!imgPanel.uploadedUrl && !imgPanel.url.trim())}
                        className="rounded bg-primary px-3 py-0.5 text-xs text-primary-foreground disabled:opacity-40 transition-opacity"
                    >
                        Insert
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setImgPanel(IMG_PANEL_CLOSED); if (fileRef.current) { fileRef.current.value = ''; } }}
                        className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}
        </>
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
