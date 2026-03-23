import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CalloutBlock from '@/components/editor/callout-block';

export type CalloutVariant = 'purple' | 'amber' | 'teal' | 'green';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        callout: {
            insertCallout: (variant?: CalloutVariant) => ReturnType;
        };
    }
}

export const Callout = Node.create({
    name: 'callout',

    group: 'block',

    content: 'inline*',

    addAttributes() {
        return {
            variant: {
                default: 'purple' as CalloutVariant,
                parseHTML: (element) => element.getAttribute('data-variant') || 'purple',
                renderHTML: (attributes) => ({ 'data-variant': attributes.variant }),
            },
            label: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-label') || '',
                renderHTML: (attributes) => ({ 'data-label': attributes.label }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="callout"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutBlock);
    },

    addCommands() {
        return {
            insertCallout:
                (variant: CalloutVariant = 'purple') =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: { variant },
                    });
                },
        };
    },
});
