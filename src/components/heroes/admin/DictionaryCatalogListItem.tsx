'use client';

import type { ReactNode } from 'react';

type DictionaryCatalogListItemProps = {
  active: boolean;
  title: string;
  description?: string | null;
  id: number;
  imageUrl?: string | null;
  badge?: ReactNode;
  onClick: () => void;
};

export default function DictionaryCatalogListItem({
  active,
  title,
  description,
  id,
  imageUrl,
  badge,
  onClick,
}: DictionaryCatalogListItemProps) {
  const hasDescription = Boolean(description?.trim());

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition ${
        active
          ? 'border-cyan-400/40 bg-cyan-400/10'
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      <div className="flex items-stretch gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_62%)] text-lg font-semibold uppercase text-[var(--foreground-muted)]">
              {title.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="flex min-h-16 min-w-0 flex-1 flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-sm font-semibold text-[var(--foreground)] line-clamp-1">
              {title}
            </div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>

          <div className="min-h-[2rem] text-xs leading-4 text-[var(--foreground-soft)]">
            <div className={hasDescription ? 'line-clamp-2' : 'text-[var(--foreground-muted)]'}>
              {hasDescription ? description : '—'}
            </div>
          </div>

          <div className="text-[11px] uppercase tracking-wide text-[var(--foreground-muted)]">
            ID: {id}
          </div>
        </div>
      </div>
    </button>
  );
}
