import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import YoutubeBlock from '@/components/editor/youtube-block';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        youtube: {
            insertYoutube: (videoId: string) => ReturnType;
        };
    }
}

/**
 * Extract an 11-char YouTube video ID from any common URL format
 * (watch, youtu.be, embed, shorts) — falls back to returning the input
 * if it already looks like a bare video ID.
 */
export function extractYoutubeId(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) {
        return null;
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    const match = trimmed.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/,
    );
    return match ? match[1] : null;
}

export const Youtube = Node.create({
    name: 'youtube',

    group: 'block',

    atom: true,

    selectable: true,

    draggable: true,

    addAttributes() {
        return {
            videoId: {
                default: '',
                parseHTML: (element) => element.getAttribute('data-video-id') || '',
                renderHTML: (attributes) => ({ 'data-video-id': attributes.videoId }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-type="youtube"]' }];
    },

    renderHTML({ node, HTMLAttributes }) {
        const videoId = (node.attrs.videoId as string) || '';
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'youtube',
                class: 'yt-embed',
                style: 'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1em auto;border-radius:0.5rem;max-width:720px;background:#000;',
            }),
            [
                'iframe',
                {
                    src: `https://www.youtube-nocookie.com/embed/${videoId}`,
                    loading: 'lazy',
                    frameborder: '0',
                    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                    allowfullscreen: 'true',
                    referrerpolicy: 'strict-origin-when-cross-origin',
                    style: 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;',
                },
            ],
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(YoutubeBlock);
    },

    addCommands() {
        return {
            insertYoutube:
                (videoId: string) =>
                ({ commands }) => {
                    if (!videoId) {
                        return false;
                    }
                    return commands.insertContent({
                        type: this.name,
                        attrs: { videoId },
                    });
                },
        };
    },
});
