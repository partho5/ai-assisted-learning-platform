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
        const intervalRef = { id: undefined as ReturnType<typeof setInterval> | undefined };

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
        <span className={cn('relative inline-grid justify-items-center overflow-hidden align-bottom', className)}>
            {words.map((word, i) => (
                <span
                    key={word}
                    aria-hidden={i !== index}
                    style={{
                        gridArea: '1 / 1',
                        transition:
                            i === index && isTransitioning
                                ? 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease'
                                : 'none',
                        transform:
                            i !== index
                                ? 'translateY(0)'
                                : phase === 'out'
                                  ? 'translateY(-120%)'
                                  : phase === 'in'
                                    ? 'translateY(120%)'
                                    : 'translateY(0)',
                        opacity: i === index ? (phase === 'idle' ? 1 : 0) : 0,
                        visibility: i === index ? 'visible' : 'hidden',
                    }}
                >
                    {word}
                </span>
            ))}
        </span>
    );
}
