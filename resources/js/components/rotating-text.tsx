import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    words: string[];
    interval?: number;
    initialDelay?: number;
    className?: string;
};

/**
 * Cycles through `words` in place with a vertical slide animation.
 * Usage: <RotatingText words={['job', 'business', 'career']} />
 */
export function RotatingText({ words, interval = 2500, initialDelay = 0, className }: Props) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');

    // Keep words stable between renders so effect deps don't fire spuriously
    const wordsRef = useRef(words);
    wordsRef.current = words;

    useEffect(() => {
        const intervalRef = { id: 0 as ReturnType<typeof setInterval> };

        const tick = () => {
            setPhase('out');
            setTimeout(() => {
                setIndex((i) => (i + 1) % wordsRef.current.length);
                setPhase('in');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => setPhase('idle'));
                });
            }, 350);
        };

        const delay = setTimeout(() => {
            tick();
            intervalRef.id = setInterval(tick, interval);
        }, initialDelay);

        return () => {
            clearTimeout(delay);
            clearInterval(intervalRef.id);
        };
    }, [interval, initialDelay]);

    const isTransitioning = phase !== 'in';

    return (
        <span
            className={cn('relative inline-block overflow-hidden align-bottom', className)}
        >
            <span
                style={{
                    display: 'inline-block',
                    transition: isTransitioning
                        ? 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease'
                        : 'none',
                    transform:
                        phase === 'out'
                            ? 'translateY(-120%)'
                            : phase === 'in'
                              ? 'translateY(120%)'
                              : 'translateY(0)',
                    opacity: phase === 'idle' ? 1 : 0,
                }}
            >
                {words[index]}
            </span>
        </span>
    );
}
