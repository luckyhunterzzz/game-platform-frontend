'use client';

import { isCyrillicText, isLatinText, type LocalizedText } from '@/lib/types/hero';

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
  showValidation = true,
}: LocalizedTextFieldsProps) {
  const ruHasValue = value.ru.trim().length > 0;
  const enHasValue = value.en.trim().length > 0;

  const ruError =
    showValidation && ruHasValue && !isCyrillicText(value.ru)
      ? 'Допустима кириллица'
      : '';

  const enError =
    showValidation && enHasValue && !isLatinText(value.en)
      ? 'Latin characters only'
      : '';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">
          {ruLabel}
        </span>
        <input
          type="text"
          value={value.ru}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...value,
              ru: e.target.value,
            })
          }
          className={`rounded-xl border bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition ${
            ruError
              ? 'border-red-400/50'
              : 'border-[var(--border)] focus:border-cyan-400/40'
          }`}
          placeholder="Введите значение на русском"
        />
        {ruError && <span className="text-xs text-red-300">{ruError}</span>}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">
          {enLabel}
        </span>
        <input
          type="text"
          value={value.en}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...value,
              en: e.target.value,
            })
          }
          className={`rounded-xl border bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition ${
            enError
              ? 'border-red-400/50'
              : 'border-[var(--border)] focus:border-cyan-400/40'
          }`}
          placeholder="Enter value in English"
        />
        {enError && <span className="text-xs text-red-300">{enError}</span>}
      </label>
    </div>
  );
}