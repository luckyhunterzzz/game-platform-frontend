'use client';

import { CalendarClock, ChevronDown, ChevronLeft, ChevronRight, History, ImageIcon, RefreshCw, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import DictionaryModal from '@/components/heroes/admin/DictionaryModal';
import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantsItem,
} from '@/components/heroes/admin/PublicHeroDetailsModal';
import { useI18n } from '@/lib/i18n/i18n-context';
import type {
  SummonCalendarFeed,
  SummonHeroPreview,
  SummonPageResponse,
  SummonPublicItem,
} from '@/lib/types/summon';
import { ApiError, useApi } from '@/lib/use-api';

const PUBLIC_SUMMONS_API = '/api/v1/public/summons';
const HISTORY_PAGE_SIZE = 9;

function localizedValue(
  value: { ru?: string | null; en?: string | null } | null | undefined,
  locale: 'ru' | 'en',
  fallback = '',
) {
  const primary = locale === 'ru' ? value?.ru : value?.en;
  const secondary = locale === 'ru' ? value?.en : value?.ru;
  return primary?.trim() || secondary?.trim() || fallback;
}

function featuredHeroes(item: SummonPublicItem) {
  return item.variant.probabilities
    .filter((probability) => probability.userSelectionEnabled)
    .flatMap((probability) => probability.heroes);
}

function toHeroCard(hero: SummonHeroPreview, locale: 'ru' | 'en'): PublicHeroCardItem {
  return {
    id: hero.id,
    slug: hero.slug,
    name: localizedValue(hero.nameJson, locale, hero.slug),
    imageUrl: hero.previewUrl ?? null,
    previewUrl: hero.previewUrl ?? null,
    elementName: '',
    rarityName: '',
    rarityStars: hero.rarityStars ?? 0,
    heroClassName: '',
    manaSpeedName: '',
  };
}

function toFallbackHeroDetails(hero: SummonHeroPreview, locale: 'ru' | 'en'): PublicHeroDetailsItem {
  return {
    id: hero.id,
    slug: hero.slug,
    name: localizedValue(hero.nameJson, locale, hero.slug),
    rarity: hero.rarityStars == null ? null : { id: 0, stars: hero.rarityStars },
    passiveSkills: [],
    costumes: [],
    imageUrl: hero.previewUrl ?? null,
    previewUrl: hero.previewUrl ?? null,
  };
}

