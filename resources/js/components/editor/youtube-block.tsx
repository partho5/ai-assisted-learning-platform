import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

export default function YoutubeBlock({ node }: NodeViewProps) {
    const videoId = (node.attrs.videoId as string) || '';
    const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

    return (
        <NodeViewWrapper>
            <div
                contentEditable={false}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '640px',
                    aspectRatio: '16 / 9',
                    margin: '0.75rem auto',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    background: '#000',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                    userSelect: 'none',
                    cursor: 'pointer',
                }}
                title="YouTube video preview (renders live on publish)"
            >
                {thumb && (
                    <img
                        src={thumb}
                        alt="YouTube video thumbnail"
                        loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}

                {/* Dim overlay + play button */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)',
                    }}
                >
                    <div
                        style={{
                            width: 68,
                            height: 48,
                            borderRadius: '12px',
                            background: 'rgba(220, 38, 38, 0.92)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                    >
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: '16px solid white',
                                borderTop: '10px solid transparent',
                                borderBottom: '10px solid transparent',
                                marginLeft: '4px',
                            }}
                        />
                    </div>
                </div>

                {/* Label badge */}
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                    }}
                >
                    YOUTUBE
                </div>
            </div>
        </NodeViewWrapper>
    );
}
