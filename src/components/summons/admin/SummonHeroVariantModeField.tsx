'use client';

import type { SummonHeroVariantMode } from '@/lib/types/summon';

export default function SummonHeroVariantModeField({
  locale,
  value,
  onChange,
  disabled = false,
}: {
  locale: 'ru' | 'en';
  value: SummonHeroVariantMode;
  onChange: (value: SummonHeroVariantMode) => void;
  disabled?: boolean;
}) {
  const text = locale === 'ru'
    ? {
        label: 'Версия героя в пуле',
        original: 'Оригинальная',
        latest: 'Последний костюм',
        exact: 'Как сохранено',
        hint: 'Для каждого героя в пул попадёт только одна выбранная версия.',
        exactHint: 'Старый режим сохранён для совместимости. Выберите новый режим, чтобы объединить версии героев.',
      }
    : {
        label: 'Hero version in pool',
        original: 'Original',
        latest: 'Latest costume',
        exact: 'As saved',
        hint: 'Only one selected version of each hero will be added to the pool.',
        exactHint: 'The legacy mode is preserved for compatibility. Select a new mode to group hero versions.',
      };
  const options: Array<{ value: SummonHeroVariantMode; label: string }> = [
    { value: 'ORIGINAL', label: text.original },
    { value: 'LATEST_COSTUME', label: text.latest },
  ];
  if (value === 'EXACT') {
    options.unshift({ value: 'EXACT', label: text.exact });
  }

  return (
    <div className="space-y-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
      <div className="text-sm font-semibold text-[var(--foreground)]">{text.label}</div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={text.label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
              value === option.value
                ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-200'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:border-cyan-400/30'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--foreground-soft)]">
        {value === 'EXACT' ? text.exactHint : text.hint}
      </p>
    </div>
  );
}
