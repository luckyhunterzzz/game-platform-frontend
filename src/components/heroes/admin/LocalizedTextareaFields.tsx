'use client';

import { useEffect, useRef } from 'react';
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
  const fieldsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = fieldsRef.current;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    let observer: ResizeObserver | null = null;
    let lastSynchronizedHeight: number | null = null;

    const stopObserving = () => {
      observer?.disconnect();
      observer = null;
      lastSynchronizedHeight = null;
    };

    const configure = () => {
      stopObserving();
      const textareas = Array.from(container?.querySelectorAll('textarea') ?? []);

      if (!mediaQuery.matches || textareas.length !== 2) {
        textareas.forEach((textarea) => {
          textarea.style.height = '';
        });
        return;
      }

      observer = new ResizeObserver((entries) => {
        const manuallyResizedEntry = entries.find(
          (entry) => lastSynchronizedHeight == null || Math.abs(entry.contentRect.height - lastSynchronizedHeight) > 1,
        );

        if (!manuallyResizedEntry) return;

        const nextHeight = manuallyResizedEntry.target.getBoundingClientRect().height;
        lastSynchronizedHeight = nextHeight;
        textareas.forEach((textarea) => {
          if (Math.abs(textarea.getBoundingClientRect().height - nextHeight) > 1) {
            textarea.style.height = `${nextHeight}px`;
          }
        });
      });

      textareas.forEach((textarea) => observer?.observe(textarea));
    };

    configure();
    mediaQuery.addEventListener('change', configure);

    return () => {
      mediaQuery.removeEventListener('change', configure);
      stopObserving();
    };
  }, []);

  return (
    <div ref={fieldsRef} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
