import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatPanel } from '@/components/chat/chat-panel';
import type { ChatContext } from '@/hooks/use-chat';

// ─── Inline keyframes ───────────────────────────────────────────────────────
// Rotating border: a conic-gradient span spins inside an overflow-hidden wrapper.
// box-shadow on the wrapper paints outside overflow without causing scrollbars.
const STYLES = `
@keyframes ai-blink {
  0%, 88%, 100% { transform: scaleY(1); }
  93%            { transform: scaleY(0.1); }
}
@keyframes ai-antenna-pulse {
  0%, 100% { opacity: 1;   r: 2.5; }
  50%       { opacity: 0.4; r: 1.8; }
}
@keyframes ai-border-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes ai-glow-pulse {
  0%, 100% { box-shadow: 0 0 18px rgba(255,255,255,0.12); }
  50%       { box-shadow: 0 0 32px rgba(255,255,255,0.26); }
}
@keyframes ai-float {
  0%, 100% { transform: translateY(0px);  }
  50%       { transform: translateY(-2px); }
}
.ai-eye         { animation: ai-blink         3.8s ease-in-out infinite;       transform-origin: center; }
.ai-eye-r       { animation: ai-blink         3.8s ease-in-out infinite 0.18s; transform-origin: center; }
.ai-antenna-dot { animation: ai-antenna-pulse 1.6s ease-in-out infinite; }
.ai-border-spin { animation: ai-border-spin   4s   linear     infinite; }
.ai-glow-pulse:hover .ai-border-spin { animation-duration: 0.8s; }
.ai-glow-pulse  { animation: ai-glow-pulse    2.2s ease-in-out infinite; }
.ai-icon-wrap   { animation: ai-float         3.2s ease-in-out infinite; }
`;

// ─── Signal Mind SVG icon ──────────────────────────────────────────────────
function SignalMindIcon({ size = 20 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 26 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <line x1="13" y1="5" x2="13" y2="1.5" stroke="#86efac" strokeWidth="1.3" strokeLinecap="round" />
            <circle className="ai-antenna-dot" cx="13" cy="1" r="2.5" fill="#86efac" />
            <rect x="1.5" y="5" width="23" height="22" rx="5.5" fill="#060d08" stroke="#86efac" strokeWidth="1.4" />
            <circle cx="5.5"  cy="8.5"  r="1" fill="#86efac" opacity="0.5" />
            <circle cx="20.5" cy="8.5"  r="1" fill="#86efac" opacity="0.5" />
            <circle cx="5.5"  cy="23.5" r="1" fill="#86efac" opacity="0.5" />
            <circle cx="20.5" cy="23.5" r="1" fill="#86efac" opacity="0.5" />
            <rect x="5.5" y="12" width="6" height="5.5" rx="1.8" fill="#67e8f9" opacity="0.12" />
            <rect className="ai-eye" x="6.5" y="13" width="4" height="3.5" rx="1.2" fill="#67e8f9" />
            <circle cx="9.2" cy="13.8" r="0.9" fill="white" opacity="0.65" />
            <rect x="14.5" y="12" width="6" height="5.5" rx="1.8" fill="#a3e635" opacity="0.12" />
            <rect className="ai-eye-r" x="15.5" y="13" width="4" height="3.5" rx="1.2" fill="#a3e635" />
            <circle cx="18.2" cy="13.8" r="0.9" fill="white" opacity="0.65" />
            <rect x="6"    y="20.5" width="2" height="3.5" rx="1" fill="#86efac" opacity="0.55" />
            <rect x="9.2"  y="19.5" width="2" height="4.5" rx="1" fill="#86efac" opacity="0.75" />
            <rect x="12.4" y="19"   width="2" height="5"   rx="1" fill="#86efac" opacity="1"    />
            <rect x="15.6" y="19.5" width="2" height="4.5" rx="1" fill="#86efac" opacity="0.75" />
            <rect x="18.8" y="20.5" width="2" height="3.5" rx="1" fill="#86efac" opacity="0.55" />
        </svg>
    );
}

// ─── Props ─────────────────────────────────────────────────────────────────
interface Props {
    context: ChatContext;
    className?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────
export function FloatingChatButton({ context, className }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    function handleClose() {
        setIsOpen(false);
        setIsMinimized(false);
    }

    function handleToggleMinimize() {
        setIsMinimized((v) => !v);
    }

    function handleAutoTrigger() {
        setIsOpen(true);
        setIsMinimized(false);
    }

    return (
        <>
            <style>{STYLES}</style>

            <ChatPanel
                context={{ ...context, onAutoTrigger: handleAutoTrigger }}
                isOpen={isOpen}
                isMinimized={isMinimized}
                onClose={handleClose}
                onToggleMinimize={handleToggleMinimize}
            />

            {/*
              Wrapper: fixed + overflow-hidden clips the oversized spinning
              conic-gradient span to the pill shape → animated gradient border.
              p-[3px] = border thickness. box-shadow (ai-glow-pulse) is on the
              wrapper — not clipped by overflow-hidden, no scrollbar side effects.
            */}
            {(!isOpen || isMinimized) && (
                <div
                    className={cn(
                        'fixed bottom-6 right-6 z-50 rounded-full',
                        'transition-transform duration-200 hover:scale-105 active:scale-95',
                        'p-[3px] overflow-hidden ai-glow-pulse',
                        className,
                    )}
                >
                    {/* Spinning conic-gradient — clipped by wrapper to form the border */}
                    <span
                        className="ai-border-spin pointer-events-none absolute rounded-full"
                        style={{
                            inset: '-100%',
                            width: '300%',
                            height: '300%',
                            background: 'conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #4285F4)',
                        }}
                        aria-hidden="true"
                    />

                    <button
                        type="button"
                        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
                        aria-label="Open AI assistant"
                        className={cn(
                            'relative flex items-center gap-2.5',
                            'rounded-full px-4 py-2.5',
                            'bg-[#060d08]',
                            'text-sm font-semibold text-green-500',
                        )}
                    >
                        <span className="ai-icon-wrap flex-shrink-0">
                            <SignalMindIcon size={20} />
                        </span>
                        <span className="leading-none tracking-wide">Ask AI</span>
                    </button>
                </div>
            )}
        </>
    );
}
