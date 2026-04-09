'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import SearchField from './SearchField';

type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  clearSearchLabel: string;
  emptyOptionLabel?: string;
  noResultsLabel: string;
};

export default function SearchableSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  searchAriaLabel,
  clearSearchLabel,
  emptyOptionLabel,
  noResultsLabel,
}: SearchableSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return options.filter((option) =>
      normalizedQuery.length === 0
        ? true
        : option.label.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [options, searchQuery]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--foreground-soft)]">{label}</span>

      <button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (!next) {
              setSearchQuery('');
            }
            return next;
          });
        }}
        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition hover:bg-[var(--surface-hover)]"
      >
        <span className={selectedOption ? 'text-[var(--foreground)]' : 'text-[var(--foreground-soft)]'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className="text-xs text-[var(--foreground-muted)]">{open ? '\u25b2' : '\u25bc'}</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchPlaceholder}
            ariaLabel={searchAriaLabel}
            clearLabel={clearSearchLabel}
          />

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {emptyOptionLabel ? (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setSearchQuery('');
                  setOpen(false);
                }}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  value === ''
                    ? 'border-cyan-400/40 bg-cyan-950 text-cyan-200'
                    : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                }`}
              >
                {emptyOptionLabel}
              </button>
            ) : null}

            {filteredOptions.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300">
                {noResultsLabel}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setSearchQuery('');
                    setOpen(false);
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    option.value === value
                      ? 'border-cyan-400/40 bg-cyan-950 text-cyan-200'
                      : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
