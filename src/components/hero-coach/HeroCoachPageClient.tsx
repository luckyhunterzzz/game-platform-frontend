'use client';

import { forwardRef, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle, Search, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { enUS, ru } from 'date-fns/locale';

import HeroInfoPopover from '@/components/heroes/admin/HeroInfoPopover';
import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantsItem,
} from '@/components/heroes/admin/PublicHeroDetailsModal';
import { getHeroPreviewAccentClass } from '@/lib/hero-preview';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { HeroExpertOpinionPublicResponseDto } from '@/lib/types/hero-expert-opinion';
import { ApiError, useApi } from '@/lib/use-api';

type HeroCoachHeroItem = {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string | null;
  previewUrl?: string | null;
  elementName: string;
  rarityName: string;
  rarityStars: number;
  heroClassName: string;
  manaSpeedName: string;
  familyName?: string | null;
  alphaTalentName?: string | null;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  releaseDate?: string | null;
  heroCoachDate?: string | null;
};

type HeroCoachPageResponse = {
  suggestedPreviousEventDate?: string | null;
  items: HeroCoachHeroItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type HeroCoachForecastResponse = {
  suggestedPreviousEventDate?: string | null;
  effectivePreviousEventDate: string;
  targetDate: string;
  newlyAvailableHeroes: HeroCoachHeroItem[];
};

type HeroCatalogSearchItem = {
  id: number;
  slug: string;
  name: string;
  baseHeroId?: number | null;
  isCostume?: boolean | null;
  costumeIndex?: number | null;
  imageUrl?: string | null;
  previewUrl?: string | null;
  elementName: string;
  rarityName: string;
  rarityStars: number;
  heroClassName: string;
  manaSpeedName: string;
  familyName?: string | null;
  alphaTalentName?: string | null;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  releaseDate?: string | null;
};

type HeroCatalogSearchResponse = {
  items: HeroCatalogSearchItem[];
};

type HeroClassKey =
  | 'barbarian'
  | 'cleric'
  | 'druid'
  | 'fighter'
  | 'monk'
  | 'paladin'
  | 'ranger'
  | 'rogue'
  | 'sorcerer'
  | 'wizard';

const HERO_CLASS_ASSET_BASE = '/heroes/elements/classes';
const HERO_CLASS_ICON_BY_KEY: Record<HeroClassKey, string> = {
  barbarian: `${HERO_CLASS_ASSET_BASE}/barbarian.png`,
  cleric: `${HERO_CLASS_ASSET_BASE}/cleric.png`,
  druid: `${HERO_CLASS_ASSET_BASE}/druid.png`,
  fighter: `${HERO_CLASS_ASSET_BASE}/fighter.png`,
  monk: `${HERO_CLASS_ASSET_BASE}/monk.png`,
  paladin: `${HERO_CLASS_ASSET_BASE}/paladin.png`,
  ranger: `${HERO_CLASS_ASSET_BASE}/ranger.png`,
  rogue: `${HERO_CLASS_ASSET_BASE}/rogue.png`,
  sorcerer: `${HERO_CLASS_ASSET_BASE}/sorcerer.png`,
  wizard: `${HERO_CLASS_ASSET_BASE}/wizard.png`,
};

const HERO_COACH_INFO_RU = `Это регулярное событие позволяет игрокам прокачивать легендарных героев до 4/90 в обмен на гемы.
Костюмы нельзя прокачивать с помощью Тренера героев.
После выбора героя Тренер героев покажет, как будет выглядеть ваш герой на уровне 4/90.
Вы можете выбрать для тренировки только героя, который был выпущен более чем за 730 дней до начала события.
Можно тренировать только одного героя за событие.

Примеры стоимости в гемах:
Прокачка с 4/85: 18 гемов
Прокачка с 4/80: 37 гемов
Прокачка с 3/70 и 4/1: 334 гема
Прокачка с 2/60 и 3/1: 593 гема
Прокачка с 1/50 и 2/1: 815 гемов
Прокачка с 1/1: 1000 гемов

Каждый уровень уменьшает стоимость на 3-4 гема.
(~3.7 гема за уровень в среднем.)`;

const HERO_COACH_INFO_EN = `This recurring event allows players to level their Legendary Heroes to 4/90, in exchange for Gems.
Costumes can't be leveled up with Hero Coach.
After selecting a Hero, the Hero Coach will show you how your hero will look like at 4/90.
You can only select a Hero to train, which is released earlier than 2 years before the start of the event.
In the live game, players will be able to train one Hero per event.

Example Gem Costs in Beta:
Training from 4/85: 18 Gems
Training from 4/80: 37 Gems
Training from 3/70 and 4/1: 334 Gems
Training from 2/60 and 3/1: 593 Gems
Training from 1/50 and 2/1: 815 Gems
Training from 1/1: 1000 Gems
Each level is reducing the Gem cost with 3-4 Gems. (~3.7 Gems / level on average.)`;

function resolveHeroClassKey(value: string | null | undefined): HeroClassKey | null {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  if (normalized.includes('barbarian') || normalized.includes('варвар')) return 'barbarian';
  if (normalized.includes('cleric') || normalized.includes('церков')) return 'cleric';
  if (normalized.includes('druid') || normalized.includes('друид')) return 'druid';
  if (normalized.includes('fighter') || normalized.includes('боец')) return 'fighter';
  if (normalized.includes('monk') || normalized.includes('монах')) return 'monk';
  if (normalized.includes('paladin') || normalized.includes('палад')) return 'paladin';
  if (normalized.includes('ranger') || normalized.includes('рейндж')) return 'ranger';
  if (normalized.includes('rogue') || normalized.includes('ассас') || normalized.includes('разбой')) return 'rogue';
  if (normalized.includes('sorcerer') || normalized.includes('колдун') || normalized.includes('маг')) return 'sorcerer';
  if (normalized.includes('wizard') || normalized.includes('волшеб')) return 'wizard';

  return null;
}

function CornerIconBadge({
  imageUrl,
  alt,
  className,
  sizeClassName = 'h-3.5 w-3.5 sm:h-5 sm:w-5',
}: {
  imageUrl: string;
  alt: string;
  className: string;
  sizeClassName?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={alt}
      className={`${sizeClassName} object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.98))_drop-shadow(0_0_2px_rgba(0,0,0,0.92))_drop-shadow(0_2px_4px_rgba(15,23,42,0.8))] ${className}`}
    />
  );
}

function resolveGridColumns(width: number) {
  if (width >= 1280) return Math.max(1, Math.floor(width / 156));
  if (width >= 640) return Math.max(1, Math.floor(width / 148));
  return Math.max(2, Math.floor(width / 132));
}

function resolveInitialPageSize(width: number, height: number) {
  const columns = resolveGridColumns(width);
  const reservedHeight = width >= 1024 ? 470 : 560;
  const cardHeight = width >= 640 ? 192 : 164;
  const rows = Math.max(2, Math.floor(Math.max(320, height - reservedHeight) / cardHeight));
  return columns * rows;
}

function formatIsoDateForLocale(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) {
    return '';
  }

  return `${day}.${month}.${year}`;
}

