import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface TagSuggestionsProps {
    value: string;
    onChange: (value: string) => void;
    tagsUrl: string;
}

export default function TagSuggestions({ value, onChange, tagsUrl }: TagSuggestionsProps) {
    const [allTags, setAllTags] = useState<string[]>([]);

    useEffect(() => {
        fetch(tagsUrl)
            .then(res => res.json())
            .then(data => setAllTags(data.tags || []))
            .catch(() => {});
    }, [tagsUrl]);

    const currentTags = value.split(',').map(t => t.trim()).filter(Boolean);
    const currentTagsLower = currentTags.map(t => t.toLowerCase());

    const addTag = (tag: string) => {
        if (currentTagsLower.includes(tag.toLowerCase())) { return; }
        const newValue = currentTags.length > 0 ? currentTags.join(', ') + ', ' + tag : tag;
        onChange(newValue);
    };

    const removeTag = (index: number) => {
        onChange(currentTags.filter((_, i) => i !== index).join(', '));
    };

    // Available = all known tags minus ones already added
    const available = allTags.filter(t => !currentTagsLower.includes(t.toLowerCase()));

    return (
        <div className="space-y-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="career, remote work, freelancing"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            />

            {/* Current tags as removable chips */}
            {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {currentTags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                            {tag}
                            <button type="button" onClick={() => removeTag(i)} className="hover:opacity-70">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* All available tags — always shown */}
            {available.length > 0 && (
                <div className="rounded-md border border-input bg-muted/40 p-2">
                    <p className="mb-1.5 text-xs text-muted-foreground">Click to add</p>
                    <div className="flex flex-wrap gap-1.5">
                        {available.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="rounded-md bg-background border border-input px-2 py-0.5 text-xs hover:bg-accent transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
