'use client';

import type { HeroDictionaryKey, HeroDictionaryOption } from '@/lib/types/hero';

type HeroesAdminToolbarProps = {
  items: HeroDictionaryOption[];
  activeKey: HeroDictionaryKey;
  onChange: (key: HeroDictionaryKey) => void;
};

export default function HeroesAdminToolbar({
  items,
  activeKey,
  onChange,
}: HeroesAdminToolbarProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`group flex min-h-[96px] w-[160px] flex-col items-center justify-center rounded-2xl border p-4 text-center shadow-lg transition-all ${
              isActive
                ? 'border-cyan-400/40 bg-cyan-400/10'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/40 hover:bg-[var(--surface-hover)]'
            }`}
          >
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                isActive ? 'bg-cyan-400/15' : 'bg-[var(--surface-hover)]'
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full border ${
                  isActive
                    ? 'border-cyan-400/40 bg-cyan-400/20'
                    : 'border-blue-500/40 bg-blue-500/20'
                }`}
              />
            </div>

            <span
              className={`text-xs font-semibold ${
                isActive ? 'text-cyan-300' : 'text-[var(--foreground-muted)]'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}