function dateToIso(value: Date | null) {
  if (!value) {
    return '';
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToIsoDate(value: string | null | undefined, days: number) {
  if (!value) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  candidate.setDate(candidate.getDate() + days);
  return dateToIso(candidate);
}

function isoToDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
}

const DatePickerButton = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    placeholder: string;
    value?: string;
    onClick?: () => void;
  }
>(({ label, placeholder, value, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className="flex min-h-[72px] w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left text-sm text-[var(--foreground)] outline-none transition hover:border-cyan-400/30 hover:bg-[var(--surface-hover)]"
  >
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground-soft)]">{label}</span>
      <span className={`truncate pt-1 ${value ? 'text-[var(--foreground)]' : 'text-[var(--foreground-soft)]'}`}>
        {value || placeholder}
      </span>
    </div>
    <CalendarDays className="h-5 w-5 shrink-0 text-cyan-300" />
  </button>
));

DatePickerButton.displayName = 'DatePickerButton';

function CalendarField({
  locale,
  label,
  hint,
  selected,
  onChange,
  required = false,
}: {
  locale: 'ru' | 'en';
  label: string;
  hint: string;
  selected: Date | null;
  onChange: (value: Date | null) => void;
  required?: boolean;
}) {
  const pickerLocale = locale === 'ru' ? ru : enUS;
  const placeholder = locale === 'ru' ? 'Выберите дату' : 'Select date';

  return (
    <label className="flex h-full w-full flex-col gap-2">
      <DatePicker
        selected={selected}
        onChange={(value: Date | null) => onChange(value)}
        locale={pickerLocale}
        dateFormat="dd.MM.yyyy"
        required={required}
        calendarClassName="gp-datepicker"
        popperClassName="gp-datepicker-popper"
        wrapperClassName="gp-datepicker-wrapper"
        customInput={
          <DatePickerButton
            label={label}
            placeholder={placeholder}
          />
        }
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <button
              type="button"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--datepicker-border)] bg-[var(--surface-strong)] text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              type="button"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--datepicker-border)] bg-[var(--surface-strong)] text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      />
      <span className="text-xs text-[var(--foreground-soft)]">{hint}</span>
    </label>
  );
}

