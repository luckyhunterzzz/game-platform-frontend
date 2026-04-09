'use client';

import { isFlexibleCyrillicText, isFlexibleLatinText, type LocalizedText } from '@/lib/types/hero';

type LocalizedTextareaFieldsProps = {
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  ruLabel?: string;
  enLabel?: string;
  disabled?: boolean;
  ruPlaceholder?: string;
  enPlaceholder?: string;
  rows?: number;
  showValidation?: boolean;
};

export default function LocalizedTextareaFields({
  value,
  onChange,
  ruLabel = 'Описание RU',
  enLabel = 'Description EN',
  disabled = false,
  ruPlaceholder = 'Введите текст на русском',
  enPlaceholder = 'Enter text in English',
  rows = 4,
  showValidation = true,
}: LocalizedTextareaFieldsProps) {
  const ruHasValue = value.ru.trim().length > 0;
  const enHasValue = value.en.trim().length > 0;

  const ruError =
    showValidation && ruHasValue && !isFlexibleCyrillicText(value.ru)
      ? 'Допустима кириллица'
      : '';

  const enError =
    showValidation && enHasValue && !isFlexibleLatinText(value.en)
      ? 'Latin characters only'
      : '';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">
          {ruLabel}
        </span>
        <textarea
          rows={rows}
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
          placeholder={ruPlaceholder}
        />
        {ruError && <span className="text-xs text-red-300">{ruError}</span>}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">
          {enLabel}
        </span>
        <textarea
          rows={rows}
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
          placeholder={enPlaceholder}
        />
        {enError && <span className="text-xs text-red-300">{enError}</span>}
      </label>
    </div>
  );
}
