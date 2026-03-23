import { useState, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const VARIANTS = {
    purple: {
        light: { bg: '#EEEDFE', border: '#7F77DD', bodyText: '#534AB7', title: '#3C3489', label: '#534AB7', midStop: '#CECBF6' },
        dark:  { bg: '#26215C', border: '#AFA9EC', bodyText: '#CECBF6', title: '#EEEDFE', label: '#CECBF6', midStop: '#3C3489' },
    },
    amber: {
        light: { bg: '#FAEEDA', border: '#EF9F27', bodyText: '#854F0B', title: '#633806', label: '#854F0B', midStop: '#FAC775' },
        dark:  { bg: '#412402', border: '#FAC775', bodyText: '#FAC775', title: '#FAEEDA', label: '#FAC775', midStop: '#633806' },
    },
    teal: {
        light: { bg: '#E1F5EE', border: '#1D9E75', bodyText: '#0F6E56', title: '#085041', label: '#0F6E56', midStop: '#9FE1CB' },
        dark:  { bg: '#04342C', border: '#5DCAA5', bodyText: '#9FE1CB', title: '#E1F5EE', label: '#9FE1CB', midStop: '#085041' },
    },
    green: {
        light: { bg: '#EAF3DE', border: '#639922', bodyText: '#3B6D11', title: '#27500A', label: '#3B6D11', midStop: '#C0DD97' },
        dark:  { bg: '#173404', border: '#97C459', bodyText: '#C0DD97', title: '#EAF3DE', label: '#C0DD97', midStop: '#27500A' },
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

export default function CalloutBlock({ node, updateAttributes }: NodeViewProps) {
    const variant = (node.attrs.variant as VariantKey) || 'purple';
    const label = (node.attrs.label as string) || '';
    const isDark = useDarkMode();
    const colors = VARIANTS[variant]?.[isDark ? 'dark' : 'light'] ?? VARIANTS.purple.light;
    const isEmpty = node.content.size === 0;

    return (
        <NodeViewWrapper
            style={{
                borderLeft: `4px solid ${colors.border}`,
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                borderRadius: '0 10px 10px 0',
                background: `color-mix(in srgb, ${colors.bg} 60%, transparent)`,
                boxShadow: `inset 0 0 60px 0 color-mix(in srgb, ${colors.midStop} 12%, transparent)`,
                padding: '12px 16px',
                margin: '8px 0',
            }}
        >
            {/* Label row */}
            <div
                contentEditable={false}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                    userSelect: 'none',
                }}
            >
                {/* Accent dot */}
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: colors.border,
                        flexShrink: 0,
                        display: 'inline-block',
                    }}
                />

                {/* Editable label */}
                <input
                    type="text"
                    value={label}
                    placeholder="Label..."
                    onChange={(e) => updateAttributes({ label: e.target.value })}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.label,
                        flex: 1,
                        padding: 0,
                        margin: 0,
                        lineHeight: '1.4',
                        fontFamily: 'inherit',
                    }}
                />

                {/* Color switcher dots */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                    }}
                >
                    {(Object.keys(VARIANTS) as VariantKey[]).map((key) => {
                        const dotColor = VARIANTS[key][isDark ? 'dark' : 'light'].border;
                        const isActive = key === variant;
                        return (
                            <button
                                key={key}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => updateAttributes({ variant: key })}
                                title={key}
                                style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    background: dotColor,
                                    border: 'none',
                                    outline: isActive ? `2px solid ${dotColor}` : 'none',
                                    outlineOffset: '1px',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Body content */}
            <div style={{ position: 'relative' }}>
                {isEmpty && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            color: colors.bodyText,
                            opacity: 0.4,
                            pointerEvents: 'none',
                            fontSize: 13,
                            lineHeight: '1.65',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        }}
                    >
                        Write here...
                    </div>
                )}
                <NodeViewContent
                    style={{
                        fontSize: 13,
                        lineHeight: '1.65',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        color: colors.bodyText,
                        outline: 'none',
                    }}
                />
            </div>
        </NodeViewWrapper>
    );
}
