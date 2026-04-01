'use client';

import type { ReactNode } from 'react';

type DictionaryModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
};

export default function DictionaryModal({
  open,
  title,
  onClose,
  children,
  closeLabel = 'Закрыть',
}: DictionaryModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {closeLabel}
            </button>
          </div>

          <div className="overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}