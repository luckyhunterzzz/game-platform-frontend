'use client';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
  className?: string;
};

export default function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
  className = '',
}: SearchFieldProps) {
  return (
    <label className={className || 'block'}>
      <span className="sr-only">{ariaLabel}</span>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 pr-12 text-sm text-[var(--foreground)] outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={clearLabel}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
          >
            x
          </button>
        ) : null}
      </div>
    </label>
  );
}
