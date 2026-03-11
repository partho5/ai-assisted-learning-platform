import { useCallback, useSyncExternalStore } from 'react';

export type FontScale = '1' | '1.1' | '1.2' | '1.3' | '1.5';

export type UseFontScaleReturn = {
    readonly fontScale: FontScale;
    readonly updateFontScale: (scale: FontScale) => void;
};

const STORAGE_KEY = 'font-scale';
const listeners = new Set<() => void>();
let currentFontScale: FontScale = '1';

const getStoredFontScale = (): FontScale => {
    if (typeof window === 'undefined') return '1';

    return (localStorage.getItem(STORAGE_KEY) as FontScale) || '1';
};

const applyFontScale = (scale: FontScale): void => {
    if (typeof document === 'undefined') return;

    document.documentElement.style.fontSize = scale === '1' ? '' : `${scale}rem`;
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

export function initializeFontScale(): void {
    if (typeof window === 'undefined') return;

    currentFontScale = getStoredFontScale();
    applyFontScale(currentFontScale);
}

export function useFontScale(): UseFontScaleReturn {
    const fontScale: FontScale = useSyncExternalStore(
        subscribe,
        () => currentFontScale,
        () => '1',
    );

    const updateFontScale = useCallback((scale: FontScale): void => {
        currentFontScale = scale;
        localStorage.setItem(STORAGE_KEY, scale);
        applyFontScale(scale);
        notify();
    }, []);

    return { fontScale, updateFontScale } as const;
}
