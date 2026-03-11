import type { HTMLAttributes } from 'react';
import type { FontScale } from '@/hooks/use-font-scale';
import { useFontScale } from '@/hooks/use-font-scale';
import { cn } from '@/lib/utils';

const scales: { value: FontScale; label: string; size: string }[] = [
    { value: '1', label: 'Default', size: 'text-sm' },
    { value: '1.1', label: '1.1×', size: 'text-base' },
    { value: '1.2', label: '1.2×', size: 'text-lg' },
    { value: '1.3', label: '1.3×', size: 'text-xl' },
    { value: '1.5', label: '1.5×', size: 'text-2xl' },
];

export default function FontScaleTabs({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { fontScale, updateFontScale } = useFontScale();

    return (
        <div
            className={cn('inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800', className)}
            {...props}
        >
            {scales.map(({ value, label, size }) => (
                <button
                    key={value}
                    onClick={() => updateFontScale(value)}
                    title={label}
                    className={cn(
                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors',
                        fontScale === value
                            ? 'bg-white shadow-xs border border-primary/40 dark:bg-neutral-700 dark:text-neutral-100 dark:border-primary/60'
                            : 'text-neutral-500 border border-transparent hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                    )}
                >
                    <span className={cn('font-semibold leading-none', size)}>A</span>
                    <span className="text-xs">{label}</span>
                </button>
            ))}
        </div>
    );
}