function HeroPreview({ hero, locale }: { hero: SummonHeroPreview; locale: 'ru' | 'en' }) {
  const name = localizedValue(hero.nameJson, locale, hero.slug);
  return (
    <div
      className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg border border-fuchsia-300/25 bg-black/20 shadow-sm"
      title={name}
    >
      {hero.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero.previewUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <UserRound className="h-6 w-6 text-[var(--foreground-muted)]" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function CalendarCard({
  item,
  locale,
  onOpen,
  past = false,
}: {
  item: SummonPublicItem;
  locale: 'ru' | 'en';
  onOpen: () => void;
  past?: boolean;
}) {
  const heroes = featuredHeroes(item);
  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };
  const name = localizedValue(item.nameJson, locale, item.slug);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative min-w-0 overflow-hidden rounded-[1.75rem] border bg-[var(--surface)] text-left shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-400/35 hover:shadow-[0_22px_55px_rgba(0,0,0,0.2)] ${
        past ? 'border-[var(--border)] opacity-75 hover:opacity-100' : 'border-fuchsia-400/15'
      }`}
    >
      {item.backgroundImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15 transition group-hover:opacity-25" />
      ) : null}
      <div className="relative p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-black/15">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <ImageIcon className="h-7 w-7 text-[var(--foreground-muted)]" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-[var(--foreground)]">{name}</h3>
            <div className="mt-2 flex items-start gap-2 text-xs leading-5 text-[var(--foreground-soft)]">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" aria-hidden="true" />
              <span>{formatDate(item.variant.startsAt)} — {formatDate(item.variant.endsAt)}</span>
            </div>
          </div>
        </div>

        {heroes.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {heroes.map((hero) => <HeroPreview key={hero.id} hero={hero} locale={locale} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-soft)]">
            {locale === 'ru' ? 'Рекомендованные герои пока не указаны' : 'Featured heroes are not specified yet'}
          </div>
        )}
      </div>
    </button>
  );
}

function SummonDetailsModal({
  item,
  onClose,
  onOpenHero,
}: {
  item: SummonPublicItem | null;
  onClose: () => void;
  onOpenHero: (hero: SummonHeroPreview) => void;
}) {
  const { locale } = useI18n();
  const text = locale === 'ru'
    ? {
        close: 'Закрыть',
        period: 'Период призыва',
        heroes: 'Рекомендованные герои',
        noHeroes: 'Рекомендованные герои пока не указаны.',
        probabilities: 'Вероятности',
        userChoice: 'Если пул останется пустым, пользователь выберет героев самостоятельно.',
        defaultCount: 'По умолчанию',
      }
    : {
        close: 'Close',
        period: 'Summon period',
        heroes: 'Featured heroes',
        noHeroes: 'Featured heroes are not specified yet.',
        probabilities: 'Probabilities',
        userChoice: 'If the pool stays empty, the user will select heroes later.',
        defaultCount: 'Default count',
      };

  if (!item) return null;
  const heroes = featuredHeroes(item);
  const formatDate = (value?: string | null) => value
    ? new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';

  return (
    <DictionaryModal
      open
      onClose={onClose}
      closeOnBackdropClick={false}
      closeLabel={text.close}
      maxWidthClassName="md:max-w-5xl"
      title={localizedValue(item.nameJson, locale, item.slug)}
    >
      <div className="space-y-6">
        {item.backgroundImageUrl ? (
          <div className="relative h-48 overflow-hidden rounded-2xl border border-[var(--border)] bg-black/20 md:h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.backgroundImageUrl} alt="" className="h-full w-full object-cover" />
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="absolute bottom-4 left-4 h-28 w-28 object-contain drop-shadow-2xl md:h-36 md:w-36" />
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <div className="text-sm font-semibold text-[var(--foreground)]">{text.period}</div>
          <div className="mt-2 text-sm text-[var(--foreground-soft)]">
            {formatDate(item.variant.startsAt)} — {formatDate(item.variant.endsAt)}
          </div>
          {localizedValue(item.descriptionJson, locale) ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-soft)]">
              {localizedValue(item.descriptionJson, locale)}
            </p>
          ) : null}
        </div>

        <section>
          <h4 className="mb-3 text-lg font-bold text-[var(--foreground)]">{text.heroes}</h4>
          {heroes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {heroes.map((hero) => (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => onOpenHero(hero)}
                  title={localizedValue(hero.nameJson, locale, hero.slug)}
                  className="flex w-[84px] min-w-0 flex-col items-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 text-center transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-[var(--surface-hover)]"
                >
                  <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-black/15">
                    {hero.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hero.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><UserRound className="h-6 w-6" /></div>
                    )}
                  </div>
                  <div className="mt-1.5 w-full truncate text-xs font-semibold text-[var(--foreground)]">
                    {localizedValue(hero.nameJson, locale, hero.slug)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--foreground-soft)]">
              {text.noHeroes}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-3 text-lg font-bold text-[var(--foreground)]">{text.probabilities}</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {item.variant.probabilities.map((probability) => (
              <div key={probability.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-[var(--foreground)]">
                    {localizedValue(probability.definition.nameJson, locale, probability.kind)}
                  </span>
                  <strong className="text-cyan-300">{probability.valuePercent}%</strong>
                </div>
                {probability.userSelectionEnabled && probability.heroes.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-3 text-xs leading-5 text-fuchsia-200">
                    {text.userChoice} {text.defaultCount}: {probability.defaultSelectedHeroCount ?? 2}.
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DictionaryModal>
  );
}

export default function SummonsCalendar() {
  const { apiJson } = useApi();
  const { locale } = useI18n();
  const [feed, setFeed] = useState<SummonCalendarFeed>({ current: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<SummonPageResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selected, setSelected] = useState<SummonPublicItem | null>(null);
  const [selectedHero, setSelectedHero] = useState<SummonHeroPreview | null>(null);
  const [selectedHeroCard, setSelectedHeroCard] = useState<PublicHeroCardItem | null>(null);
  const [selectedHeroDetails, setSelectedHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedHeroVariants, setSelectedHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [selectedHeroLoading, setSelectedHeroLoading] = useState(false);

  useEffect(() => {
    if (!selectedHero) {
      setSelectedHeroCard(null);
      setSelectedHeroDetails(null);
      setSelectedHeroVariants(null);
      setSelectedHeroLoading(false);
      return;
    }

    let cancelled = false;
    const fallbackDetails = toFallbackHeroDetails(selectedHero, locale);
    const fallbackCard = toHeroCard(selectedHero, locale);
    setSelectedHeroCard(fallbackCard);
    setSelectedHeroDetails(fallbackDetails);
    setSelectedHeroVariants({
      currentHero: fallbackDetails,
      baseHero: {
        id: selectedHero.id,
        slug: selectedHero.slug,
        name: fallbackDetails.name,
        imageUrl: fallbackDetails.imageUrl,
        previewUrl: fallbackDetails.previewUrl,
        rarityStars: selectedHero.rarityStars,
      },
      costumes: [],
    });
    setSelectedHeroLoading(true);

    const loadHero = async () => {
      try {
        const response = await apiJson<PublicHeroVariantsItem>(
          `${PUBLIC_SUMMONS_API}/heroes/${encodeURIComponent(selectedHero.slug)}/variants?language=${locale === 'ru' ? 'RU' : 'EN'}`,
        );
        if (cancelled) return;
        const currentHero = response.currentHero;
        setSelectedHeroDetails(currentHero);
        setSelectedHeroVariants(response);
        setSelectedHeroCard({
          id: currentHero.id,
          slug: currentHero.slug,
          name: currentHero.name,
          imageUrl: currentHero.imageUrl ?? response.baseHero?.imageUrl ?? fallbackCard.imageUrl,
          previewUrl: currentHero.previewUrl ?? response.baseHero?.previewUrl ?? fallbackCard.previewUrl,
          elementName: currentHero.element?.name ?? '',
          rarityName: '',
          rarityStars: currentHero.rarity?.stars ?? selectedHero.rarityStars ?? 0,
          heroClassName: currentHero.heroClass?.name ?? '',
          manaSpeedName: currentHero.manaSpeed?.name ?? '',
          familyName: currentHero.family?.name ?? null,
          alphaTalentName: currentHero.alphaTalent?.name ?? null,
          baseAttack: currentHero.baseAttack ?? null,
          baseArmor: currentHero.baseArmor ?? null,
          baseHp: currentHero.baseHp ?? null,
        });
      } catch {
        // Keep the lightweight preview card when full hero details are unavailable.
      } finally {
        if (!cancelled) setSelectedHeroLoading(false);
      }
    };

    void loadHero();
    return () => {
      cancelled = true;
    };
  }, [apiJson, locale, selectedHero]);

  const text = locale === 'ru'
    ? {
        current: 'Сейчас проходят',
        upcoming: 'Будущие призывы',
        history: 'Прошедшие призывы',
        loading: 'Загрузка календаря...',
        emptyTitle: 'Нет информации о призывах',
        emptyDescription: 'Когда появятся известные даты, они будут показаны здесь.',
        emptyCurrent: 'Сейчас нет активных календарных призывов.',
        emptyUpcoming: 'Будущие призывы пока не добавлены.',
        emptyHistory: 'Прошедших призывов пока нет.',
        retry: 'Повторить',
        previous: 'Назад',
        next: 'Дальше',
      }
    : {
        current: 'Active now',
        upcoming: 'Upcoming summons',
        history: 'Past summons',
        loading: 'Loading calendar...',
        emptyTitle: 'No summon information',
        emptyDescription: 'Known dates will appear here when they are available.',
        emptyCurrent: 'There are no active calendar summons now.',
        emptyUpcoming: 'No upcoming summons have been added yet.',
        emptyHistory: 'There are no past summons yet.',
        retry: 'Retry',
        previous: 'Previous',
        next: 'Next',
      };

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setFeed(await apiJson<SummonCalendarFeed>(`${PUBLIC_SUMMONS_API}/calendar`));
    } catch (loadError) {
      setError(loadError instanceof ApiError || loadError instanceof Error ? loadError.message : text.emptyTitle);
    } finally {
      setLoading(false);
    }
  }, [apiJson, text.emptyTitle]);

  const loadHistory = useCallback(async (page: number) => {
    try {
      setHistoryLoading(true);
      setError(null);
      const response = await apiJson<SummonPageResponse>(
        `${PUBLIC_SUMMONS_API}/calendar/history?page=${page}&size=${HISTORY_PAGE_SIZE}`,
      );
      setHistory(response);
      setHistoryPage(response.page);
    } catch (loadError) {
      setError(loadError instanceof ApiError || loadError instanceof Error ? loadError.message : text.emptyTitle);
    } finally {
      setHistoryLoading(false);
    }
  }, [apiJson, text.emptyTitle]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const openHistory = () => {
    const nextOpen = !historyOpen;
    setHistoryOpen(nextOpen);
    if (nextOpen && !history) void loadHistory(0);
  };

  if (loading) {
    return <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--foreground-soft)]">{text.loading}</div>;
  }

  if (error && feed.current.length === 0 && feed.upcoming.length === 0 && !history) {
    return (
      <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-8 text-center text-sm text-red-300">
        <div>{error}</div>
        <button type="button" onClick={() => void loadFeed()} className="mt-4 inline-flex items-center gap-2 font-semibold">
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> {text.retry}
        </button>
      </div>
    );
  }

  const noCurrentOrUpcoming = feed.current.length === 0 && feed.upcoming.length === 0;

  return (
    <div className="space-y-8">
      {noCurrentOrUpcoming ? (
        <section className="rounded-[2rem] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center md:p-12">
          <CalendarClock className="mx-auto h-10 w-10 text-fuchsia-300" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold text-[var(--foreground)]">{text.emptyTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-soft)]">{text.emptyDescription}</p>
        </section>
      ) : null}

      {feed.current.length > 0 ? (
        <section>
          <h2 className="mb-4 text-2xl font-black text-[var(--foreground)]">{text.current}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {feed.current.map((item) => (
              <CalendarCard key={item.variant.id} item={item} locale={locale} onOpen={() => setSelected(item)} />
            ))}
          </div>
        </section>
      ) : noCurrentOrUpcoming ? null : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--foreground-soft)]">{text.emptyCurrent}</div>
      )}

      {feed.upcoming.length > 0 ? (
        <section>
          <h2 className="mb-4 text-2xl font-black text-[var(--foreground)]">{text.upcoming}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {feed.upcoming.map((item) => (
              <CalendarCard key={item.variant.id} item={item} locale={locale} onOpen={() => setSelected(item)} />
            ))}
          </div>
        </section>
      ) : noCurrentOrUpcoming ? null : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--foreground-soft)]">{text.emptyUpcoming}</div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <button
          type="button"
          onClick={openHistory}
          className="flex w-full items-center justify-between gap-4 p-5 text-left md:p-6"
        >
          <span className="flex items-center gap-3 text-xl font-bold text-[var(--foreground)]">
            <History className="h-5 w-5 text-[var(--foreground-muted)]" aria-hidden="true" />
            {text.history}
          </span>
          <ChevronDown className={`h-5 w-5 transition ${historyOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {historyOpen ? (
          <div className="border-t border-[var(--border)] p-5 md:p-6">
            {historyLoading ? (
              <div className="text-sm text-[var(--foreground-soft)]">{text.loading}</div>
            ) : history?.items.length ? (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  {history.items.map((item) => (
                    <CalendarCard key={item.variant.id} item={item} locale={locale} onOpen={() => setSelected(item)} past />
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void loadHistory(historyPage - 1)}
                    disabled={historyPage === 0 || historyLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> {text.previous}
                  </button>
                  <span className="text-xs text-[var(--foreground-muted)]">{historyPage + 1} / {Math.max(history.totalPages, 1)}</span>
                  <button
                    type="button"
                    onClick={() => void loadHistory(historyPage + 1)}
                    disabled={!history.hasNext || historyLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
                  >
                    {text.next} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-[var(--foreground-soft)]">{text.emptyHistory}</div>
            )}
          </div>
        ) : null}
      </section>

      <SummonDetailsModal
        item={selected}
        onClose={() => {
          setSelected(null);
          setSelectedHero(null);
        }}
        onOpenHero={setSelectedHero}
      />

      <PublicHeroDetailsModal
        open={selectedHero !== null}
        locale={locale === 'ru' ? 'RU' : 'EN'}
        includeDrafts
        heroCard={selectedHeroCard}
        heroDetails={selectedHeroDetails}
        heroVariants={selectedHeroVariants}
        loading={selectedHeroLoading}
        error={null}
        onClose={() => setSelectedHero(null)}
        onOpenRelatedHero={(slug) => setSelectedHero({
          id: 0,
          slug,
          nameJson: { ru: slug, en: slug },
        })}
      />
    </div>
  );
}
