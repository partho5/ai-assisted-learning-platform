import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const RESET_DELAY_MS = 2000;

async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fall through to the textarea fallback
        }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}

interface CopyButtonProps {
    text: string;
    label?: string;
    copiedLabel?: string;
    disabled?: boolean;
}

export function CopyButton({
    text,
    label = 'Copy',
    copiedLabel = 'Copied',
    disabled = false,
}: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, []);

    const handleClick = async () => {
        if (!(await copyToClipboard(text))) {
            return;
        }

        setCopied(true);
        if (timer.current) {
            clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => setCopied(false), RESET_DELAY_MS);
    };

    return (
        <Button
            type="button"
            variant="secondary"
            size="compact"
            onClick={handleClick}
            disabled={disabled}
        >
            {copied ? <Check /> : <Copy />}
            <span aria-live="polite">{copied ? copiedLabel : label}</span>
        </Button>
    );
}
