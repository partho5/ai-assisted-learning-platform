import { useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const VARIANTS = {
    'hero-dark': {
        label: 'Dark',
        light: { bg: '#093464', text: '#bfdbfe', border: '#0d4080', accent: '#93c5fd' },
        dark:  { bg: '#093464', text: '#bfdbfe', border: '#0d4080', accent: '#93c5fd' },
    },
    'hero-light': {
        label: 'Blue',
        light: { bg: '#1709ed', text: '#c7d2fe', border: '#1207c4', accent: '#a5b4fc' },
        dark:  { bg: '#1709ed', text: '#c7d2fe', border: '#1207c4', accent: '#a5b4fc' },
    },
    accent: {
        label: 'Accent',
        light: { bg: '#eff6ff', text: '#1e3a5f', border: '#3b82f6', accent: '#3b82f6' },
        dark:  { bg: '#172554', text: '#bfdbfe', border: '#60a5fa', accent: '#60a5fa' },
    },
    bordered: {
        label: 'Bordered',
        light: { bg: '#fff7ed80', text: '#431407', border: '#f97316', accent: '#f97316' },
        dark:  { bg: '#43140730', text: '#fed7aa', border: '#fb923c', accent: '#fb923c' },
    },
} as const;

type VariantKey = keyof typeof VARIANTS;

function useDarkMode(): boolean {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains('dark'),
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return isDark;
}

export default function SectionBlock({ node, updateAttributes }: NodeViewProps) {
    const variant = (node.attrs.variant as VariantKey) || 'hero-dark';
    const label = (node.attrs.label as string) || '';
    const isDark = useDarkMode();
    const colors = VARIANTS[variant]?.[isDark ? 'dark' : 'light'] ?? VARIANTS['hero-dark'].light;

    const isBordered = variant === 'bordered';
    const isHeroDark = variant === 'hero-dark';

    return (
        <NodeViewWrapper
            style={{
                background: colors.bg,
                border: isBordered ? `2px solid ${colors.border}` : `1px solid ${colors.border}`,
                borderRadius: '10px',
                padding: '14px',
                margin: '16px 0',
                color: colors.text,
            }}
        >
            {/* Controls row */}
            <div
                contentEditable={false}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    userSelect: 'none',
                }}
            >
                {/* Label input */}
                <input
                    type="text"
                    value={label}
                    placeholder="Section label..."
                    onChange={(e) => updateAttributes({ label: e.target.value })}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: '',
                        color: colors.accent,
                        flex: 1,
                        padding: 0,
                        margin: 0,
                        lineHeight: '1.4',
                    }}
                />

                {/* Variant switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {(Object.keys(VARIANTS) as VariantKey[]).map((key) => {
                        const preview = VARIANTS[key].light;
                        const isActive = key === variant;
                        return (
                            <button
                                key={key}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => updateAttributes({ variant: key })}
                                title={VARIANTS[key].label}
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: '4px',
                                    background: preview.bg,
                                    border: `2px solid ${preview.border}`,
                                    outline: isActive ? `2px solid ${colors.accent}` : 'none',
                                    outlineOffset: '1px',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Editable block content — supports headings, lists, bold, etc. */}
            <NodeViewContent
                className="section-block-content"
                style={{
                    outline: 'none',
                    color: colors.text,
                    // Override child element colors for dark variant
                    ...(isHeroDark ? { '--section-heading-color': '#f1f5f9', '--section-text-color': '#cbd5e1' } as any : {}),
                }}
            />
        </NodeViewWrapper>
    );
}
