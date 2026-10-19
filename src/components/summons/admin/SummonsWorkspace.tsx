'use client';

import { CalendarClock, ImageIcon, Pencil, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/lib/i18n/i18n-context';
import type {
  SummonAdminDetails,
  SummonAdminSummary,
  SummonVariant,
} from '@/lib/types/summon';
import { ApiError, useApi } from '@/lib/use-api';

import CreateSummonModal from './CreateSummonModal';

const ADMIN_SUMMONS_API = '/api/v1/admin/summons';

function getLocalizedValue(
  value: { ru?: string | null; en?: string | null } | null | undefined,
  locale: 'ru' | 'en',
  fallback = '',
) {
  const primary = locale === 'ru' ? value?.ru : value?.en;
  const secondary = locale === 'ru' ? value?.en : value?.ru;
  return primary?.trim() || secondary?.trim() || fallback;
}

export default function SummonsWorkspace() {
  const { apiJson } = useApi();
  const { locale } = useI18n();
  const [items, setItems] = useState<SummonAdminSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<SummonAdminDetails | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingSummon, setEditingSummon] = useState<SummonAdminDetails | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const text = useMemo(
    () =>
      locale === 'ru'
        ? {
            create: 'Создать призыв',
            createHint: 'Создайте основу призыва, добавьте вероятности и распределите героев.',
            created: 'Призыв успешно создан.',
            updatedSuccessfully: 'Изменения призыва сохранены.',
            edit: 'Редактировать',
            listTitle: 'Созданные призывы',
            listHint: 'Выберите призыв, чтобы посмотреть его полную конфигурацию.',
            loading: 'Загрузка призывов...',
            loadingDetails: 'Загрузка конфигурации...',
            loadError: 'Не удалось загрузить призывы.',
            retry: 'Повторить',
            empty: 'Призывы пока не созданы.',
            select: 'Выберите призыв слева.',
            portalImage: 'Изображение портала',
            backgroundImage: 'Фоновое изображение',
            noImage: 'Изображение не загружено',
            defaultVariant: 'Основной вариант',
            scheduledVariants: 'Запланированные варианты',
            noScheduledVariants: 'Запланированных вариантов пока нет.',
            probabilities: 'Вероятности',
            bonusRules: 'Бонусные правила',
            heroes: 'героев',
            period: 'Период',
            noProbabilities: 'Вероятности пока не настроены.',
            noBonusRules: 'Бонусные правила пока не настроены.',
            updated: 'Обновлён',
          }
        : {
            create: 'Create summon',
            createHint: 'Create the summon, add probabilities, and assign heroes.',
            created: 'Summon created successfully.',
            updatedSuccessfully: 'Summon changes saved.',
            edit: 'Edit',
            listTitle: 'Created summons',
            listHint: 'Select a summon to view its full configuration.',
            loading: 'Loading summons...',
            loadingDetails: 'Loading configuration...',
            loadError: 'Failed to load summons.',
            retry: 'Retry',
            empty: 'No summons have been created yet.',
            select: 'Select a summon on the left.',
            portalImage: 'Portal image',
            backgroundImage: 'Background image',
            noImage: 'No image uploaded',
            defaultVariant: 'Default variant',
            scheduledVariants: 'Scheduled variants',
            noScheduledVariants: 'No scheduled variants yet.',
            probabilities: 'Probabilities',
            bonusRules: 'Bonus rules',
            heroes: 'heroes',
            period: 'Period',
            noProbabilities: 'No probabilities configured yet.',
            noBonusRules: 'No bonus rules configured yet.',
            updated: 'Updated',
          },
    [locale],
  );

  const formatDate = useCallback(
    (value?: string | null) => {
      if (!value) return '—';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    },
    [locale],
  );

  const formatPercent = useCallback(
    (value: number) =>
      new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        maximumFractionDigits: 2,
      }).format(value),
    [locale],
  );

  const loadCatalog = useCallback(async (preferredId?: string) => {
    try {
      setLoadingCatalog(true);
      setCatalogError(null);
      const response = await apiJson<SummonAdminSummary[]>(ADMIN_SUMMONS_API);
      setItems(response);
      setSelectedId((current) => {
        if (preferredId && response.some((item) => item.id === preferredId)) {
          return preferredId;
        }
        if (current && response.some((item) => item.id === current)) {
          return current;
        }
        return response[0]?.id ?? null;
      });
    } catch (error) {
      setCatalogError(error instanceof ApiError || error instanceof Error ? error.message : text.loadError);
    } finally {
      setLoadingCatalog(false);
    }
  }, [apiJson, text.loadError]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleSaved = (saved: SummonAdminDetails) => {
    setSuccessMessage(editingSummon ? text.updatedSuccessfully : text.created);
    setDetails(saved);
    setSelectedId(saved.id);
    void loadCatalog(saved.id);
  };

  useEffect(() => {
    if (!selectedId) {
      setDetails(null);
      setDetailsError(null);
      return;
    }

    let cancelled = false;

    const loadDetails = async () => {
      try {
        setLoadingDetails(true);
        setDetailsError(null);
        const response = await apiJson<SummonAdminDetails>(`${ADMIN_SUMMONS_API}/${selectedId}`);
        if (!cancelled) {
          setDetails(response);
        }
      } catch (error) {
        if (!cancelled) {
          setDetails(null);
          setDetailsError(error instanceof ApiError || error instanceof Error ? error.message : text.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoadingDetails(false);
        }
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [apiJson, selectedId, text.loadError]);

  const renderVariant = (variant: SummonVariant, title: string) => (
    <article key={variant.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-[var(--foreground)]">{title}</h4>
          {variant.variantType === 'SCHEDULED' ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-soft)]">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              <span>
                {text.period}: {formatDate(variant.startsAt)} — {formatDate(variant.endsAt)}
              </span>
            </div>
          ) : null}
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          {variant.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{text.probabilities}</div>
          {variant.probabilities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--foreground-soft)]">
              {text.noProbabilities}
            </div>
          ) : (
            <div className="space-y-2">
              {variant.probabilities.map((probability) => (
                <div key={probability.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium text-[var(--foreground)]">
                      {getLocalizedValue(probability.definition.nameJson, locale, probability.kind)}
                    </div>
                    <div className="shrink-0 text-sm font-bold text-cyan-300">
                      {formatPercent(probability.valuePercent)}%
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[var(--foreground-soft)]">
                    {probability.kind} · {probability.heroIds.length} {text.heroes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{text.bonusRules}</div>
          {variant.bonusRules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--foreground-soft)]">
              {text.noBonusRules}
            </div>
          ) : (
            <div className="space-y-2">
              {variant.bonusRules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="text-sm font-medium text-[var(--foreground)]">
                    {getLocalizedValue(rule.definition.nameJson, locale, rule.kind)}
                  </div>
                  <div className="mt-2 text-xs text-[var(--foreground-soft)]">
                    {rule.kind} · {rule.steps.length} {locale === 'ru' ? 'шагов' : 'steps'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">{text.listTitle}</div>
          <p className="mt-1 text-xs text-[var(--foreground-soft)]">{text.createHint}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccessMessage(null);
            setEditingSummon(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-400/15"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {text.create}
        </button>
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {catalogError ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <span>{catalogError}</span>
          <button type="button" onClick={() => void loadCatalog()} className="inline-flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {text.retry}
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-semibold text-[var(--foreground)]">{text.listTitle}</div>
            <div className="mt-1 text-xs text-[var(--foreground-soft)]">{text.listHint}</div>
          </div>

          {loadingCatalog ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground-soft)]">
              {text.loading}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--foreground-soft)]">
              {text.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const active = selectedId === item.id;
                const name = getLocalizedValue(item.nameJson, locale, item.slug);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? 'border-fuchsia-400/40 bg-fuchsia-400/10'
                        : 'border-[var(--border)] bg-[var(--surface-strong)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-[var(--foreground-muted)]" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</div>
                        <div className="mt-1 truncate text-xs text-[var(--foreground-soft)]">{item.slug}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-[var(--foreground-muted)]">
                      <span>{item.status}</span>
                      <span>{formatDate(item.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="min-w-0 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
          {loadingDetails ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6 text-sm text-[var(--foreground-soft)]">
              {text.loadingDetails}
            </div>
          ) : detailsError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-300">
              {detailsError}
            </div>
          ) : !details ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {text.select}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--foreground)]">
                    {getLocalizedValue(details.nameJson, locale, details.slug)}
                  </h3>
                  <div className="mt-2 text-sm text-[var(--foreground-soft)]">{details.slug}</div>
                  <div className="mt-3 text-xs text-[var(--foreground-muted)]">
                    {text.updated}: {formatDate(details.updatedAt)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMessage(null);
                      setEditingSummon(details);
                      setCreateModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    {text.edit}
                  </button>
                  <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                    {details.status}
                  </span>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-soft)]">
                {getLocalizedValue(details.descriptionJson, locale)}
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: text.portalImage, url: details.imageUrl },
                  { label: text.backgroundImage, url: details.backgroundImageUrl },
                ].map((image) => (
                  <div key={image.label} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                    <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                      {image.label}
                    </div>
                    {image.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.url} alt={image.label} className="h-52 w-full object-contain bg-black/10" />
                    ) : (
                      <div className="flex h-52 items-center justify-center text-sm text-[var(--foreground-soft)]">
                        {text.noImage}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {renderVariant(details.defaultVariant, text.defaultVariant)}

              <div>
                <h3 className="mb-3 text-xl font-bold text-[var(--foreground)]">{text.scheduledVariants}</h3>
                {details.scheduledVariants?.length ? (
                  <div className="space-y-4">
                    {details.scheduledVariants.map((variant, index) =>
                      renderVariant(variant, `${text.scheduledVariants} #${index + 1}`),
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--foreground-soft)]">
                    {text.noScheduledVariants}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <CreateSummonModal
        open={createModalOpen}
        summon={editingSummon}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingSummon(null);
        }}
        onSaved={handleSaved}
      />
    </section>
  );
}
