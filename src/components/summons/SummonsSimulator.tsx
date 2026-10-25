'use client';

import {
  CalendarClock,
  Check,
  ImageIcon,
  LoaderCircle,
  Search,
  Sparkles,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import DictionaryModal from '@/components/heroes/admin/DictionaryModal';
import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantsItem,
} from '@/components/heroes/admin/PublicHeroDetailsModal';
import SearchableSelectField from '@/components/heroes/admin/SearchableSelectField';
import { useI18n } from '@/lib/i18n/i18n-context';
import type {
  SummonCalendarFeed,
  SummonPublicItem,
  SummonSimulationConfig,
  SummonSimulationHero,
  SummonSimulationRequest,
  SummonSimulationResponse,
  SummonSimulationResultItem,
} from '@/lib/types/summon';
import { ApiError, useApi } from '@/lib/use-api';

const PUBLIC_SUMMONS_API = '/api/v1/public/summons';
const SESSION_STORAGE_PREFIX = 'game-platform:summon-simulator';
const PREVIEW_ROTATION_DELAY_MS = 2_200;
const BASE_REVEAL_DELAY_MS = 1_300;
const BONUS_REVEAL_DELAY_MS = 1_700;
const FIVE_STAR_HOLD_DELAY_MS = 1_000;
const BETWEEN_REVEALS_DELAY_MS = 240;
const PULL_COUNT_INTRO_DELAY_MS = 1_500;
const COMPLETION_MESSAGE_DELAY_MS = 1_500;
const RESULT_IMAGE_PRELOAD_TIMEOUT_MS = 2_500;
const BACKGROUND_IMAGE_PRELOAD_LIMIT = 24;
const IMAGE_PRELOAD_CACHE_LIMIT = 200;

const imagePreloadCache = new Map<string, Promise<void>>();

type SavedSelections = {
  probabilityHeroSelections: Record<string, number[]>;
  bonusStepHeroSelections: Record<string, number>;
  enabledBonusRuleIds: string[];
};

function localizedValue(
  value: { ru?: string | null; en?: string | null } | null | undefined,
  locale: 'ru' | 'en',
  fallback = '',
) {
  const primary = locale === 'ru' ? value?.ru : value?.en;
  const secondary = locale === 'ru' ? value?.en : value?.ru;
  return primary?.trim() || secondary?.trim() || fallback;
}

function heroImage(hero: SummonSimulationHero, locale: 'ru' | 'en') {
  return localizedValue(hero.imageUrlJson, locale, hero.previewUrl ?? '') || hero.previewUrl || '';
}

function toHeroCard(hero: SummonSimulationHero, locale: 'ru' | 'en'): PublicHeroCardItem {
  const imageUrl = heroImage(hero, locale) || null;
  return {
    id: hero.id,
    slug: hero.slug,
    name: localizedValue(hero.nameJson, locale, hero.slug),
    imageUrl,
    previewUrl: hero.previewUrl ?? imageUrl,
    elementName: '',
    rarityName: '',
    rarityStars: hero.rarityStars ?? 0,
    heroClassName: '',
    manaSpeedName: '',
  };
}

