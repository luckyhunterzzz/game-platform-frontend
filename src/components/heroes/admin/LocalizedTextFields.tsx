'use client';

import type { LocalizedText } from '@/lib/types/hero';

type LocalizedTextFieldsProps = {
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  ruLabel?: string;
  enLabel?: string;
  disabled?: boolean;
  showValidation?: boolean;
};

export default function LocalizedTextFields({
  value,
  onChange,
  ruLabel = 'Название RU',
  enLabel = 'Name EN',
  disabled = false,
}: LocalizedTextFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{ruLabel}</span>
        <input
          type="text"
          value={value.ru}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) =>
            onChange({
              ...value,
              ru: event.target.value,
            })
          }
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
          placeholder="Введите значение на русском"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{enLabel}</span>
        <input
          type="text"
          value={value.en}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) =>
            onChange({
              ...value,
              en: event.target.value,
            })
          }
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
          placeholder="Enter value in English"
        />
      </label>
    </div>
  );
}