function HeroCoachPreviewTile({
  hero,
  locale,
  onClick,
  unavailable = false,
  statusLabel,
}: {
  hero: HeroCoachHeroItem;
  locale: 'ru' | 'en';
  onClick: () => void;
  unavailable?: boolean;
  statusLabel?: string | null;
}) {
  const accentClass = getHeroPreviewAccentClass(hero.elementName);
  const heroClassKey = resolveHeroClassKey(hero.heroClassName);
  const heroClassLabel = hero.heroClassName || (locale === 'ru' ? 'Класс героя' : 'Hero class');
  const previewSrc = hero.previewUrl ?? hero.imageUrl ?? null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full flex-col items-center gap-2 rounded-xl border p-2 text-center shadow-sm transition hover:-translate-y-0.5 ${
        unavailable
          ? 'border-slate-500/40 bg-slate-900/40 hover:bg-slate-900/55'
          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      <div className="relative inline-block overflow-visible">
        {heroClassKey ? (
          <CornerIconBadge
            imageUrl={HERO_CLASS_ICON_BY_KEY[heroClassKey]}
            alt={heroClassLabel}
            className="pointer-events-none absolute left-1 top-1 z-10"
          />
        ) : null}
        <div className={`inline-block overflow-hidden rounded-2xl border p-[2px] ${accentClass}`}>
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={hero.name}
              className={`h-20 w-20 rounded-[14px] object-cover sm:h-24 sm:w-24 ${unavailable ? 'grayscale opacity-60' : ''}`}
            />
          ) : (
            <div className={`flex h-20 w-20 items-center justify-center rounded-[14px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-24 sm:w-24 sm:text-xs ${unavailable ? 'grayscale opacity-60' : ''}`}>
              ?
            </div>
          )}
        </div>
      </div>
      <span className={`line-clamp-2 min-h-[2rem] text-xs font-medium leading-tight sm:min-h-[2.5rem] sm:text-sm ${unavailable ? 'text-slate-300' : 'text-[var(--foreground)]'}`}>
        {hero.name}
      </span>
      {statusLabel ? (
        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold sm:text-[11px] ${unavailable ? 'bg-slate-700/70 text-slate-200' : 'bg-emerald-500/15 text-emerald-300'}`}>
          {statusLabel}
        </span>
      ) : null}
    </button>
  );
}

export default function HeroCoachPageClient() {
  const { apiJson } = useApi();
  const { locale } = useI18n();
  const heroLocale = locale === 'ru' ? 'RU' : 'EN';
  const [pageSize, setPageSize] = useState(20);
  const [previousEventDateIso, setPreviousEventDateIso] = useState('');
  const [previousEventDate, setPreviousEventDate] = useState<Date | null>(null);
  const [targetDateIso, setTargetDateIso] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [availableData, setAvailableData] = useState<HeroCoachPageResponse | null>(null);
  const [availableHeroes, setAvailableHeroes] = useState<HeroCoachHeroItem[]>([]);
  const [availableLoading, setAvailableLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [availableError, setAvailableError] = useState<string | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecastResult, setForecastResult] = useState<HeroCoachForecastResponse | null>(null);
  const [selectedHeroSlug, setSelectedHeroSlug] = useState<string | null>(null);
  const [selectedHeroCard, setSelectedHeroCard] = useState<PublicHeroCardItem | null>(null);
  const [selectedHeroDetails, setSelectedHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedHeroVariants, setSelectedHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [selectedHeroOpinions, setSelectedHeroOpinions] = useState<HeroExpertOpinionPublicResponseDto[]>([]);
  const [selectedHeroLoading, setSelectedHeroLoading] = useState(false);
  const [selectedHeroError, setSelectedHeroError] = useState<string | null>(null);
  const [selectedHeroOpinionsLoading, setSelectedHeroOpinionsLoading] = useState(false);
  const [selectedHeroOpinionsError, setSelectedHeroOpinionsError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<HeroCatalogSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  const text = useMemo(
    () =>
      locale === 'ru'
        ? {
            pageTitle: 'Тренер героев',
            pageBadge: 'Hero Coach',
            calculatorTitle: 'Следующие доступные герои',
            helpLabel: 'Что такое Тренер героев',
            helpContent: HERO_COACH_INFO_RU,
            previousDateLabel: 'Дата предыдущей качалки',
            previousDateHint: 'Необязательно. Если пусто, при расчете используем Желаемая дата - 3 месяца.',
            targetDateLabel: 'Желаемая дата',
            targetDateHint: 'Обязательное поле.',
            calculateButton: 'Рассчитать',
            resetButton: 'Сбросить',
            calculating: 'Считаем...',
            forecastTitle: 'Герои для следующей качалки',
            forecastEmpty: 'Для выбранной даты новых героев не найдено.',
            effectivePreviousDate: 'Использована предыдущая дата',
            availableTitle: 'Уже доступны в качалке',
            availableDescription: 'Список базовых легендарных героев, которые уже проходят правило 730 дней.',
            searchTitle: 'Быстрый поиск героя',
            searchPlaceholder: 'Начни вводить имя героя',
            searchHint: 'Покажем, доступен ли герой уже сейчас в Тренере героев.',
            searchEmpty: 'По этому запросу герои не найдены.',
            searchError: 'Не удалось выполнить поиск героев.',
            availableNow: 'Уже доступен',
            unavailableAfter: 'После',
            loadMore: 'Посмотреть еще',
            loading: 'Загрузка героев...',
            loadError: 'Не удалось загрузить Hero Coach данные.',
            forecastError: 'Не удалось рассчитать следующих героев.',
            modalError: 'Не удалось загрузить героя.',
            noDateSelected: 'Сначала выбери желаемую дату.',
            invalidDate: 'Проверь формат даты.',
          }
        : {
            pageTitle: 'Hero Coach',
            pageBadge: 'Hero Coach',
            calculatorTitle: 'Next available heroes',
            helpLabel: 'What is Hero Coach',
            helpContent: HERO_COACH_INFO_EN,
            previousDateLabel: 'Previous Hero Coach date',
            previousDateHint: 'Optional. If empty, calculation uses Target date - 3 months.',
            targetDateLabel: 'Target date',
            targetDateHint: 'Required field.',
            calculateButton: 'Calculate',
            resetButton: 'Reset',
            calculating: 'Calculating...',
            forecastTitle: 'Heroes for next Hero Coach',
            forecastEmpty: 'No new heroes found for selected date.',
            effectivePreviousDate: 'Used previous date',
            availableTitle: 'Already available in Hero Coach',
            availableDescription: 'Base Legendary Heroes that already pass the 730 days rule.',
            searchTitle: 'Quick hero search',
            searchPlaceholder: 'Start typing hero name',
            searchHint: 'We will show whether this hero is already available in Hero Coach.',
            searchEmpty: 'No heroes found for this query.',
            searchError: 'Failed to search heroes.',
            availableNow: 'Already available',
            unavailableAfter: 'After',
            loadMore: 'Load more',
            loading: 'Loading heroes...',
            loadError: 'Failed to load Hero Coach data.',
            forecastError: 'Failed to calculate next heroes.',
            modalError: 'Failed to load hero.',
            noDateSelected: 'Select target date first.',
            invalidDate: 'Check date format.',
          },
    [locale],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updatePageSize = () => {
      const containerWidth = contentRef.current?.clientWidth ?? window.innerWidth;
      setPageSize(resolveInitialPageSize(containerWidth, window.innerHeight));
    };

    updatePageSize();
    window.addEventListener('resize', updatePageSize);

    const observer =
      typeof ResizeObserver === 'undefined' || !contentRef.current
        ? null
        : new ResizeObserver(() => updatePageSize());

    if (observer && contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener('resize', updatePageSize);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      setAvailableLoading(true);
      setAvailableError(null);

      try {
        const response = await apiJson<HeroCoachPageResponse>(
          `/api/v1/public/hero-coach?page=0&size=${pageSize}&language=${heroLocale}`,
        );

        if (cancelled) {
          return;
        }

        setAvailableData(response);
        setAvailableHeroes(response.items);

        const suggestedDate = response.suggestedPreviousEventDate ?? '';
        setPreviousEventDateIso((current) => current || suggestedDate);
        setPreviousEventDate((current) => current ?? isoToDate(suggestedDate));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAvailableError(error instanceof ApiError ? error.message : text.loadError);
      } finally {
        if (!cancelled) {
          setAvailableLoading(false);
        }
      }
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [apiJson, heroLocale, pageSize, text.loadError]);

  useEffect(() => {
    if (!selectedHeroSlug) {
      setSelectedHeroCard(null);
      setSelectedHeroDetails(null);
      setSelectedHeroVariants(null);
      setSelectedHeroOpinions([]);
      setSelectedHeroLoading(false);
      setSelectedHeroOpinionsLoading(false);
      setSelectedHeroError(null);
      setSelectedHeroOpinionsError(null);
      return;
    }

    let cancelled = false;

    const loadHero = async () => {
      setSelectedHeroLoading(true);
      setSelectedHeroOpinionsLoading(true);
      setSelectedHeroError(null);
      setSelectedHeroOpinionsError(null);

      try {
        const [variantsResponse, opinionsResponse] = await Promise.all([
          apiJson<PublicHeroVariantsItem>(
            `/api/v1/public/heroes/${selectedHeroSlug}/variants?language=${heroLocale}`,
          ),
          apiJson<HeroExpertOpinionPublicResponseDto[]>(
            `/api/v1/public/heroes/${selectedHeroSlug}/expert-opinions?language=${heroLocale}`,
          ),
        ]);

        if (cancelled) {
          return;
        }

        const currentHero = variantsResponse.currentHero;
        setSelectedHeroDetails(currentHero);
        setSelectedHeroVariants(variantsResponse);
        setSelectedHeroOpinions(opinionsResponse);
        setSelectedHeroCard({
          id: currentHero.id,
          slug: currentHero.slug,
          name: currentHero.name,
          imageUrl: currentHero.imageUrl ?? variantsResponse.baseHero?.imageUrl ?? null,
          previewUrl:
            currentHero.previewUrl ?? currentHero.imageUrl ?? variantsResponse.baseHero?.previewUrl ?? null,
          elementName: currentHero.element?.name ?? '',
          rarityName: '',
          rarityStars: currentHero.rarity?.stars ?? 0,
          heroClassName: currentHero.heroClass?.name ?? '',
          manaSpeedName: currentHero.manaSpeed?.name ?? '',
          familyName: currentHero.family?.name ?? null,
          alphaTalentName: currentHero.alphaTalent?.name ?? null,
          baseAttack: currentHero.baseAttack ?? null,
          baseArmor: currentHero.baseArmor ?? null,
          baseHp: currentHero.baseHp ?? null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof ApiError ? error.message : text.modalError;
        setSelectedHeroError(message);
        setSelectedHeroOpinionsError(message);
      } finally {
        if (!cancelled) {
          setSelectedHeroLoading(false);
          setSelectedHeroOpinionsLoading(false);
        }
      }
    };

    void loadHero();

    return () => {
      cancelled = true;
    };
  }, [apiJson, heroLocale, selectedHeroSlug, text.modalError]);

  useEffect(() => {
    const normalizedQuery = searchValue.trim();

    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          page: '0',
          size: '50',
          search: normalizedQuery,
          language: heroLocale,
        });

        const response = await apiJson<HeroCatalogSearchResponse>(`/api/v1/public/heroes?${params.toString()}`);

        if (cancelled) {
          return;
        }

        setSearchResults(response.items.filter((hero) => hero.isCostume !== true && hero.rarityStars === 5));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSearchError(error instanceof ApiError ? error.message : text.searchError);
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [apiJson, heroLocale, searchValue, text.searchError]);

  const handlePreviousDateChange = (value: Date | null) => {
    setPreviousEventDate(value);
    setPreviousEventDateIso(dateToIso(value));
  };

  const handleTargetDateChange = (value: Date | null) => {
    setTargetDate(value);
    setTargetDateIso(dateToIso(value));
  };

  const handleLoadMore = async () => {
    if (!availableData?.hasNext || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setAvailableError(null);

    try {
      const nextPage = availableData.page + 1;
      const response = await apiJson<HeroCoachPageResponse>(
        `/api/v1/public/hero-coach?page=${nextPage}&size=${availableData.size}&language=${heroLocale}`,
      );
      setAvailableData(response);
      setAvailableHeroes((current) => [...current, ...response.items]);
    } catch (error) {
      setAvailableError(error instanceof ApiError ? error.message : text.loadError);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleForecastSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!targetDate) {
      setForecastError(text.noDateSelected);
      return;
    }

    if (!targetDateIso) {
      setForecastError(text.invalidDate);
      return;
    }

    setForecastLoading(true);
    setForecastError(null);

    try {
      const params = new URLSearchParams({
        targetDate: targetDateIso,
        language: heroLocale,
      });

      if (previousEventDateIso) {
        params.set('previousEventDate', previousEventDateIso);
      }

      const response = await apiJson<HeroCoachForecastResponse>(
        `/api/v1/public/hero-coach/forecast?${params.toString()}`,
      );
      setForecastResult(response);
    } catch (error) {
      setForecastError(error instanceof ApiError ? error.message : text.forecastError);
    } finally {
      setForecastLoading(false);
    }
  };

  const handleForecastReset = () => {
    setPreviousEventDate(null);
    setPreviousEventDateIso('');
    setTargetDate(null);
    setTargetDateIso('');
    setForecastResult(null);
    setForecastError(null);
  };

  const showSearchSection = searchValue.trim().length >= 2;

  return (
    <>
      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <section ref={contentRef} className="w-full max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)]">{text.pageTitle}</h1>
            </div>

            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
              {text.pageBadge}
            </span>
          </div>

          <section className="relative z-20 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-6 flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/heroes/activity-icons/hero-coach.png" alt="" className="h-16 w-16 object-contain" />
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{text.calculatorTitle}</h2>
                <HeroInfoPopover label={text.helpLabel} content={text.helpContent} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleForecastSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CalendarField
                  locale={locale}
                  label={text.previousDateLabel}
                  hint={text.previousDateHint}
                  selected={previousEventDate}
                  onChange={handlePreviousDateChange}
                />
                <CalendarField
                  locale={locale}
                  label={text.targetDateLabel}
                  hint={text.targetDateHint}
                  selected={targetDate}
                  onChange={handleTargetDateChange}
                  required
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={forecastLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {forecastLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {forecastLoading ? text.calculating : text.calculateButton}
                </button>

                <button
                  type="button"
                  onClick={handleForecastReset}
                  disabled={forecastLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {text.resetButton}
                </button>

                {forecastResult ? (
                  <span className="text-sm text-[var(--foreground-soft)]">
                    {text.effectivePreviousDate}: {formatIsoDateForLocale(forecastResult.effectivePreviousEventDate)}
                  </span>
                ) : null}
              </div>

              {forecastError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {forecastError}
                </div>
              ) : null}

              {forecastResult ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{text.forecastTitle}</h3>
                  {forecastResult.newlyAvailableHeroes.length === 0 ? (
                    <p className="text-sm text-[var(--foreground-soft)]">{text.forecastEmpty}</p>
                  ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(148px,1fr))]">
                      {forecastResult.newlyAvailableHeroes.map((hero) => (
                        <HeroCoachPreviewTile
                          key={`forecast-${hero.id}`}
                          hero={hero}
                          locale={locale}
                          onClick={() => setSelectedHeroSlug(hero.slug)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </form>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">{text.searchTitle}</h2>
              <p className="mt-2 text-sm text-[var(--foreground-soft)]">{text.searchHint}</p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--foreground-soft)]" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={text.searchPlaceholder}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] py-3 pl-12 pr-12 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--foreground-soft)] focus:border-cyan-400/40"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {showSearchSection ? (
              <div className="mt-5">
                {searchLoading ? (
                  <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                    <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                    <span>{text.loading}</span>
                  </div>
                ) : searchError ? (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {searchError}
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-soft)]">{text.searchEmpty}</p>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(148px,1fr))]">
                    {searchResults.map((hero) => {
                      const availabilityIso = addDaysToIsoDate(hero.releaseDate, 730);
                      const availabilityDate = formatIsoDateForLocale(availabilityIso);
                      const isAvailable = Boolean(availabilityIso && availabilityIso <= dateToIso(new Date()));

                      return (
                        <HeroCoachPreviewTile
                          key={`search-${hero.id}`}
                          hero={hero}
                          locale={locale}
                          unavailable={!isAvailable}
                          statusLabel={isAvailable ? text.availableNow : `${text.unavailableAfter} ${availabilityDate || '...'}`}
                          onClick={() => setSelectedHeroSlug(hero.slug)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <section className="relative z-0 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">{text.availableTitle}</h2>
              <p className="mt-2 text-sm text-[var(--foreground-soft)]">{text.availableDescription}</p>
            </div>

            {availableLoading ? (
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                <span>{text.loading}</span>
              </div>
            ) : availableError ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {availableError}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(148px,1fr))]">
                  {availableHeroes.map((hero) => (
                    <HeroCoachPreviewTile
                      key={`available-${hero.id}`}
                      hero={hero}
                      locale={locale}
                      onClick={() => setSelectedHeroSlug(hero.slug)}
                    />
                  ))}
                </div>

                {availableData?.hasNext ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingMore ? <LoaderCircle className="h-4 w-4 animate-spin text-cyan-400" /> : null}
                      {text.loadMore}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </section>
      </main>

      <PublicHeroDetailsModal
        open={selectedHeroSlug !== null}
        locale={heroLocale}
        heroCard={selectedHeroCard}
        heroDetails={selectedHeroDetails}
        heroVariants={selectedHeroVariants}
        heroExpertOpinions={selectedHeroOpinions}
        heroExpertOpinionsLoading={selectedHeroOpinionsLoading}
        heroExpertOpinionsError={selectedHeroOpinionsError}
        loading={selectedHeroLoading}
        error={selectedHeroError}
        onClose={() => setSelectedHeroSlug(null)}
        onOpenRelatedHero={(slug) => setSelectedHeroSlug(slug)}
      />
    </>
  );
}
