'use client';

import { type Dispatch, type SetStateAction } from 'react';
import type { HeroLocale } from '@/lib/types/hero';
import LocalizedTextareaFields from './LocalizedTextareaFields';
import type { HeroExpertOpinionDraft, HeroExpertOpinionSourceType } from '@/lib/types/hero-expert-opinion';
import { createEmptyHeroExpertOpinionDraft } from '@/lib/types/hero-expert-opinion';

type HeroExpertOpinionsEditorProps = {
  locale: HeroLocale;
  value: HeroExpertOpinionDraft[];
  onChange: Dispatch<SetStateAction<HeroExpertOpinionDraft[]>>;
  disabled?: boolean;
  createMode?: boolean;
};

const SOURCE_TYPE_OPTIONS: Array<{ value: HeroExpertOpinionSourceType; label: Record<HeroLocale, string> }> = [
  { value: 'TELEGRAM', label: { RU: 'Telegram', EN: 'Telegram' } },
  { value: 'VK', label: { RU: 'VK', EN: 'VK' } },
  { value: 'FORUM', label: { RU: 'Forum', EN: 'Forum' } },
  { value: 'YOUTUBE', label: { RU: 'YouTube', EN: 'YouTube' } },
];

export default function HeroExpertOpinionsEditor({
  locale,
  value,
  onChange,
  disabled = false,
  createMode = false,
}: HeroExpertOpinionsEditorProps) {
  const t =
    locale === 'RU'
      ? {
          title: 'Мнения авторитетных игроков',
          subtitleCreate: 'Можно подготовить мнения заранее. Они сохранятся сразу после создания героя.',
          subtitleEdit: 'Добавляйте, редактируйте и скрывайте мнения по этому герою.',
          empty: 'Мнения пока не добавлены',
          add: 'Добавить мнение',
          remove: 'Удалить',
          author: 'Автор',
          sourceTitle: 'Название источника',
          sourceUrl: 'Ссылка на источник',
          sourceType: 'Тип источника',
          sourceTypeEmpty: 'Не выбран',
          published: 'Опубликовано',
          publishedAt: 'Дата публикации',
          contentRu: 'Текст мнения RU',
          contentEn: 'Opinion text EN',
          authorPlaceholder: 'Например, Goodwin',
          sourceTitlePlaceholder: 'Например, Hero of the world',
          sourceUrlPlaceholder: 'https://...',
          publishedHint: 'В public modal будут показаны только опубликованные мнения.',
          cardTitle: (index: number) => `Мнение ${index + 1}`,
        }
      : {
          title: 'Expert opinions',
          subtitleCreate: 'You can prepare opinions now. They will be saved right after the hero is created.',
          subtitleEdit: 'Add, edit, and hide opinions for this hero.',
          empty: 'No expert opinions yet',
          add: 'Add opinion',
          remove: 'Remove',
          author: 'Author',
          sourceTitle: 'Source title',
          sourceUrl: 'Source URL',
          sourceType: 'Source type',
          sourceTypeEmpty: 'Not selected',
          published: 'Published',
          publishedAt: 'Published date',
          contentRu: 'Opinion text RU',
          contentEn: 'Opinion text EN',
          authorPlaceholder: 'For example, Goodwin',
          sourceTitlePlaceholder: 'For example, Hero of the world',
          sourceUrlPlaceholder: 'https://...',
          publishedHint: 'Only published opinions will be visible in the public modal.',
          cardTitle: (index: number) => `Opinion ${index + 1}`,
        };

  const updateItem = (localId: string, updater: (item: HeroExpertOpinionDraft) => HeroExpertOpinionDraft) => {
    onChange((prev) => prev.map((item) => (item.localId === localId ? updater(item) : item)));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t.title}</div>
          <div className="text-xs leading-5 text-[var(--foreground-muted)]">
            {createMode ? t.subtitleCreate : t.subtitleEdit}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange((prev) => [...prev, createEmptyHeroExpertOpinionDraft()])}
          disabled={disabled}
          className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.add}
        </button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--foreground-soft)]">
          {t.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((item, index) => (
            <div key={item.localId} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--foreground)]">{t.cardTitle(index)}</div>
                <button
                  type="button"
                  onClick={() => onChange((prev) => prev.filter((entry) => entry.localId !== item.localId))}
                  disabled={disabled}
                  className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.remove}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.author}</span>
                  <input
                    type="text"
                    value={item.authorName}
                    disabled={disabled}
                    onChange={(event) =>
                      updateItem(item.localId, (current) => ({ ...current, authorName: event.target.value }))
                    }
                    placeholder={t.authorPlaceholder}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.sourceTitle}</span>
                  <input
                    type="text"
                    value={item.sourceTitle}
                    disabled={disabled}
                    onChange={(event) =>
                      updateItem(item.localId, (current) => ({ ...current, sourceTitle: event.target.value }))
                    }
                    placeholder={t.sourceTitlePlaceholder}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.sourceUrl}</span>
                  <input
                    type="url"
                    value={item.sourceUrl}
                    disabled={disabled}
                    onChange={(event) =>
                      updateItem(item.localId, (current) => ({ ...current, sourceUrl: event.target.value }))
                    }
                    placeholder={t.sourceUrlPlaceholder}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.sourceType}</span>
                  <select
                    value={item.sourceType}
                    disabled={disabled}
                    onChange={(event) =>
                      updateItem(item.localId, (current) => ({
                        ...current,
                        sourceType: event.target.value as HeroExpertOpinionSourceType | '',
                      }))
                    }
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  >
                    <option value="">{t.sourceTypeEmpty}</option>
                    {SOURCE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label[locale]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.publishedAt}</span>
                  <input
                    type="date"
                    value={item.publishedAt}
                    disabled={disabled}
                    onChange={(event) =>
                      updateItem(item.localId, (current) => ({ ...current, publishedAt: event.target.value }))
                    }
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={item.isPublished}
                  disabled={disabled}
                  onChange={(event) =>
                    updateItem(item.localId, (current) => ({ ...current, isPublished: event.target.checked }))
                  }
                />
                <span className="text-sm text-[var(--foreground-soft)]">{t.published}</span>
              </label>

              <div className="text-xs leading-5 text-[var(--foreground-muted)]">{t.publishedHint}</div>

              <LocalizedTextareaFields
                value={item.content}
                onChange={(nextValue) =>
                  updateItem(item.localId, (current) => ({ ...current, content: nextValue }))
                }
                ruLabel={t.contentRu}
                enLabel={t.contentEn}
                rows={5}
                showValidation={false}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
