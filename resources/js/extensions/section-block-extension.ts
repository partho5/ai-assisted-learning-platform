import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import SectionBlockComponent from '@/components/editor/section-block';

export type SectionVariant = 'hero-dark' | 'hero-light' | 'accent' | 'bordered';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        sectionBlock: {
            insertSection: (variant?: SectionVariant) => ReturnType;
        };
    }
}

export const SectionBlock = Node.create({
    name: 'sectionBlock',

    group: 'block',

    // block+ allows paragraphs, headings, lists, etc. inside
    content: 'block+',

    defining: true,

    addAttributes() {
        return {
            variant: {
                default: 'hero-dark' as SectionVariant,
                parseHTML: (element) => element.getAttribute('data-variant') || 'hero-dark',
                renderHTML: (attributes) => ({ 'data-variant': attributes.variant }),
            },
            label: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-label') || '',
                renderHTML: (attributes) => {
                    if (!attributes.label) return {};
                    return { 'data-label': attributes.label };
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="section-block"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'section-block' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SectionBlockComponent);
    },

    addCommands() {
        return {
            insertSection:
                (variant: SectionVariant = 'hero-dark') =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: { variant },
                        content: [{ type: 'paragraph' }],
                    });
                },
        };
    },
});