function toFallbackHeroDetails(hero: SummonSimulationHero, locale: 'ru' | 'en'): PublicHeroDetailsItem {
  return {
    id: hero.id,
    slug: hero.slug,
    name: localizedValue(hero.nameJson, locale, hero.slug),
    rarity: hero.rarityStars == null ? null : { id: 0, stars: hero.rarityStars },
    passiveSkills: [],
    costumes: [],
    imageUrl: heroImage(hero, locale) || null,
    previewUrl: hero.previewUrl ?? null,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function preloadImage(url: string) {
  const cached = imagePreloadCache.get(url);
  if (cached) return cached;

  const promise = new Promise<void>((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
    if (image.complete) resolve();
  });
  if (imagePreloadCache.size >= IMAGE_PRELOAD_CACHE_LIMIT) {
    const oldestUrl = imagePreloadCache.keys().next().value;
    if (oldestUrl) imagePreloadCache.delete(oldestUrl);
  }
  imagePreloadCache.set(url, promise);
  return promise;
}

async function preloadImages(urls: string[], timeoutMs?: number) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  if (uniqueUrls.length === 0) return;
  const loading = Promise.allSettled(uniqueUrls.map(preloadImage));
  if (timeoutMs === undefined) {
    await loading;
    return;
  }
  await Promise.race([loading, wait(timeoutMs)]);
}

function SummonChoiceCard({
  item,
  locale,
  temporary,
  onClick,
}: {
  item: SummonPublicItem;
  locale: 'ru' | 'en';
  temporary: boolean;
  onClick: () => void;
}) {
  const formatDate = (value?: string | null) => value
    ? new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        day: '2-digit',
        month: 'short',
      }).format(new Date(value))
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-48 overflow-hidden rounded-[1.75rem] border border-fuchsia-400/15 bg-[var(--surface)] text-left shadow-sm transition hover:-translate-y-1 hover:border-fuchsia-400/40 hover:shadow-[0_24px_65px_rgba(0,0,0,0.24)]"
    >
      {item.backgroundImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.backgroundImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20 transition duration-500 group-hover:scale-105 group-hover:opacity-30"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
      <div className="relative flex h-full items-center gap-5 p-5">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/25">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-8 w-8 text-white/50" />
          )}
        </div>
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-fuchsia-300/30 bg-fuchsia-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">
            {temporary
              ? (locale === 'ru' ? 'Временный' : 'Temporary')
              : (locale === 'ru' ? 'Базовый' : 'Base')}
          </span>
          <h3 className="mt-3 text-xl font-black text-white">
            {localizedValue(item.nameJson, locale, item.slug)}
          </h3>
          {temporary ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
              <CalendarClock className="h-4 w-4" />
              {formatDate(item.variant.startsAt)} — {formatDate(item.variant.endsAt)}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function HeroTile({
  hero,
  locale,
  selected = false,
  onClick,
}: {
  hero: SummonSimulationHero;
  locale: 'ru' | 'en';
  selected?: boolean;
  onClick?: () => void;
}) {
  const name = localizedValue(hero.nameJson, locale, hero.slug);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative flex min-w-0 flex-col items-center overflow-hidden rounded-lg border p-1.5 text-center transition ${
        selected
          ? 'border-cyan-300 bg-cyan-400/15 shadow-[0_0_28px_rgba(34,211,238,0.18)]'
          : 'border-[var(--border)] bg-black/15 hover:border-fuchsia-300/40'
      }`}
    >
      <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-black/25">
        {hero.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.previewUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center"><UserRound /></div>
        )}
      </div>
      <div className="mt-1 w-full min-w-0">
        <div className="truncate text-[10px] font-semibold leading-tight text-[var(--foreground)]">{name}</div>
        <div className="mt-0.5 truncate text-[9px] leading-tight text-[var(--foreground-muted)]">{hero.slug}</div>
      </div>
      {selected ? (
        <span className="absolute right-3 top-3 rounded-full bg-cyan-300 p-1 text-slate-950">
          <Check className="h-3 w-3" />
        </span>
      ) : null}
    </button>
  );
}

function SelectedHeroPreview({
  hero,
  locale,
  removeLabel,
  onOpen,
  onRemove,
}: {
  hero: SummonSimulationHero;
  locale: 'ru' | 'en';
  removeLabel: string;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const name = localizedValue(hero.nameJson, locale, hero.slug);

  return (
    <div className="group relative w-16 rounded-xl border border-cyan-300/45 bg-cyan-400/10 p-1.5 text-left transition hover:border-cyan-200/70">
      <button type="button" onClick={onOpen} className="block w-full text-left" title={name}>
        <div className="aspect-square overflow-hidden rounded-lg bg-black/25">
          {hero.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.previewUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><UserRound className="h-4 w-4" /></div>
          )}
        </div>
        <div className="mt-1 truncate text-[9px] font-semibold leading-tight text-[var(--foreground)]">{name}</div>
      </button>
      <button
        type="button"
        onClick={onRemove}
        title={`${removeLabel}: ${name}`}
        aria-label={`${removeLabel}: ${name}`}
        className="absolute -right-1.5 -top-1.5 rounded-full bg-cyan-200 p-0.5 text-slate-950 transition hover:bg-red-300"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

export default function SummonsSimulator() {
  const { apiJson, apiPostJson } = useApi();
  const { locale } = useI18n();
  const [baseSummons, setBaseSummons] = useState<SummonPublicItem[]>([]);
  const [temporarySummons, setTemporarySummons] = useState<SummonPublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SummonPublicItem | null>(null);
  const [config, setConfig] = useState<SummonSimulationConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [probabilitySelections, setProbabilitySelections] = useState<Record<string, number[]>>({});
  const [stepSelections, setStepSelections] = useState<Record<string, number>>({});
  const [enabledRuleIds, setEnabledRuleIds] = useState<string[]>([]);
  const [heroSearch, setHeroSearch] = useState('');
  const [deckIndex, setDeckIndex] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [introPullCount, setIntroPullCount] = useState<1 | 10 | 30 | null>(null);
  const [simulationPullCount, setSimulationPullCount] = useState<1 | 10 | 30 | null>(null);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [activeResult, setActiveResult] = useState<SummonSimulationResultItem | null>(null);
  const [revealedResults, setRevealedResults] = useState<SummonSimulationResultItem[]>([]);
  const [simulationFinished, setSimulationFinished] = useState(false);
  const [selectedHero, setSelectedHero] = useState<SummonSimulationHero | null>(null);
  const [selectedHeroCard, setSelectedHeroCard] = useState<PublicHeroCardItem | null>(null);
  const [selectedHeroDetails, setSelectedHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedHeroVariants, setSelectedHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [selectedHeroLoading, setSelectedHeroLoading] = useState(false);
  const [selectedHeroError, setSelectedHeroError] = useState<string | null>(null);
  const animationRunRef = useRef(0);

  const text = locale === 'ru'
    ? {
        base: 'Базовые призывы',
        temporary: 'Временные призывы',
        empty: 'Доступных призывов пока нет.',
        loading: 'Загрузка призывов...',
        close: 'Закрыть',
        settings: 'Настройки призыва',
        recommended: 'Выберите рекомендованных героев',
        recommendedHint: 'Можно выбрать от 1 до 10 героев 5★.',
        selectBonusHero: 'Выберите бонусного героя',
        optionalBonuses: 'Дополнительные бонусы',
        result: 'Результат',
        bonusRound: 'Бонусный раунд',
        search: 'Найти героя по имени или slug',
        noHeroesFound: 'Герои не найдены.',
        availableHeroes: 'Доступные герои',
        selectedHeroes: 'Выбранные герои',
        removeHero: 'Убрать героя',
        clearSearch: 'Очистить поиск',
        emptySelection: 'Не выбрано',
        selected: 'Выбрано',
        required: 'Сначала выберите всех обязательных героев.',
        calculating: 'Расчёт призыва...',
        noImage: 'Нет изображения героя',
        heroDetailsError: 'Не удалось загрузить полную карточку героя.',
        done: 'Завершено',
      }
    : {
        base: 'Base summons',
        temporary: 'Temporary summons',
        empty: 'There are no available summons yet.',
        loading: 'Loading summons...',
        close: 'Close',
        settings: 'Summon settings',
        recommended: 'Select featured heroes',
        recommendedHint: 'Select from 1 to 10 five-star heroes.',
        selectBonusHero: 'Select a bonus hero',
        optionalBonuses: 'Optional bonuses',
        result: 'Result',
        bonusRound: 'Bonus Round',
        search: 'Find a hero by name or slug',
        noHeroesFound: 'No heroes found.',
        availableHeroes: 'Available heroes',
        selectedHeroes: 'Selected heroes',
        removeHero: 'Remove hero',
        clearSearch: 'Clear search',
        emptySelection: 'Not selected',
        selected: 'Selected',
        required: 'Select all required heroes first.',
        calculating: 'Calculating summons...',
        noImage: 'Hero image is not available',
        heroDetailsError: 'Failed to load full hero details.',
        done: 'Done',
      };

  const loadSummons = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [base, calendar] = await Promise.all([
        apiJson<SummonPublicItem[]>(PUBLIC_SUMMONS_API),
        apiJson<SummonCalendarFeed>(`${PUBLIC_SUMMONS_API}/calendar`),
      ]);
      setBaseSummons(base);
      setTemporarySummons([...calendar.current, ...calendar.upcoming]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : text.empty);
    } finally {
      setLoading(false);
    }
  }, [apiJson, text.empty]);

  useEffect(() => {
    void loadSummons();
  }, [loadSummons]);

  useEffect(() => {
    if (!selectedHero) {
      setSelectedHeroCard(null);
      setSelectedHeroDetails(null);
      setSelectedHeroVariants(null);
      setSelectedHeroLoading(false);
      setSelectedHeroError(null);
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
    setSelectedHeroError(null);

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
        if (!cancelled) setSelectedHeroError(null);
      } finally {
        if (!cancelled) setSelectedHeroLoading(false);
      }
    };

    void loadHero();
    return () => {
      cancelled = true;
    };
  }, [apiJson, locale, selectedHero]);

  const initializeSelections = useCallback((nextConfig: SummonSimulationConfig) => {
    const storageKey = `${SESSION_STORAGE_PREFIX}:${nextConfig.variantId}:${nextConfig.variantVersion}`;
    let saved: SavedSelections | null = null;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      saved = raw ? JSON.parse(raw) as SavedSelections : null;
    } catch {
      saved = null;
    }

    const allowedHeroIds = new Set(nextConfig.selectableFiveStarHeroes.map((hero) => hero.id));
    const nextProbabilitySelections: Record<string, number[]> = {};
    nextConfig.probabilities
      .filter((probability) => probability.userSelectionEnabled)
      .forEach((probability) => {
        if (probability.configuredHeroes.length > 0) {
          nextProbabilitySelections[probability.id] = probability.configuredHeroes
            .map((hero) => hero.id)
            .slice(0, 10);
          return;
        }
        const savedIds = saved?.probabilityHeroSelections?.[probability.id]
          ?.filter((heroId) => allowedHeroIds.has(heroId))
          .slice(0, 10);
        nextProbabilitySelections[probability.id] = savedIds?.length
          ? savedIds
          : [];
      });

    const nextEnabledRuleIds: string[] = [];
    const activeRuleIds = new Set([
      ...nextConfig.bonusRules.filter((rule) => !rule.userSelectable).map((rule) => rule.id),
      ...nextEnabledRuleIds,
    ]);
    const allowedStepIds = new Set(
      nextConfig.bonusRules
        .filter((rule) => activeRuleIds.has(rule.id))
        .flatMap((rule) => rule.steps)
        .filter((step) => step.userHeroSelectionEnabled)
        .map((step) => step.id),
    );
    const nextStepSelections = Object.fromEntries(
      Object.entries(saved?.bonusStepHeroSelections ?? {})
        .filter(([stepId, heroId]) => allowedStepIds.has(stepId) && allowedHeroIds.has(heroId)),
    );

    setProbabilitySelections(nextProbabilitySelections);
    setStepSelections(nextStepSelections);
    setEnabledRuleIds(nextEnabledRuleIds);
  }, []);

  const openSummon = async (item: SummonPublicItem) => {
    animationRunRef.current += 1;
    setSelectedItem(item);
    setConfig(null);
    setModalError(null);
    setRevealedResults([]);
    setActiveResult(null);
    setSimulationFinished(false);
    setIntroPullCount(null);
    setSimulationPullCount(null);
    setCompletionVisible(false);
    setSelectedHero(null);
    setHeroSearch('');
    setConfigLoading(true);
    try {
      const nextConfig = await apiJson<SummonSimulationConfig>(
        `${PUBLIC_SUMMONS_API}/${item.id}/variants/${item.variant.id}/simulation-config`,
      );
      setConfig(nextConfig);
      initializeSelections(nextConfig);
    } catch (error) {
      setModalError(error instanceof ApiError || error instanceof Error ? error.message : text.empty);
    } finally {
      setConfigLoading(false);
    }
  };

  const closeModal = () => {
    animationRunRef.current += 1;
    setSelectedItem(null);
    setConfig(null);
    setActiveResult(null);
    setRevealedResults([]);
    setSimulationFinished(false);
    setSimulating(false);
    setIntroPullCount(null);
    setSimulationPullCount(null);
    setCompletionVisible(false);
    setSelectedHero(null);
    setHeroSearch('');
  };

  useEffect(() => {
    if (!config) return;
    const storageKey = `${SESSION_STORAGE_PREFIX}:${config.variantId}:${config.variantVersion}`;
    const payload: SavedSelections = {
      probabilityHeroSelections: probabilitySelections,
      bonusStepHeroSelections: stepSelections,
      enabledBonusRuleIds: enabledRuleIds,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
  }, [config, enabledRuleIds, probabilitySelections, stepSelections]);

  const selectedHeroById = useMemo(
    () => new Map(config?.selectableFiveStarHeroes.map((hero) => [hero.id, hero]) ?? []),
    [config],
  );

  const previewDeck = useMemo(() => {
    if (!config) return [];
    const seen = new Set<number>();
    return [...config.probabilities]
      .sort((left, right) => left.position - right.position)
      .flatMap((probability) => probability.userSelectionEnabled && probability.configuredHeroes.length === 0
        ? (probabilitySelections[probability.id] ?? [])
          .map((heroId) => selectedHeroById.get(heroId))
          .filter((hero): hero is SummonSimulationHero => Boolean(hero))
        : probability.configuredHeroes)
      .filter((hero) => {
        if (seen.has(hero.id)) return false;
        seen.add(hero.id);
        return true;
      });
  }, [config, probabilitySelections, selectedHeroById]);

  useEffect(() => {
    if (simulating || previewDeck.length < 2) return undefined;
    const interval = window.setInterval(() => {
      setDeckIndex((current) => (current + 1) % previewDeck.length);
    }, PREVIEW_ROTATION_DELAY_MS);
    return () => window.clearInterval(interval);
  }, [previewDeck.length, simulating]);

  useEffect(() => {
    if (deckIndex >= previewDeck.length) setDeckIndex(0);
  }, [deckIndex, previewDeck.length]);

  useEffect(() => {
    if (!config) return undefined;
    const timeoutId = window.setTimeout(() => {
      void preloadImages(
        previewDeck
          .slice(0, BACKGROUND_IMAGE_PRELOAD_LIMIT)
          .map((hero) => heroImage(hero, locale)),
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [config, locale, previewDeck]);

  const activeRuleIds = useMemo(() => new Set([
    ...(config?.bonusRules.filter((rule) => !rule.userSelectable).map((rule) => rule.id) ?? []),
    ...enabledRuleIds,
  ]), [config, enabledRuleIds]);

  const missingRequiredSelections = useMemo(() => {
    if (!config) return true;
    const missingProbability = config.probabilities
      .filter((probability) => probability.userSelectionEnabled && probability.configuredHeroes.length === 0)
      .some((probability) => {
        const count = probabilitySelections[probability.id]?.length ?? 0;
        return count < 1 || count > 10;
      });
    const missingStep = config.bonusRules
      .filter((rule) => activeRuleIds.has(rule.id))
      .flatMap((rule) => rule.steps)
      .filter((step) => step.userHeroSelectionEnabled)
      .some((step) => !stepSelections[step.id]);
    return missingProbability || missingStep;
  }, [activeRuleIds, config, probabilitySelections, stepSelections]);

  const filteredHeroes = useMemo(() => {
    const normalized = heroSearch.trim().toLocaleLowerCase();
    if (!config) return [];
    if (!normalized) return config.selectableFiveStarHeroes;
    return config.selectableFiveStarHeroes.filter((hero) =>
      `${hero.slug} ${hero.nameJson?.ru ?? ''} ${hero.nameJson?.en ?? ''}`
        .toLocaleLowerCase()
        .includes(normalized));
  }, [config, heroSearch]);

  const toggleProbabilityHero = (probabilityId: string, heroId: number) => {
    setProbabilitySelections((current) => {
      const selected = current[probabilityId] ?? [];
      if (selected.includes(heroId)) {
        return { ...current, [probabilityId]: selected.filter((id) => id !== heroId) };
      }
      if (selected.length >= 10) return current;
      return { ...current, [probabilityId]: [...selected, heroId] };
    });
  };

  const runSimulation = async (pullCount: 1 | 10 | 30) => {
    if (!config || missingRequiredSelections || simulating) return;
    const runId = animationRunRef.current + 1;
    animationRunRef.current = runId;
    setModalError(null);
    setSimulating(true);
    setSimulationFinished(false);
    setIntroPullCount(pullCount);
    setSimulationPullCount(pullCount);
    setCompletionVisible(false);
    setRevealedResults([]);
    setActiveResult(null);

    const activeUserStepIds = new Set(
      config.bonusRules
        .filter((rule) => activeRuleIds.has(rule.id))
        .flatMap((rule) => rule.steps)
        .filter((step) => step.userHeroSelectionEnabled)
        .map((step) => step.id),
    );
    const request: SummonSimulationRequest = {
      variantVersion: config.variantVersion,
      pullCount,
      probabilityHeroSelections: config.probabilities
        .filter((probability) => probability.userSelectionEnabled)
        .map((probability) => ({
          probabilityId: probability.id,
          heroIds: probabilitySelections[probability.id] ?? [],
        })),
      bonusStepHeroSelections: Object.entries(stepSelections)
        .filter(([stepId]) => activeUserStepIds.has(stepId))
        .map(([bonusStepId, heroId]) => ({ bonusStepId, heroId })),
      enabledBonusRuleIds: enabledRuleIds,
    };

    try {
      const introDelay = wait(PULL_COUNT_INTRO_DELAY_MS);
      const response = await apiPostJson<SummonSimulationRequest, SummonSimulationResponse>(
        `${PUBLIC_SUMMONS_API}/${config.summonId}/variants/${config.variantId}/simulate`,
        request,
      );
      await Promise.all([
        introDelay,
        preloadImages(
          response.results.map((result) => heroImage(result.hero, locale)),
          RESULT_IMAGE_PRELOAD_TIMEOUT_MS,
        ),
      ]);
      if (animationRunRef.current !== runId) return;
      setIntroPullCount(null);
      for (const result of response.results) {
        if (animationRunRef.current !== runId) return;
        setActiveResult(result);
        const revealDelay = result.source === 'BASE'
          ? BASE_REVEAL_DELAY_MS
          : BONUS_REVEAL_DELAY_MS;
        const fiveStarHoldDelay = result.hero.rarityStars === 5
          ? FIVE_STAR_HOLD_DELAY_MS
          : 0;
        await wait(revealDelay + fiveStarHoldDelay);
        if (animationRunRef.current !== runId) return;
        setRevealedResults((current) => [...current, result]);
        await wait(BETWEEN_REVEALS_DELAY_MS);
      }
      if (animationRunRef.current === runId) {
        setActiveResult(null);
        setCompletionVisible(true);
        await wait(COMPLETION_MESSAGE_DELAY_MS);
      }
      if (animationRunRef.current === runId) {
        setCompletionVisible(false);
        setSimulationFinished(true);
      }
    } catch (error) {
      if (animationRunRef.current === runId) {
        setIntroPullCount(null);
        setCompletionVisible(false);
        setModalError(error instanceof Error ? error.message : text.required);
      }
    } finally {
      if (animationRunRef.current === runId) setSimulating(false);
    }
  };

  const baseResults = revealedResults.filter((result) => result.source === 'BASE');
  const bonusResults = revealedResults.filter((result) => result.source !== 'BASE');
  const displayHero = activeResult?.hero ?? previewDeck[deckIndex] ?? null;
  const isFiveStarReveal = activeResult?.hero.rarityStars === 5;
  const activePullNumber = simulationPullCount == null
    ? null
    : Math.min(activeResult?.rootPullNumber ?? (completionVisible ? simulationPullCount : 0), simulationPullCount);

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-soft)]">
        <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin" /> {text.loading}
      </div>
    );
  }

  return (
    <div className="space-y-9">
      {loadError ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{loadError}</div>
      ) : null}

      <section>
        <h2 className="mb-4 text-2xl font-black text-[var(--foreground)]">{text.base}</h2>
        {baseSummons.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {baseSummons.map((item) => (
              <SummonChoiceCard key={item.variant.id} item={item} locale={locale} temporary={false} onClick={() => void openSummon(item)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{text.empty}</div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black text-[var(--foreground)]">{text.temporary}</h2>
        {temporarySummons.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {temporarySummons.map((item) => (
              <SummonChoiceCard key={item.variant.id} item={item} locale={locale} temporary onClick={() => void openSummon(item)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{text.empty}</div>
        )}
      </section>

      <DictionaryModal
        open={Boolean(selectedItem)}
        onClose={closeModal}
        closeOnBackdropClick={false}
        closeLabel={text.close}
        maxWidthClassName="md:max-w-6xl"
        title={selectedItem ? localizedValue(selectedItem.nameJson, locale, selectedItem.slug) : ''}
      >
        {configLoading ? (
          <div className="flex min-h-80 items-center justify-center text-[var(--foreground-soft)]">
            <LoaderCircle className="mr-3 h-6 w-6 animate-spin" /> {text.loading}
          </div>
        ) : config ? (
          <div className="space-y-6">
            <section className="relative min-h-[25rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950">
              {config.backgroundImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.backgroundImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
              ) : null}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.28)_42%,rgba(2,6,23,0.88)_100%)]" />
              {config.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.imageUrl} alt="" className="absolute left-5 top-5 h-24 w-24 object-contain drop-shadow-2xl md:h-32 md:w-32" />
              ) : null}

              <div className="relative flex min-h-[25rem] flex-col items-center justify-center p-6 text-center">
                {activeResult?.source && activeResult.source !== 'BASE' ? (
                  <div className="summon-bonus-flash mb-4 rounded-full border border-amber-200/50 bg-amber-300/20 px-5 py-2 text-sm font-black uppercase tracking-[0.25em] text-amber-100 shadow-[0_0_40px_rgba(251,191,36,0.35)]">
                    {text.bonusRound}
                  </div>
                ) : null}
                {introPullCount ? (
                  <div className="summon-count-intro text-7xl font-black tracking-tight text-white drop-shadow-[0_0_45px_rgba(217,70,239,0.9)] md:text-9xl">
                    ×{introPullCount}
                  </div>
                ) : completionVisible ? (
                  <div className="summon-completion-message rounded-[2rem] border border-emerald-200/40 bg-emerald-300/15 px-8 py-5 text-4xl font-black text-emerald-100 shadow-[0_0_70px_rgba(52,211,153,0.45)] md:text-6xl">
                    {text.done}
                  </div>
                ) : displayHero ? (
                  <div
                    key={`${activeResult?.sequence ?? 'deck'}-${displayHero.id}-${deckIndex}`}
                    className={`summon-card-slide relative isolate ${isFiveStarReveal ? 'summon-five-star-reveal' : ''}`}
                  >
                    {isFiveStarReveal ? (
                      <div className="summon-five-star-aura pointer-events-none absolute left-1/2 top-1/2 z-0 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelectedHero(displayHero)}
                      disabled={simulating}
                      className={`relative z-10 block h-64 w-48 overflow-hidden rounded-[1.75rem] border bg-black/30 text-left shadow-[0_25px_80px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 disabled:cursor-default md:h-80 md:w-60 ${
                      isFiveStarReveal
                        ? 'border-amber-100 shadow-[0_0_95px_rgba(250,204,21,0.95)]'
                        : activeResult?.source && activeResult.source !== 'BASE'
                        ? 'border-amber-200/70 shadow-[0_0_70px_rgba(251,191,36,0.5)]'
                        : 'border-cyan-200/35'
                    }`}>
                      {heroImage(displayHero, locale) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={heroImage(displayHero, locale)} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                          <UserRound className="h-12 w-12" /> {text.noImage}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-4 pt-12">
                        <div className="font-black text-white">{localizedValue(displayHero.nameJson, locale, displayHero.slug)}</div>
                        <div className="mt-1 flex justify-center gap-0.5 text-amber-300">
                          {Array.from({ length: displayHero.rarityStars ?? 0 }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}
                        </div>
                      </div>
                    </button>
                  </div>
                ) : (
                  <Sparkles className="h-16 w-16 text-fuchsia-200/70" />
                )}
              </div>
            </section>

            {!simulating && !simulationFinished ? (
              <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
                <h3 className="text-lg font-black text-[var(--foreground)]">{text.settings}</h3>
                {config.probabilities
                  .filter((probability) => probability.userSelectionEnabled && probability.configuredHeroes.length === 0)
                  .map((probability) => {
                  const selectedIds = probabilitySelections[probability.id] ?? [];
                  const selectedHeroes = selectedIds
                    .map((heroId) => selectedHeroById.get(heroId))
                    .filter((hero): hero is SummonSimulationHero => Boolean(hero));
                  const availableHeroes = filteredHeroes.filter((hero) => !selectedIds.includes(hero.id));
                  return (
                    <div key={probability.id} className="space-y-3 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-[var(--foreground)]">{text.recommended}</div>
                          <div className="mt-1 text-xs text-[var(--foreground-soft)]">{text.recommendedHint}</div>
                        </div>
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">{text.selected}: {selectedIds.length}/10</span>
                      </div>
                      {selectedHeroes.length > 0 ? (
                        <div>
                          <div className="mb-2 text-xs font-semibold text-[var(--foreground-soft)]">{text.selectedHeroes}</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedHeroes.map((hero) => (
                              <SelectedHeroPreview
                                key={hero.id}
                                hero={hero}
                                locale={locale}
                                removeLabel={text.removeHero}
                                onOpen={() => setSelectedHero(hero)}
                                onRemove={() => toggleProbabilityHero(probability.id, hero.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--foreground-muted)]" />
                        <input
                          type="search"
                          value={heroSearch}
                          onChange={(event) => setHeroSearch(event.target.value)}
                          placeholder={text.search}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none"
                        />
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-semibold text-[var(--foreground-soft)]">{text.availableHeroes}</div>
                        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                          {availableHeroes.map((hero) => (
                            <button
                              type="button"
                            key={hero.id}
                            onClick={() => toggleProbabilityHero(probability.id, hero.id)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left transition hover:border-fuchsia-300/45 hover:bg-[var(--surface-hover)]"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
                                  {localizedValue(hero.nameJson, locale, hero.slug)}
                                </span>
                                <span className="block truncate text-[10px] text-[var(--foreground-muted)]">{hero.slug}</span>
                              </span>
                              <span className="shrink-0 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-xs font-bold text-cyan-200">+</span>
                            </button>
                          ))}
                          {availableHeroes.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
                              {text.noHeroesFound}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {config.bonusRules.some((rule) => rule.userSelectable) ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-[var(--foreground)]">{text.optionalBonuses}</h4>
                    {config.bonusRules.filter((rule) => rule.userSelectable).map((rule) => (
                      <label key={rule.id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4">
                        <span className="font-semibold text-[var(--foreground)]">{localizedValue(rule.definition.nameJson, locale, rule.kind)}</span>
                        <input
                          type="checkbox"
                          checked={enabledRuleIds.includes(rule.id)}
                          onChange={(event) => setEnabledRuleIds((current) => event.target.checked
                            ? [...current, rule.id]
                            : current.filter((id) => id !== rule.id))}
                          className="h-5 w-5"
                        />
                      </label>
                    ))}
                  </div>
                ) : null}

                {config.bonusRules
                  .filter((rule) => activeRuleIds.has(rule.id))
                  .flatMap((rule) => rule.steps.map((step) => ({ rule, step })))
                  .filter(({ step }) => step.userHeroSelectionEnabled)
                  .map(({ rule, step }) => (
                    <div key={step.id} className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
                      <div className="mb-3 text-xs text-[var(--foreground-soft)]">{localizedValue(rule.definition.nameJson, locale, rule.kind)}</div>
                      <SearchableSelectField
                        label={text.selectBonusHero}
                        value={stepSelections[step.id] ? String(stepSelections[step.id]) : ''}
                        onChange={(value) => setStepSelections((current) => {
                          if (value) return { ...current, [step.id]: Number(value) };
                          const next = { ...current };
                          delete next[step.id];
                          return next;
                        })}
                        options={config.selectableFiveStarHeroes.map((hero) => ({
                          value: String(hero.id),
                          label: `${localizedValue(hero.nameJson, locale, hero.slug)} (${hero.slug})`,
                          imageUrl: hero.previewUrl,
                        }))}
                        placeholder={text.selectBonusHero}
                        searchPlaceholder={text.search}
                        searchAriaLabel={text.search}
                        clearSearchLabel={text.clearSearch}
                        emptyOptionLabel={text.emptySelection}
                        noResultsLabel={text.noHeroesFound}
                      />
                    </div>
                  ))}
              </section>
            ) : null}

            {simulationFinished && revealedResults.length > 0 ? (
              <section className="space-y-5">
                <h3 className="text-2xl font-black text-[var(--foreground)]">{text.result}</h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                  {baseResults.map((result) => (
                    <HeroTile
                      key={result.sequence}
                      hero={result.hero}
                      locale={locale}
                      onClick={() => setSelectedHero(result.hero)}
                    />
                  ))}
                </div>
                {bonusResults.length > 0 ? (
                  <div className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-4">
                    <h4 className="mb-3 font-black uppercase tracking-wider text-amber-200">{text.bonusRound}</h4>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                      {bonusResults.map((result) => (
                        <HeroTile
                          key={result.sequence}
                          hero={result.hero}
                          locale={locale}
                          onClick={() => setSelectedHero(result.hero)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {modalError ? (
              <div className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
                <X className="mt-0.5 h-4 w-4 shrink-0" /> {modalError}
              </div>
            ) : null}

            <div className="sticky -bottom-6 z-20 -mx-6 border-t border-[var(--border)] bg-[color:var(--surface)]/95 p-4 backdrop-blur-xl">
              {missingRequiredSelections ? <div className="mb-3 text-center text-xs text-amber-200">{text.required}</div> : null}
              {simulating ? (
                <div className="mb-3 text-center text-xs text-cyan-200">
                  {completionVisible ? text.done : text.calculating}
                  {!completionVisible && activePullNumber !== null ? ` (${activePullNumber}/${simulationPullCount})` : null}
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-3">
                {([1, 10, 30] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => void runSimulation(count)}
                    disabled={missingRequiredSelections || simulating}
                    className="rounded-2xl border border-fuchsia-300/30 bg-gradient-to-b from-fuchsia-400/25 to-blue-500/15 px-4 py-3 text-lg font-black text-fuchsia-100 shadow-[0_12px_35px_rgba(168,85,247,0.15)] transition hover:border-fuchsia-200/60 hover:from-fuchsia-400/35 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ×{count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-64 rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">{modalError ?? text.empty}</div>
        )}
      </DictionaryModal>

      <PublicHeroDetailsModal
        open={selectedHero !== null}
        locale={locale === 'ru' ? 'RU' : 'EN'}
        includeDrafts
        heroCard={selectedHeroCard}
        heroDetails={selectedHeroDetails}
        heroVariants={selectedHeroVariants}
        loading={selectedHeroLoading}
        error={selectedHeroError}
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
