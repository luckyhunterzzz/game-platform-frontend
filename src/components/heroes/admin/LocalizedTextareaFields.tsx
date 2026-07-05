'use client';

import type { LocalizedText } from '@/lib/types/hero';
import MarkdownTextarea from '@/components/markdown/MarkdownTextarea';

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
}: LocalizedTextareaFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{ruLabel}</span>
        <MarkdownTextarea
          value={value.ru}
          onChange={(nextValue) =>
            onChange({
              ...value,
              ru: nextValue,
            })
          }
          rows={rows}
          disabled={disabled}
          placeholder={ruPlaceholder}
          toolbarLabels={{ linkPrompt: 'Введите URL' }}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{enLabel}</span>
        <MarkdownTextarea
          value={value.en}
          onChange={(nextValue) =>
            onChange({
              ...value,
              en: nextValue,
            })
          }
          rows={rows}
          disabled={disabled}
          placeholder={enPlaceholder}
          toolbarLabels={{ linkPrompt: 'Enter URL' }}
        />
      </label>
    </div>
  );
}
