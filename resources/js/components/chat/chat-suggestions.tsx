const PLATFORM_SUGGESTIONS = [
    'What is SkillEvidence and who is it for?',
    'How does the enrollment process work?',
    'What is the difference between Free and Paid tier?',
];

const RESOURCE_SUGGESTIONS: Record<string, string[]> = {
    video: ['Summarise what this video covers', 'I didn\'t understand a part — can you explain?', 'Give me a real-world example'],
    text: ['Explain this in simpler terms', 'Give me a real-world example', 'What should I take away from this?'],
    article: ['What are the key takeaways?', 'How does this relate to the course?', 'Can you expand on this topic?'],
    test: ['I\'m confused — can you give me a hint?', 'Explain the concept behind this question', 'What should I study to answer this?'],
    document: ['What is this document about?', 'Summarise the key points', 'How do I apply this?'],
    audio: ['What topics does this audio cover?', 'Explain a concept from this lesson', 'Give me a real-world example'],
};

interface Props {
    contextType: 'platform' | 'course' | 'resource';
    resourceType?: string;
    onSelect: (text: string) => void;
}

export function ChatSuggestions({ contextType, resourceType, onSelect }: Props) {
    const suggestions =
        contextType === 'platform'
            ? PLATFORM_SUGGESTIONS
            : (RESOURCE_SUGGESTIONS[resourceType ?? 'text'] ?? RESOURCE_SUGGESTIONS.text);

    return (
        <div className="flex flex-col gap-1.5 px-4 pb-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Try asking</p>
            <div className="flex flex-col gap-1.5">
                {suggestions.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => onSelect(s)}
                        className="rounded-xl border border-border bg-card px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
}
