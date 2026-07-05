'use client';

export type MarkdownAction =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'strike' }
  | { type: 'link' }
  | { type: 'bullet-list' }
  | { type: 'ordered-list' }
  | { type: 'quote' };

type MarkdownToolbarProps = {
  disabled?: boolean;
  onApply: (action: MarkdownAction) => void;
};

const DEFAULT_ACTIONS: Array<{ action: MarkdownAction; label: string; title: string }> = [
  { action: { type: 'bold' }, label: 'B', title: 'Bold' },
  { action: { type: 'italic' }, label: 'I', title: 'Italic' },
  { action: { type: 'strike' }, label: 'S', title: 'Strike' },
  { action: { type: 'link' }, label: 'Link', title: 'Insert link' },
  { action: { type: 'bullet-list' }, label: '? List', title: 'Bullet list' },
  { action: { type: 'ordered-list' }, label: '1. List', title: 'Ordered list' },
  { action: { type: 'quote' }, label: 'Quote', title: 'Quote' },
];

export default function MarkdownToolbar({ disabled = false, onApply }: MarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
      {DEFAULT_ACTIONS.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={disabled}
          onClick={() => onApply(item.action)}
          title={item.title}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
