'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronDown, CircleHelp, Eraser, LoaderCircle, Monitor, Plus, RotateCcw, Save, ShieldAlert, Trash2, X } from 'lucide-react';

import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantsItem,
} from '@/components/heroes/admin/PublicHeroDetailsModal';
import { useApi, ApiError } from '@/lib/use-api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { getHeroPreviewAccentClass } from '@/lib/hero-preview';
import type {
  HeroPowerGrade,
  PlayerProfileHeroResponse,
  PlayerProfileResponse,
  PlayerProfileUpdateRequest,
  PlayerWarAttackTeamResponse,
  PlayerWarAttackTeamsResponse,
  PlayerWarAttackTeamsUpdateRequest,
} from '@/lib/types/player-profile';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  telegramUsername: string;
  vkUsername: string;
  discordUsername: string;
  currentGameNickname: string;
};

type ProfileTab = 'info' | 'heroes' | 'war';

type HeroLocale = 'RU' | 'EN';
type HeroRosterSortField = 'createdAt' | 'name' | 'rarity' | 'element' | 'powerGrade' | 'releaseDate';
type HeroRosterSortOrder = 'asc' | 'desc';
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
type ElementKey = 'dark' | 'fire' | 'holy' | 'ice' | 'nature';

type PublicHeroCatalogItem = {
  id: number;
  slug: string;
  name: string;
  baseHeroId?: number | null;
  isCostume?: boolean | null;
  costumeIndex?: number | null;
  previewUrl?: string | null;
  imageUrl?: string | null;
  elementName: string;
  rarityStars: number;
  heroClassName?: string | null;
  heroClassImageUrl?: string | null;
  releaseDate?: string | null;
};

type PublicHeroPageResponse = {
  items: PublicHeroCatalogItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type RosterHeroCard = {
  profileHeroId: string;
  heroId: number;
  baseHeroId: number | null;
  powerGrade: HeroPowerGrade;
  talentLevel: number;
  slug: string;
  name: string;
  rarityStars: number;
  createdAt: string;
  previewUrl: string | null;
  elementName: string | null;
  heroClassName: string | null;
  heroClassKey: HeroClassKey | null;
  releaseDate: string | null;
  isCostume: boolean;
  costumeIndex: number | null;
};

type PlayerProfileHeroPowerGradeUpdateRequest = {
  powerGrade: HeroPowerGrade;
};

type PlayerProfileHeroTalentLevelUpdateRequest = {
  talentLevel: number;
};

type PowerGradeOption = {
  value: HeroPowerGrade;
  label: string;
  imageUrl: string;
};

type IconFilterOption = {
  value: string;
  label: string;
  imageUrl?: string | null;
};

const POWER_GRADE_ASSET_BASE = '/heroes/power-grades';
const HERO_CLASS_ASSET_BASE = '/heroes/elements/classes';
const COSTUME_ICON_URL = '/dictionary-icons/costume.png';
const POWER_GRADE_IMAGE_BY_CODE: Record<HeroPowerGrade, string> = {
  FIRST_TIER: `${POWER_GRADE_ASSET_BASE}/power_grade_first_tier.png`,
  FIRST_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_first_ascension.webp`,
  SECOND_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_second_ascension.webp`,
  FULLY_ASCENDED: `${POWER_GRADE_ASSET_BASE}/power_grade_fully_ascended.webp`,
  FIRST_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_first_limit_broken.webp`,
  SECOND_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_second_limit_broken.webp`,
};
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
const HERO_ELEMENT_ICON_BY_KEY: Record<ElementKey, string> = {
  dark: '/heroes/elements/elements/herald_purple.webp',
  fire: '/heroes/elements/elements/herald_red.webp',
  holy: '/heroes/elements/elements/herald_yellow.webp',
  ice: '/heroes/elements/elements/herald_blue.webp',
  nature: '/heroes/elements/elements/herald_green.webp',
};

const POWER_GRADE_ORDER: HeroPowerGrade[] = [
  'FIRST_TIER',
  'FIRST_ASCENSION',
  'SECOND_ASCENSION',
  'FULLY_ASCENDED',
  'FIRST_LIMIT_BROKEN',
  'SECOND_LIMIT_BROKEN',
];
const POWER_GRADE_SORT_RANK: Record<HeroPowerGrade, number> = {
  FIRST_TIER: 0,
  FIRST_ASCENSION: 1,
  SECOND_ASCENSION: 2,
  FULLY_ASCENDED: 3,
  FIRST_LIMIT_BROKEN: 4,
  SECOND_LIMIT_BROKEN: 5,
};

const TALENT_LEVEL_IMAGE_URL = '/heroes/talents/talents_level.png';

const FLOATING_POPOVER_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildFloatingPopoverStyle(params: {
  triggerRect: DOMRect;
  preferredWidth: number;
  estimatedHeight: number;
  align: 'left' | 'right';
}) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(params.preferredWidth, viewportWidth - FLOATING_POPOVER_MARGIN * 2);
  const maxLeft = Math.max(FLOATING_POPOVER_MARGIN, viewportWidth - width - FLOATING_POPOVER_MARGIN);
  const leftBase =
    params.align === 'right'
      ? params.triggerRect.right - width
      : params.triggerRect.left;
  const left = clamp(leftBase, FLOATING_POPOVER_MARGIN, maxLeft);
  const canOpenBelow =
    params.triggerRect.bottom + 8 + params.estimatedHeight + FLOATING_POPOVER_MARGIN <= viewportHeight;
  const topBase = canOpenBelow
    ? params.triggerRect.bottom + 8
    : params.triggerRect.top - params.estimatedHeight - 8;
  const maxTop = Math.max(FLOATING_POPOVER_MARGIN, viewportHeight - params.estimatedHeight - FLOATING_POPOVER_MARGIN);
  const top = clamp(topBase, FLOATING_POPOVER_MARGIN, maxTop);

  return { top, left, width };
}

function getPowerGradeLabel(powerGrade: HeroPowerGrade, locale: HeroLocale): string {
  if (locale === 'RU') {
    switch (powerGrade) {
      case 'FIRST_TIER':
        return 'Первая лычка';
      case 'FIRST_ASCENSION':
        return 'Вторая лычка';
      case 'SECOND_ASCENSION':
        return 'Третья лычка';
      case 'FULLY_ASCENDED':
        return 'Четыре лычки';
      case 'FIRST_LIMIT_BROKEN':
        return 'Первый слом';
      case 'SECOND_LIMIT_BROKEN':
        return 'АльфаСлом';
      default:
        return 'Лычка';
    }
  }

  switch (powerGrade) {
    case 'FIRST_TIER':
      return 'Tier 1';
    case 'FIRST_ASCENSION':
      return 'Tier 2';
    case 'SECOND_ASCENSION':
      return 'Tier 3';
    case 'FULLY_ASCENDED':
      return 'Tier 4';
    case 'FIRST_LIMIT_BROKEN':
      return 'First limit break';
    case 'SECOND_LIMIT_BROKEN':
      return 'Second limit break';
    default:
      return 'Power grade';
  }
}

function canUseTalentEmblems(powerGrade: HeroPowerGrade): boolean {
  return powerGrade === 'FULLY_ASCENDED' || powerGrade === 'FIRST_LIMIT_BROKEN' || powerGrade === 'SECOND_LIMIT_BROKEN';
}

function buildPowerGradeOptions(locale: HeroLocale): PowerGradeOption[] {
  return POWER_GRADE_ORDER.map((value) => ({
    value,
    label: getPowerGradeLabel(value, locale),
    imageUrl: POWER_GRADE_IMAGE_BY_CODE[value],
  }));
}

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

function resolveHeroClassKeyFromImageUrl(value: string | null | undefined): HeroClassKey | null {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  for (const classKey of Object.keys(HERO_CLASS_ICON_BY_KEY) as HeroClassKey[]) {
    if (
      normalized.includes(`/${classKey}.`) ||
      normalized.includes(`\\${classKey}.`) ||
      normalized.endsWith(`${classKey}.png`)
    ) {
      return classKey;
    }
  }

  return null;
}

function resolveElementKey(value: string | null | undefined): ElementKey | null {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  if (normalized.includes('ice') || normalized.includes('лёд') || normalized.includes('лед')) return 'ice';
  if (normalized.includes('fire') || normalized.includes('огонь')) return 'fire';
  if (normalized.includes('nature') || normalized.includes('природ')) return 'nature';
  if (normalized.includes('dark') || normalized.includes('тьм')) return 'dark';
  if (normalized.includes('holy') || normalized.includes('свят')) return 'holy';

  return null;
}

function formatReleaseDate(value: string | null | undefined, locale: HeroLocale): string {
  if (!value) {
    return locale === 'RU' ? 'Без даты' : 'No date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'RU' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getReleaseDateSortValue(value: string | null | undefined): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortRosterCardList(
  cards: RosterHeroCard[],
  heroLocale: HeroLocale,
  heroSortField: HeroRosterSortField,
  heroSortOrder: HeroRosterSortOrder,
): RosterHeroCard[] {
  const sorted = [...cards];

  sorted.sort((left, right) => {
    let result = 0;

    if (heroSortField === 'name') {
      result = left.name.localeCompare(right.name, heroLocale === 'RU' ? 'ru' : 'en', {
        sensitivity: 'base',
      });
    } else if (heroSortField === 'element') {
      result = (left.elementName ?? '').localeCompare(right.elementName ?? '', heroLocale === 'RU' ? 'ru' : 'en', {
        sensitivity: 'base',
      });
      if (result === 0) {
        result = left.name.localeCompare(right.name, heroLocale === 'RU' ? 'ru' : 'en', {
          sensitivity: 'base',
        });
      }
    } else if (heroSortField === 'powerGrade') {
      result = POWER_GRADE_SORT_RANK[left.powerGrade] - POWER_GRADE_SORT_RANK[right.powerGrade];
      if (result === 0) {
        result = left.name.localeCompare(right.name, heroLocale === 'RU' ? 'ru' : 'en', {
          sensitivity: 'base',
        });
      }
    } else if (heroSortField === 'rarity') {
      result = left.rarityStars - right.rarityStars;
      if (result === 0) {
        result = left.name.localeCompare(right.name, heroLocale === 'RU' ? 'ru' : 'en', {
          sensitivity: 'base',
        });
      }
    } else if (heroSortField === 'releaseDate') {
      result = getReleaseDateSortValue(left.releaseDate) - getReleaseDateSortValue(right.releaseDate);
      if (result === 0) {
        result = left.name.localeCompare(right.name, heroLocale === 'RU' ? 'ru' : 'en', {
          sensitivity: 'base',
        });
      }
    } else {
      result = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }

    return heroSortOrder === 'asc' ? result : -result;
  });

  return sorted;
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

function CostumeCollectionBadge({
  level,
  locale,
  className,
  sizeClassName = 'h-3.5 w-3.5 sm:h-5 sm:w-5',
  textClassName = 'text-[7px] sm:text-[8px]',
}: {
  level: number;
  locale: HeroLocale;
  className: string;
  sizeClassName?: string;
  textClassName?: string;
}) {
  if (level <= 0) {
    return null;
  }

  const badgeLabel =
    level > 1
      ? `${locale === 'RU' ? 'Костюмы' : 'Costumes'} x${level}`
      : locale === 'RU'
        ? 'Костюм'
        : 'Costume';

  return (
    <div className={`pointer-events-none absolute z-10 ${className}`} aria-label={badgeLabel} title={badgeLabel}>
      <CornerIconBadge
        imageUrl={COSTUME_ICON_URL}
        alt={badgeLabel}
        className=""
        sizeClassName={sizeClassName}
      />
      {level > 1 ? (
        <span className={`absolute -right-2 -top-1 rounded-full bg-black/80 px-1 py-[1px] font-extrabold leading-none text-white shadow-[0_0_4px_rgba(0,0,0,0.9)] ${textClassName}`}>
          {`x${level}`}
        </span>
      ) : null}
    </div>
  );
}

function PowerGradeBadge({
  powerGrade,
  label,
  imageUrl,
  interactive = false,
  disabled = false,
  options = [],
  onChange,
  locale,
  sizeClassName = 'h-5 w-5 sm:h-7 sm:w-7',
}: {
  powerGrade: HeroPowerGrade;
  label: string;
  imageUrl: string;
  interactive?: boolean;
  disabled?: boolean;
  options?: PowerGradeOption[];
  onChange?: (nextPowerGrade: HeroPowerGrade) => void;
  locale: HeroLocale;
  sizeClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(interactive);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverPanelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const controlLabel = locale === 'RU' ? 'Изменить степень прокачки' : 'Change power grade';

  useEffect(() => {
    if (!interactive) {
      return;
    }

    const timer = window.setTimeout(() => {
      setHighlight(false);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [interactive, powerGrade]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePopoverPosition = () => {
      if (!triggerRef.current) {
        return;
      }

      setPopoverStyle(
        buildFloatingPopoverStyle({
          triggerRect: triggerRef.current.getBoundingClientRect(),
          preferredWidth: 192,
          estimatedHeight: 250,
          align: 'right',
        }),
      );
    };

    updatePopoverPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (
        !popoverRef.current?.contains(targetNode) &&
        !popoverPanelRef.current?.contains(targetNode)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [open]);

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-[-2px] right-[-2px] z-30 sm:bottom-[-4px] sm:right-[-4px]"
      onClick={(event) => event.stopPropagation()}
    >
      {interactive ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={disabled}
          aria-label={controlLabel}
          title={label}
          className={`transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-70 ${
            highlight ? 'animate-pulse ring-1 ring-cyan-300/60' : ''
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className={`${sizeClassName} object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.98))_drop-shadow(0_0_2px_rgba(0,0,0,0.92))_drop-shadow(0_2px_4px_rgba(15,23,42,0.8))]`} />
        </button>
      ) : (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className={`${sizeClassName} object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.98))_drop-shadow(0_0_2px_rgba(0,0,0,0.92))_drop-shadow(0_2px_4px_rgba(15,23,42,0.8))]`} />
        </div>
      )}

      {interactive && open && popoverStyle && typeof document !== 'undefined' ? createPortal(
        <div
          ref={popoverPanelRef}
          className="fixed z-[220] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-2xl backdrop-blur-sm"
          style={{ top: popoverStyle.top, left: popoverStyle.left, width: popoverStyle.width }}
        >
          <div className="mb-1 flex items-center justify-between gap-2 px-2">
            {locale === 'RU' ? 'Степень прокачки' : 'Power grade'}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              aria-label={locale === 'RU' ? 'Закрыть' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            {options.map((option) => {
              const selected = option.value === powerGrade;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (option.value !== powerGrade) {
                      onChange?.(option.value);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition ${
                    selected
                      ? 'bg-cyan-400/12 text-cyan-200'
                      : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={option.imageUrl} alt={option.label} className="h-8 w-8 rounded-md object-contain" />
                  <span className="min-w-0 flex-1 leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function TalentBadge({
  talentLevel,
  interactive = false,
  disabled = false,
  locale,
  onChange,
  sizeClassName = 'h-[22px] w-[22px] sm:h-[30px] sm:w-[30px]',
}: {
  talentLevel: number;
  interactive?: boolean;
  disabled?: boolean;
  locale: HeroLocale;
  onChange?: (nextTalentLevel: number) => void;
  sizeClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<string>(String(talentLevel));
  const [highlight, setHighlight] = useState(interactive);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverPanelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const hasVisibleGem = talentLevel > 0 || highlight;
  const controlLabel = locale === 'RU' ? 'Изменить уровень таланта' : 'Change talent level';
  const titleLabel =
    locale === 'RU'
      ? talentLevel > 0
        ? `Талант ${talentLevel}`
        : 'Талант'
      : talentLevel > 0
        ? `Talent ${talentLevel}`
        : 'Talent';

  useEffect(() => {
    setDraftValue(String(talentLevel));
  }, [talentLevel]);

  useEffect(() => {
    if (!interactive) {
      return;
    }

    const timer = window.setTimeout(() => {
      setHighlight(false);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [interactive, talentLevel]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePopoverPosition = () => {
      if (!triggerRef.current) {
        return;
      }

      setPopoverStyle(
        buildFloatingPopoverStyle({
          triggerRect: triggerRef.current.getBoundingClientRect(),
          preferredWidth: 176,
          estimatedHeight: 170,
          align: 'left',
        }),
      );
    };

    updatePopoverPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (
        !popoverRef.current?.contains(targetNode) &&
        !popoverPanelRef.current?.contains(targetNode)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const handleApply = () => {
    const parsed = Number(draftValue.trim());
    const normalized = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(25, parsed));
    setOpen(false);
    setDraftValue(String(normalized));
    if (normalized !== talentLevel) {
      onChange?.(normalized);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-[-2px] left-[-2px] z-30 sm:bottom-[-4px] sm:left-[-4px]"
      onClick={(event) => event.stopPropagation()}
    >
      {interactive ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={disabled}
          aria-label={controlLabel}
          title={titleLabel}
          className={`relative flex items-center justify-center rounded-md transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-70 ${sizeClassName} ${
            highlight && talentLevel === 0 ? 'animate-pulse' : ''
          }`}
        >
          {hasVisibleGem ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TALENT_LEVEL_IMAGE_URL}
                alt={titleLabel}
                className="h-full w-full object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.98))_drop-shadow(0_0_2px_rgba(0,0,0,0.92))_drop-shadow(0_2px_4px_rgba(15,23,42,0.8))]"
              />
              {talentLevel > 0 ? (
                <span className="absolute inset-0 flex items-center justify-center px-[3px] text-[9px] font-extrabold leading-none text-slate-950 sm:px-1 sm:text-[11px]">
                  {talentLevel}
                </span>
              ) : null}
            </>
          ) : (
            <span className="block h-full w-full rounded-md" />
          )}
        </button>
      ) : talentLevel > 0 ? (
        <div className={`relative flex items-center justify-center rounded-md ${sizeClassName}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TALENT_LEVEL_IMAGE_URL}
            alt={titleLabel}
            className="h-full w-full object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.98))_drop-shadow(0_0_2px_rgba(0,0,0,0.92))_drop-shadow(0_2px_4px_rgba(15,23,42,0.8))]"
          />
          <span className="absolute inset-0 flex items-center justify-center px-[3px] text-[9px] font-extrabold leading-none text-slate-950 sm:px-1 sm:text-[11px]">
            {talentLevel}
          </span>
        </div>
      ) : null}

      {interactive && open && popoverStyle && typeof document !== 'undefined' ? createPortal(
        <div
          ref={popoverPanelRef}
          className="fixed z-[220] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 shadow-2xl backdrop-blur-sm"
          style={{ top: popoverStyle.top, left: popoverStyle.left, width: popoverStyle.width }}
        >
          <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            {locale === 'RU' ? 'Уровень таланта' : 'Talent level'}
          </div>
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="number"
              min={0}
              max={25}
              step={1}
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleApply();
                }
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
            />
            <button
              type="button"
              onClick={handleApply}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              {locale === 'RU' ? 'OK' : 'OK'}
            </button>
          </div>
          <div className="mt-2 text-xs text-[var(--foreground-soft)]">
            {locale === 'RU' ? 'От 0 до 25' : 'From 0 to 25'}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function IconFilterSelect({
  label,
  values,
  allLabel,
  options,
  onChange,
  locale,
}: {
  label: string;
  values: string[];
  allLabel: string;
  options: IconFilterOption[];
  onChange: (nextValues: string[]) => void;
  locale: HeroLocale;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverPanelRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const selectedOptions = options.filter((option) => values.includes(option.value));
  const summaryLabel =
    selectedOptions.length === 0
      ? allLabel
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : locale === 'RU'
          ? `Выбрано: ${selectedOptions.length}`
          : `Selected: ${selectedOptions.length}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePopoverPosition = () => {
      if (!triggerRef.current) {
        return;
      }

      setPopoverStyle(
        buildFloatingPopoverStyle({
          triggerRect: triggerRef.current.getBoundingClientRect(),
          preferredWidth: 240,
          estimatedHeight: 280,
          align: 'left',
        }),
      );
    };

    updatePopoverPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (!popoverRef.current?.contains(targetNode) && !popoverPanelRef.current?.contains(targetNode)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [open]);

  return (
    <div ref={popoverRef} className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
      <span>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition hover:bg-[var(--surface-hover)]"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOptions[0]?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOptions[0].imageUrl} alt={selectedOptions[0].label} className="h-5 w-5 object-contain" />
          ) : null}
          <span className="truncate">{summaryLabel}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && popoverStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popoverPanelRef}
              className="fixed z-[220] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-2xl backdrop-blur-sm"
              style={{ top: popoverStyle.top, left: popoverStyle.left, width: popoverStyle.width }}
            >
              <div className="mb-1 flex items-center justify-between gap-2 px-2">
                <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  aria-label={locale === 'RU' ? 'Закрыть' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition ${
                    values.length === 0
                      ? 'bg-cyan-400/12 text-cyan-200'
                      : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="h-7 w-7 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)]" />
                  <span className="min-w-0 flex-1 leading-tight">{allLabel}</span>
                </button>
                {options.map((option) => {
                  const selected = values.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(
                          selected
                            ? values.filter((value) => value !== option.value)
                            : [...values, option.value],
                        );
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition ${
                        selected
                          ? 'bg-cyan-400/12 text-cyan-200'
                          : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      {option.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={option.imageUrl} alt={option.label} className="h-7 w-7 object-contain" />
                      ) : (
                        <div className="h-7 w-7 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)]" />
                      )}
                      <span className="min-w-0 flex-1 leading-tight">{option.label}</span>
                      {selected ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

type WarSlotPickerState = {
  teamIndex: number;
  slot: number;
} | null;

function buildEmptyWarTeams(): PlayerWarAttackTeamResponse[] {
  return Array.from({ length: 6 }, (_, teamIndex) => ({
    id: `local-team-${teamIndex + 1}`,
    teamIndex: teamIndex + 1,
    slots: Array.from({ length: 5 }, (_, slotIndex) => ({
      slot: slotIndex + 1,
      playerProfileHeroId: null,
    })),
  }));
}

function normalizeWarTeams(teams: PlayerWarAttackTeamResponse[]): PlayerWarAttackTeamResponse[] {
  const teamMap = new Map(teams.map((team) => [team.teamIndex, team]));

  return Array.from({ length: 6 }, (_, teamIndex) => {
    const currentTeam = teamMap.get(teamIndex + 1);
    const slotMap = new Map(currentTeam?.slots.map((slot) => [slot.slot, slot]));

    return {
      id: currentTeam?.id ?? `local-team-${teamIndex + 1}`,
      teamIndex: teamIndex + 1,
      slots: Array.from({ length: 5 }, (_, slotIndex) => ({
        slot: slotIndex + 1,
        playerProfileHeroId: slotMap.get(slotIndex + 1)?.playerProfileHeroId ?? null,
      })),
    };
  });
}

function buildWarTeamsPayload(
  teams: PlayerWarAttackTeamResponse[],
): PlayerWarAttackTeamsUpdateRequest {
  return {
    teams: teams.map((team) => ({
      teamIndex: team.teamIndex,
      slots: team.slots.map((slot) => ({
        slot: slot.slot,
        playerProfileHeroId: slot.playerProfileHeroId,
      })),
    })),
  };
}

const emptyForm: ProfileFormState = {
  firstName: '',
  lastName: '',
  telegramUsername: '',
  vkUsername: '',
  discordUsername: '',
  currentGameNickname: '',
};

function toFormState(profile: PlayerProfileResponse): ProfileFormState {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    telegramUsername: profile.telegramUsername ?? '',
    vkUsername: profile.vkUsername ?? '',
    discordUsername: profile.discordUsername ?? '',
    currentGameNickname: profile.currentGameNickname ?? '',
  };
}

function countFilledContacts(form: ProfileFormState): number {
  let filledContacts = 0;

  if (form.telegramUsername.trim()) {
    filledContacts += 1;
  }

  if (form.vkUsername.trim()) {
    filledContacts += 1;
  }

  if (form.discordUsername.trim()) {
    filledContacts += 1;
  }

  return filledContacts;
}

function HeroPreviewTile({
  profileHeroId,
  name,
  previewUrl,
  elementName,
  heroClassName,
  heroClassKey,
  powerGrade,
  costumeCollectionLevel = 0,
  locale,
  powerGradeOptions,
  powerGradeUpdating,
  talentLevel,
  talentLevelUpdating,
  onClick,
  onPowerGradeChange,
  onTalentLevelChange,
  onRemove,
  removeLabel,
}: {
  profileHeroId: string;
  name: string;
  previewUrl: string | null;
  elementName: string | null;
  heroClassName: string | null;
  heroClassKey: HeroClassKey | null;
  powerGrade: HeroPowerGrade;
  costumeCollectionLevel?: number;
  locale: HeroLocale;
  powerGradeOptions: PowerGradeOption[];
  powerGradeUpdating?: boolean;
  talentLevel: number;
  talentLevelUpdating?: boolean;
  onClick?: () => void;
  onPowerGradeChange: (profileHeroId: string, nextPowerGrade: HeroPowerGrade) => void;
  onTalentLevelChange: (profileHeroId: string, nextTalentLevel: number) => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const accentClass = getHeroPreviewAccentClass(elementName);
  const powerGradeLabel = getPowerGradeLabel(powerGrade, locale);
  const heroClassLabel = heroClassName ?? (locale === 'RU' ? 'Класс героя' : 'Hero class');
  const talentEditable = canUseTalentEmblems(powerGrade);
  const content = (
    <>
      <div className="relative overflow-visible">
        {heroClassKey ? (
          <CornerIconBadge
            imageUrl={HERO_CLASS_ICON_BY_KEY[heroClassKey]}
            alt={heroClassLabel}
            className="pointer-events-none absolute left-1 top-1 z-10 sm:left-1.5 sm:top-1.5"
          />
        ) : null}
        {costumeCollectionLevel > 0 ? (
          <CostumeCollectionBadge
            level={costumeCollectionLevel}
            locale={locale}
            className="left-1 top-5 sm:left-1.5 sm:top-7"
            />
          ) : null}
        <div className={`overflow-hidden rounded-2xl border p-[2px] ${accentClass}`}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={name}
              className="h-12 w-12 rounded-[12px] object-cover sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-24 sm:w-24 sm:text-xs">
              ?
            </div>
          )}
        </div>
        <PowerGradeBadge
          powerGrade={powerGrade}
          label={powerGradeLabel}
          imageUrl={POWER_GRADE_IMAGE_BY_CODE[powerGrade]}
          interactive
          disabled={powerGradeUpdating}
          options={powerGradeOptions}
          onChange={(nextPowerGrade) => onPowerGradeChange(profileHeroId, nextPowerGrade)}
          locale={locale}
        />
        <TalentBadge
          talentLevel={talentLevel}
          interactive={talentEditable}
          disabled={!talentEditable || talentLevelUpdating}
          locale={locale}
          onChange={(nextTalentLevel) => onTalentLevelChange(profileHeroId, nextTalentLevel)}
        />
      </div>
      <span className="line-clamp-2 min-h-[1.75rem] text-[10px] font-medium leading-tight text-[var(--foreground)] sm:min-h-[2.5rem] sm:text-sm">
        {name}
      </span>
    </>
  );

  return (
    <div className="group relative">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-center shadow-sm transition hover:bg-[var(--surface-hover)] sm:gap-2 sm:rounded-3xl sm:p-3"
        >
          {content}
        </button>
      ) : (
        <div className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-center shadow-sm sm:gap-2 sm:rounded-3xl sm:p-3">
          {content}
        </div>
      )}

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title={removeLabel}
          aria-label={removeLabel}
          className="absolute right-1.5 top-1.5 z-20 rounded-full border border-red-500/30 bg-[var(--surface-strong)] p-1.5 text-red-400 opacity-100 shadow-lg transition hover:bg-red-500/10 sm:right-2 sm:top-2 sm:p-2 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function OverviewHeroTile({
  hero,
  locale,
  costumeCollectionLevel,
}: {
  hero: RosterHeroCard;
  locale: HeroLocale;
  costumeCollectionLevel: number;
}) {
  const accentClass = getHeroPreviewAccentClass(hero.elementName);
  const heroClassLabel = hero.heroClassName ?? (locale === 'RU' ? 'Класс героя' : 'Hero class');

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 text-center shadow-sm">
      <div className="relative mx-auto w-fit overflow-visible">
        {hero.heroClassKey ? (
          <CornerIconBadge
            imageUrl={HERO_CLASS_ICON_BY_KEY[hero.heroClassKey]}
            alt={heroClassLabel}
            className="pointer-events-none absolute left-1 top-1 z-10"
            sizeClassName="h-3 w-3 sm:h-4 sm:w-4"
          />
        ) : null}
        {costumeCollectionLevel > 0 ? (
          <CostumeCollectionBadge
            level={costumeCollectionLevel}
            locale={locale}
            className="left-1 top-4 sm:top-5"
            sizeClassName="h-3 w-3 sm:h-4 sm:w-4"
            textClassName="text-[6px] sm:text-[7px]"
          />
        ) : null}
        <div className={`overflow-hidden rounded-md border p-[2px] ${accentClass}`}>
          {hero.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.previewUrl} alt={hero.name} className="h-14 w-14 rounded-[6px] object-cover sm:h-16 sm:w-16" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-[6px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-16 sm:w-16">
              ?
            </div>
          )}
        </div>
        <PowerGradeBadge
          powerGrade={hero.powerGrade}
          label={getPowerGradeLabel(hero.powerGrade, locale)}
          imageUrl={POWER_GRADE_IMAGE_BY_CODE[hero.powerGrade]}
          locale={locale}
          sizeClassName="h-4 w-4 sm:h-5 sm:w-5"
        />
        <TalentBadge talentLevel={hero.talentLevel} locale={locale} sizeClassName="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
      </div>
      <div className="mt-1 line-clamp-2 min-h-[1.25rem] text-[8px] font-semibold leading-tight text-[var(--foreground)] sm:min-h-[1.45rem] sm:text-[9px]">
        {hero.name}
      </div>
    </div>
  );
}

function AddHeroTile({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-2 text-center shadow-sm transition hover:bg-[var(--surface-hover)] sm:gap-3 sm:rounded-3xl sm:p-3"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] shadow-[inset_0_8px_20px_rgba(255,255,255,0.05),0_12px_26px_rgba(0,0,0,0.18)] sm:h-24 sm:w-24 sm:rounded-2xl">
        <Plus className="h-5 w-5 opacity-75 sm:h-8 sm:w-8" />
      </div>
      <span className="text-[10px] font-semibold leading-tight text-[var(--foreground)] sm:text-sm">
        {label}
      </span>
    </button>
  );
}

function WarHeroSlot({
  hero,
  locale,
  label,
  removeLabel,
  compact,
  costumeCollectionLevel = 0,
  onClick,
  onRemove,
}: {
  hero: RosterHeroCard | null;
  locale: HeroLocale;
  label: string;
  removeLabel: string;
  compact: boolean;
  costumeCollectionLevel?: number;
  onClick: () => void;
  onRemove?: () => void;
}) {
  if (!hero) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex aspect-[0.72] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-center shadow-sm transition hover:bg-[var(--surface-hover)] ${
          compact ? 'p-1.5 sm:p-2' : 'p-2 sm:p-3'
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] ${
            compact ? 'h-9 w-9 sm:h-12 sm:w-12' : 'h-12 w-12 sm:h-16 sm:w-16'
          }`}
        >
          <Plus className={compact ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-5 w-5 sm:h-6 sm:w-6'} />
        </div>
        <span className={compact ? 'text-[9px] font-semibold leading-tight sm:text-[10px]' : 'text-[10px] font-semibold leading-tight sm:text-xs'}>
          {label}
        </span>
      </button>
    );
  }

  const accentClass = getHeroPreviewAccentClass(hero.elementName);
  const heroClassLabel = hero.heroClassName ?? (locale === 'RU' ? 'Класс героя' : 'Hero class');

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={`flex aspect-[0.72] w-full flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center shadow-sm transition hover:bg-[var(--surface-hover)] ${
          compact ? 'gap-1 p-1.5 sm:p-2' : 'gap-1.5 p-2 sm:p-3'
        }`}
      >
        <div className="relative overflow-visible">
          {hero.heroClassKey ? (
            <CornerIconBadge
              imageUrl={HERO_CLASS_ICON_BY_KEY[hero.heroClassKey]}
              alt={heroClassLabel}
              className="pointer-events-none absolute left-1 top-1 z-10"
            />
          ) : null}
          {costumeCollectionLevel > 0 ? (
            <CostumeCollectionBadge
              level={costumeCollectionLevel}
              locale={locale}
              className="left-1 top-7"
              textClassName="text-[6px] sm:text-[7px]"
            />
          ) : null}
          <div className={`overflow-hidden rounded-2xl border p-[2px] ${accentClass}`}>
            {hero.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.previewUrl}
                alt={hero.name}
                className={compact ? 'h-12 w-12 rounded-[12px] object-cover sm:h-16 sm:w-16' : 'h-14 w-14 rounded-[12px] object-cover sm:h-20 sm:w-20'}
              />
            ) : (
              <div className={compact ? 'flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-16 sm:w-16' : 'flex h-14 w-14 items-center justify-center rounded-[12px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-20 sm:w-20'}>
                ?
              </div>
            )}
          </div>
          <PowerGradeBadge
            powerGrade={hero.powerGrade}
            label={getPowerGradeLabel(hero.powerGrade, locale)}
            imageUrl={POWER_GRADE_IMAGE_BY_CODE[hero.powerGrade]}
            locale={locale}
          />
          <TalentBadge
            talentLevel={hero.talentLevel}
            locale={locale}
          />
        </div>

        <span className={compact ? 'line-clamp-2 min-h-[1.4rem] text-[8px] font-semibold leading-tight text-[var(--foreground)] sm:min-h-[1.75rem] sm:text-[10px]' : 'line-clamp-2 min-h-[1.5rem] text-[9px] font-semibold leading-tight text-[var(--foreground)] sm:min-h-[2rem] sm:text-xs'}>
          {hero.name}
        </span>
      </button>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title={removeLabel}
          aria-label={removeLabel}
          className="absolute right-1 top-1 rounded-full border border-red-500/30 bg-[var(--surface-strong)] p-1 text-red-400 opacity-100 shadow-lg transition hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

export default function ProfilePageClient() {
  const { authenticated, loading: authLoading, login } = useAuth();
  const { apiJson, apiPutJson, apiPostJson, apiDeleteVoid } = useApi();
  const { messages, locale } = useI18n();

  const heroLocale: HeroLocale = locale === 'ru' ? 'RU' : 'EN';

  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompletionHelpOpen, setIsCompletionHelpOpen] = useState(false);

  const [profileHeroes, setProfileHeroes] = useState<PlayerProfileHeroResponse[]>([]);
  const [loadingProfileHeroes, setLoadingProfileHeroes] = useState(false);
  const [heroSortField, setHeroSortField] = useState<HeroRosterSortField>('createdAt');
  const [heroSortOrder, setHeroSortOrder] = useState<HeroRosterSortOrder>('desc');
  const [powerGradeFilters, setPowerGradeFilters] = useState<HeroPowerGrade[]>([]);
  const [elementFilters, setElementFilters] = useState<string[]>([]);
  const [heroClassFilters, setHeroClassFilters] = useState<string[]>([]);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewPage, setOverviewPage] = useState(0);
  const [overviewViewport, setOverviewViewport] = useState({ width: 0, height: 0 });
  const [heroFiltersExpanded, setHeroFiltersExpanded] = useState(true);
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorQuery, setSelectorQuery] = useState('');
  const [selectorPage, setSelectorPage] = useState(0);
  const [selectorPageSize, setSelectorPageSize] = useState(18);
  const [selectorResult, setSelectorResult] = useState<PublicHeroPageResponse | null>(null);
  const [loadingSelector, setLoadingSelector] = useState(false);
  const [loadingMoreSelector, setLoadingMoreSelector] = useState(false);
  const [selectorError, setSelectorError] = useState<string | null>(null);
  const [addingHeroId, setAddingHeroId] = useState<number | null>(null);
  const [removingProfileHeroId, setRemovingProfileHeroId] = useState<string | null>(null);
  const [updatingPowerGradeHeroId, setUpdatingPowerGradeHeroId] = useState<string | null>(null);
  const [updatingTalentLevelHeroId, setUpdatingTalentLevelHeroId] = useState<string | null>(null);
  const [rosterHeroMap, setRosterHeroMap] = useState<Map<number, PublicHeroCatalogItem>>(new Map());
  const [warTeams, setWarTeams] = useState<PlayerWarAttackTeamResponse[]>(buildEmptyWarTeams);
  const [loadingWarTeams, setLoadingWarTeams] = useState(false);
  const [savingWarTeams, setSavingWarTeams] = useState(false);
  const [warSaveError, setWarSaveError] = useState<string | null>(null);
  const [warSlotPicker, setWarSlotPicker] = useState<WarSlotPickerState>(null);
  const [warCompactMode, setWarCompactMode] = useState(false);
  const [selectedHeroSlug, setSelectedHeroSlug] = useState<string | null>(null);
  const [selectedHeroCard, setSelectedHeroCard] = useState<PublicHeroCardItem | null>(null);
  const [selectedHeroDetails, setSelectedHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedHeroVariants, setSelectedHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [selectedHeroLoading, setSelectedHeroLoading] = useState(false);
  const [selectedHeroError, setSelectedHeroError] = useState<string | null>(null);
  const selectorInputRef = useRef<HTMLInputElement | null>(null);
  const selectorScrollRef = useRef<HTMLDivElement | null>(null);
  const selectorScrollRestoreRef = useRef<number | null>(null);
  const warSaveQueuedRef = useRef<PlayerWarAttackTeamsUpdateRequest | null>(null);
  const warSaveInFlightRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authenticated) {
      setLoading(false);
      setProfile(null);
      setForm(emptyForm);
      setProfileHeroes([]);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await apiJson<PlayerProfileResponse>('/api/v1/profile/me');

        if (cancelled) {
          return;
        }

        setProfile(response);
        setForm(toFormState(response));
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError) {
          setLoadError(error.message || messages.profile.loadError);
        } else {
          setLoadError(messages.profile.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authLoading, authenticated, messages.profile.loadError]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let cancelled = false;

    const loadProfileHeroes = async () => {
      setLoadingProfileHeroes(true);

      try {
        const response = await apiJson<PlayerProfileHeroResponse[]>('/api/v1/profile/me/heroes');

        if (!cancelled) {
          setProfileHeroes(response);
        }
      } catch {
        if (!cancelled) {
          setProfileHeroes([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfileHeroes(false);
        }
      }
    };

    void loadProfileHeroes();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authenticated]);

  useEffect(() => {
    if (!authenticated) {
      setWarTeams(buildEmptyWarTeams());
      return;
    }

    let cancelled = false;

    const loadWarTeams = async () => {
      setLoadingWarTeams(true);
      setWarSaveError(null);

      try {
        const response = await apiJson<PlayerWarAttackTeamsResponse>('/api/v1/profile/me/war-attack-teams');

        if (!cancelled) {
          setWarTeams(normalizeWarTeams(response.teams));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setWarTeams(buildEmptyWarTeams());

        if (error instanceof ApiError) {
          setWarSaveError(error.message || messages.profile.warSaveError);
        } else {
          setWarSaveError(messages.profile.warSaveError);
        }
      } finally {
        if (!cancelled) {
          setLoadingWarTeams(false);
        }
      }
    };

    void loadWarTeams();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authenticated, messages.profile.warSaveError]);

  useEffect(() => {
    if (!heroModalOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectorPage(0);
      setSelectorQuery(selectorSearch.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [heroModalOpen, selectorSearch]);

  useEffect(() => {
    if (!heroModalOpen) {
      return;
    }

    const width = window.innerWidth;
    const columns =
      width >= 1280 ? 6
      : width >= 1024 ? 4
      : width >= 640 ? 3
      : 2;
    const availableHeight = Math.max(window.innerHeight - 320, 280);
    const rows = Math.max(2, Math.floor(availableHeight / 180));
    setSelectorPageSize(Math.min(36, Math.max(columns * rows, 12)));

    const focusTimer = window.setTimeout(() => {
      selectorInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [heroModalOpen]);

  useEffect(() => {
    const syncWarCompactMode = () => {
      setWarCompactMode(window.innerWidth < 520);
    };

    syncWarCompactMode();
    window.addEventListener('resize', syncWarCompactMode);

    return () => {
      window.removeEventListener('resize', syncWarCompactMode);
    };
  }, []);

  useEffect(() => {
    if (!heroModalOpen) {
      return;
    }

    let cancelled = false;

    const loadSelector = async () => {
      const isAppending = selectorPage > 0;
      if (isAppending) {
        setLoadingMoreSelector(true);
      } else {
        setLoadingSelector(true);
      }
      setSelectorError(null);

      try {
        const params = new URLSearchParams({
          page: String(selectorPage),
          size: String(selectorPageSize),
          language: heroLocale,
        });

        if (selectorQuery) {
          params.set('search', selectorQuery);
        }

        const response = await apiJson<PublicHeroPageResponse>(`/api/v1/public/heroes?${params.toString()}`);

        if (!cancelled) {
          setSelectorResult((current) => {
            if (selectorPage === 0 || !current) {
              return response;
            }

            return {
              ...response,
              items: [...current.items, ...response.items],
            };
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError) {
          setSelectorError(error.message);
        } else {
          setSelectorError(messages.profile.noHeroesFound);
        }
      } finally {
        if (!cancelled) {
          if (isAppending) {
            setLoadingMoreSelector(false);
          } else {
            setLoadingSelector(false);
          }
        }
      }
    };

    void loadSelector();

    return () => {
      cancelled = true;
    };
  }, [apiJson, heroLocale, heroModalOpen, messages.profile.noHeroesFound, selectorPage, selectorPageSize, selectorQuery]);

  useEffect(() => {
    if (selectorScrollRestoreRef.current === null) {
      return;
    }

    selectorScrollRef.current?.scrollTo({
      top: selectorScrollRestoreRef.current,
      behavior: 'auto',
    });
    selectorScrollRestoreRef.current = null;
  }, [selectorResult, loadingSelector]);

  const uniqueHeroIds = useMemo(() => {
    return Array.from(new Set(profileHeroes.map((item) => item.heroId)));
  }, [profileHeroes]);

  useEffect(() => {
    if (!authenticated || uniqueHeroIds.length === 0) {
      return;
    }

    let cancelled = false;

    const loadRosterHeroes = async () => {
      try {
        const missingIds = uniqueHeroIds.filter((heroId) => !rosterHeroMap.has(heroId));
        if (missingIds.length === 0) {
          return;
        }

        const response = await apiPostJson<{ heroIds: number[] }, PublicHeroCatalogItem[]>(
          `/api/v1/public/heroes/batch?language=${heroLocale}`,
          { heroIds: missingIds },
        );

        if (!cancelled && response.length > 0) {
          setRosterHeroMap((current) => {
            const next = new Map(current);
            for (const item of response) {
              next.set(item.id, item);
            }
            return next;
          });
        }
      } catch {
        // no-op, roster can still show fallback labels until data becomes available
      }
    };

    void loadRosterHeroes();

    return () => {
      cancelled = true;
    };
  }, [apiPostJson, authenticated, heroLocale, rosterHeroMap, uniqueHeroIds]);

  useEffect(() => {
    setRosterHeroMap(new Map());
  }, [heroLocale]);

  useEffect(() => {
    if (!selectedHeroSlug) {
      setSelectedHeroCard(null);
      setSelectedHeroDetails(null);
      setSelectedHeroVariants(null);
      setSelectedHeroError(null);
      setSelectedHeroLoading(false);
      return;
    }

    let cancelled = false;

    const loadSelectedHero = async () => {
      setSelectedHeroLoading(true);
      setSelectedHeroError(null);
      setSelectedHeroCard(null);
      setSelectedHeroDetails(null);
      setSelectedHeroVariants(null);

      try {
        const response = await apiJson<PublicHeroVariantsItem>(
          `/api/v1/public/heroes/${selectedHeroSlug}/variants?language=${heroLocale}`,
        );

        if (!cancelled) {
          const currentHero = response.currentHero;
          const rosterHero = rosterHeroMap.get(currentHero.id);

          setSelectedHeroDetails(currentHero);
          setSelectedHeroVariants(response);
          setSelectedHeroCard({
            id: currentHero.id,
            slug: currentHero.slug,
            name: currentHero.name,
            imageUrl: currentHero.imageUrl ?? rosterHero?.imageUrl ?? null,
            previewUrl: currentHero.previewUrl ?? rosterHero?.previewUrl ?? currentHero.imageUrl ?? rosterHero?.imageUrl ?? null,
            elementName: currentHero.element?.name ?? rosterHero?.elementName ?? '',
            rarityName: '',
            rarityStars: currentHero.rarity?.stars ?? rosterHero?.rarityStars ?? 0,
            heroClassName: currentHero.heroClass?.name ?? '',
            manaSpeedName: currentHero.manaSpeed?.name ?? '',
            familyName: currentHero.family?.name ?? null,
            alphaTalentName: currentHero.alphaTalent?.name ?? null,
            baseAttack: currentHero.baseAttack ?? null,
            baseArmor: currentHero.baseArmor ?? null,
            baseHp: currentHero.baseHp ?? null,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError) {
          setSelectedHeroError(error.message);
        } else {
          setSelectedHeroError(messages.profile.loadError);
        }
      } finally {
        if (!cancelled) {
          setSelectedHeroLoading(false);
        }
      }
    };

    void loadSelectedHero();

    return () => {
      cancelled = true;
    };
  }, [apiJson, heroLocale, messages.profile.loadError, rosterHeroMap, selectedHeroSlug]);

  const rosterCards = useMemo<RosterHeroCard[]>(() => {
    return profileHeroes.map((item) => {
      const hero = rosterHeroMap.get(item.heroId);

      return {
        profileHeroId: item.id,
        heroId: item.heroId,
        baseHeroId: hero?.baseHeroId ?? null,
        powerGrade: item.powerGrade,
        talentLevel: item.talentLevel,
        slug: hero?.slug ?? String(item.heroId),
        name: hero?.name ?? `Hero #${item.heroId}`,
        rarityStars: hero?.rarityStars ?? 0,
        createdAt: item.createdAt,
        previewUrl: hero?.previewUrl ?? hero?.imageUrl ?? null,
        elementName: hero?.elementName ?? null,
        heroClassName: hero?.heroClassName ?? null,
        heroClassKey:
          resolveHeroClassKeyFromImageUrl(hero?.heroClassImageUrl) ??
          resolveHeroClassKey(hero?.heroClassName),
        releaseDate: hero?.releaseDate ?? null,
        isCostume: hero?.isCostume === true,
        costumeIndex: hero?.costumeIndex ?? null,
      };
    });
  }, [profileHeroes, rosterHeroMap]);
  const costumeCollectionLevelByGroup = useMemo(() => {
    const next = new Map<number, number>();

    for (const hero of rosterCards) {
      const costumeGroupId = hero.baseHeroId ?? hero.heroId;
      const currentLevel = next.get(costumeGroupId) ?? 0;
      const heroLevel = hero.isCostume ? Math.max(hero.costumeIndex ?? 1, 1) : 0;
      next.set(costumeGroupId, Math.max(currentLevel, heroLevel));
    }

    return next;
  }, [rosterCards]);

  const filteredRosterCards = useMemo(() => {
    const normalizedSearchQuery = heroSearchQuery.trim().toLocaleLowerCase();

    return rosterCards.filter((hero) => {
      if (powerGradeFilters.length > 0 && !powerGradeFilters.includes(hero.powerGrade)) {
        return false;
      }

      if (elementFilters.length > 0 && !elementFilters.includes(hero.elementName ?? '')) {
        return false;
      }

      if (heroClassFilters.length > 0 && !heroClassFilters.includes(hero.heroClassName ?? '')) {
        return false;
      }

      if (normalizedSearchQuery && !hero.name.toLocaleLowerCase().includes(normalizedSearchQuery)) {
        return false;
      }

      return true;
    });
  }, [elementFilters, heroClassFilters, heroSearchQuery, powerGradeFilters, rosterCards]);

  const allSortedRosterCards = useMemo<RosterHeroCard[]>(
    () => sortRosterCardList(rosterCards, heroLocale, heroSortField, heroSortOrder),
    [heroLocale, heroSortField, heroSortOrder, rosterCards],
  );
  const sortedRosterCards = useMemo<RosterHeroCard[]>(() => {
    return sortRosterCardList(filteredRosterCards, heroLocale, heroSortField, heroSortOrder);
  }, [filteredRosterCards, heroLocale, heroSortField, heroSortOrder]);

  const rosterHeroCardMap = useMemo(() => {
    return new Map(rosterCards.map((hero) => [hero.profileHeroId, hero]));
  }, [rosterCards]);
  const powerGradeOptions = useMemo(() => buildPowerGradeOptions(heroLocale), [heroLocale]);
  const powerGradeFilterOptions = useMemo<IconFilterOption[]>(
    () => powerGradeOptions.map((option) => ({ value: option.value, label: option.label, imageUrl: option.imageUrl })),
    [powerGradeOptions],
  );
  const elementFilterOptions = useMemo<IconFilterOption[]>(
    () =>
      Array.from(
        new Set(rosterCards.map((hero) => hero.elementName).filter((value): value is string => Boolean(value))),
      )
        .sort((left, right) => left.localeCompare(right, heroLocale === 'RU' ? 'ru' : 'en', { sensitivity: 'base' }))
        .map((option) => ({
          value: option,
          label: option,
          imageUrl: (() => {
            const key = resolveElementKey(option);
            return key ? HERO_ELEMENT_ICON_BY_KEY[key] : null;
          })(),
        })),
    [heroLocale, rosterCards],
  );
  const heroClassFilterOptions = useMemo<IconFilterOption[]>(
    () =>
      Array.from(
        new Set(rosterCards.map((hero) => hero.heroClassName).filter((value): value is string => Boolean(value))),
      )
        .sort((left, right) => left.localeCompare(right, heroLocale === 'RU' ? 'ru' : 'en', { sensitivity: 'base' }))
        .map((option) => ({
          value: option,
          label: option,
          imageUrl: (() => {
            const key = resolveHeroClassKey(option);
            return key ? HERO_CLASS_ICON_BY_KEY[key] : null;
          })(),
        })),
    [heroLocale, rosterCards],
  );
  const overviewIdealColumnCount = useMemo(
    () => Math.max(1, Math.ceil(Math.sqrt(sortedRosterCards.length || 1))),
    [sortedRosterCards.length],
  );
  const overviewTileWidth = overviewViewport.width > 0 && overviewViewport.width < 640 ? 72 : 84;
  const overviewTileGap = overviewViewport.width > 0 && overviewViewport.width < 640 ? 4 : 6;
  const overviewTileHeight = overviewViewport.width > 0 && overviewViewport.width < 640 ? 92 : 106;
  const overviewMaxColumns = Math.max(
    1,
    Math.floor(Math.max(overviewViewport.width - 48, overviewTileWidth) / (overviewTileWidth + overviewTileGap)),
  );
  const overviewColumnCount = Math.max(1, Math.min(overviewIdealColumnCount, overviewMaxColumns));
  const overviewMaxRows = Math.max(
    1,
    Math.floor(Math.max(overviewViewport.height - 220, overviewTileHeight) / (overviewTileHeight + overviewTileGap)),
  );
  const overviewPageSize = Math.max(1, overviewColumnCount * overviewMaxRows);
  const overviewPageCount = Math.max(1, Math.ceil(sortedRosterCards.length / overviewPageSize));
  const overviewPageItems = useMemo(() => {
    const start = overviewPage * overviewPageSize;
    return sortedRosterCards.slice(start, start + overviewPageSize);
  }, [overviewPage, overviewPageSize, sortedRosterCards]);
  const overviewSubtitle =
    locale === 'ru'
      ? `\u0413\u0435\u0440\u043e\u0438: ${sortedRosterCards.length}${overviewPageCount > 1 ? ` \u2022 \u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430 ${overviewPage + 1}/${overviewPageCount}` : ''}`
      : `Heroes: ${sortedRosterCards.length}${overviewPageCount > 1 ? ` • Page ${overviewPage + 1}/${overviewPageCount}` : ''}`;

  const usedWarHeroIds = useMemo(() => {
    return new Set(
      warTeams.flatMap((team) =>
        team.slots
          .map((slot) => slot.playerProfileHeroId)
          .filter((playerProfileHeroId): playerProfileHeroId is string => playerProfileHeroId !== null),
      ),
    );
  }, [warTeams]);

  const usedWarHeroCount = usedWarHeroIds.size;

  const availableWarRosterCards = useMemo(() => {
    if (!warSlotPicker) {
      return [];
    }

    const selectedSlotHeroId =
      warTeams
        .find((team) => team.teamIndex === warSlotPicker.teamIndex)
        ?.slots.find((slot) => slot.slot === warSlotPicker.slot)?.playerProfileHeroId ?? null;

    return allSortedRosterCards.filter(
      (hero) => hero.profileHeroId === selectedSlotHeroId || !usedWarHeroIds.has(hero.profileHeroId),
    );
  }, [allSortedRosterCards, usedWarHeroIds, warSlotPicker, warTeams]);

  const queueWarTeamsSave = useCallback(async (nextTeams: PlayerWarAttackTeamResponse[]) => {
    const payload = buildWarTeamsPayload(nextTeams);
    warSaveQueuedRef.current = payload;

    if (warSaveInFlightRef.current) {
      return;
    }

    warSaveInFlightRef.current = true;
    setSavingWarTeams(true);

    try {
      while (warSaveQueuedRef.current) {
        const nextPayload = warSaveQueuedRef.current;
        warSaveQueuedRef.current = null;

        const response = await apiPutJson<PlayerWarAttackTeamsUpdateRequest, PlayerWarAttackTeamsResponse>(
          '/api/v1/profile/me/war-attack-teams',
          nextPayload,
        );

        setWarTeams(normalizeWarTeams(response.teams));
        setWarSaveError(null);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setWarSaveError(error.message || messages.profile.warSaveError);
      } else {
        setWarSaveError(messages.profile.warSaveError);
      }
    } finally {
      warSaveInFlightRef.current = false;
      setSavingWarTeams(false);
    }
  }, [apiPutJson, messages.profile.warSaveError]);

  useEffect(() => {
    if (loadingProfileHeroes || loadingWarTeams) {
      return;
    }

    const validProfileHeroIds = new Set(profileHeroes.map((hero) => hero.id));
    let changed = false;

    const sanitizedTeams = warTeams.map((team) => ({
      ...team,
      slots: team.slots.map((slot) => {
        if (slot.playerProfileHeroId && !validProfileHeroIds.has(slot.playerProfileHeroId)) {
          changed = true;
          return {
            ...slot,
            playerProfileHeroId: null,
          };
        }

        return slot;
      }),
    }));

    if (changed) {
      setWarTeams(sanitizedTeams);
      void queueWarTeamsSave(sanitizedTeams);
    }
  }, [loadingProfileHeroes, loadingWarTeams, profileHeroes, queueWarTeamsSave, warTeams]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.currentGameNickname.trim()) {
      setSaveError(
        locale === 'ru'
          ? 'Игровой ник обязателен.'
          : 'Game nickname is required.',
      );
      return;
    }

    if (countFilledContacts(form) < 2) {
      setSaveError(
        locale === 'ru'
          ? 'Нужно заполнить минимум 2 из 3 контактов: Telegram, VK, Discord.'
          : 'Fill at least 2 of 3 contact channels: Telegram, VK, Discord.',
      );
      return;
    }

    const payload: PlayerProfileUpdateRequest = {
      firstName: form.firstName,
      lastName: form.lastName,
      telegramUsername: form.telegramUsername,
      vkUsername: form.vkUsername,
      discordUsername: form.discordUsername,
      currentGameNickname: form.currentGameNickname,
    };

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await apiPutJson<PlayerProfileUpdateRequest, PlayerProfileResponse>(
        '/api/v1/profile/me',
        payload,
      );

      setProfile(response);
      setForm(toFormState(response));
      setSaveMessage(messages.profile.saveSuccess);
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setSaving(false);
    }
  };

  const openHeroModal = () => {
    setHeroModalOpen(true);
    setSelectorSearch('');
    setSelectorQuery('');
    setSelectorPage(0);
    setSelectorError(null);
    setSelectorResult(null);
    selectorScrollRestoreRef.current = 0;
  };

  const handleLoadMoreHeroes = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loadingMoreSelector || loadingSelector || !selectorResult?.hasNext) {
      return;
    }

    selectorScrollRestoreRef.current = selectorScrollRef.current?.scrollTop ?? 0;
    event.currentTarget.blur();
    setSelectorPage((current) => current + 1);
  };

  const openWarSlotPicker = (teamIndex: number, slot: number) => {
    setWarSlotPicker({
      teamIndex,
      slot,
    });
    setSaveError(null);
    setWarSaveError(null);
  };

  const handleAssignWarHero = async (profileHeroId: string) => {
    if (!warSlotPicker) {
      return;
    }

    const nextTeams = warTeams.map((team) => {
      if (team.teamIndex !== warSlotPicker.teamIndex) {
        return team;
      }

      return {
        ...team,
        slots: team.slots.map((slot) =>
          slot.slot === warSlotPicker.slot
            ? { ...slot, playerProfileHeroId: profileHeroId }
            : slot,
        ),
      };
    });

    setWarTeams(nextTeams);
    setWarSlotPicker(null);
    await queueWarTeamsSave(nextTeams);
  };

  const handleClearWarSlot = async (teamIndex: number, slotIndex: number) => {
    const nextTeams = warTeams.map((team) => {
      if (team.teamIndex !== teamIndex) {
        return team;
      }

      return {
        ...team,
        slots: team.slots.map((slot) =>
          slot.slot === slotIndex
            ? { ...slot, playerProfileHeroId: null }
            : slot,
        ),
      };
    });

    setWarTeams(nextTeams);
    await queueWarTeamsSave(nextTeams);
  };

  const handleClearWarTeam = async (teamIndex: number) => {
    const nextTeams = warTeams.map((team) => {
      if (team.teamIndex !== teamIndex) {
        return team;
      }

      return {
        ...team,
        slots: team.slots.map((slot) => ({
          ...slot,
          playerProfileHeroId: null,
        })),
      };
    });

    setWarTeams(nextTeams);
    await queueWarTeamsSave(nextTeams);
  };

  const handleClearAllWarTeams = async () => {
    const nextTeams = normalizeWarTeams(buildEmptyWarTeams());
    setWarTeams(nextTeams);
    await queueWarTeamsSave(nextTeams);
  };

  const handleAddHero = async (heroId: number) => {
    setAddingHeroId(heroId);

    try {
      const response = await apiPostJson<{ heroId: number }, PlayerProfileHeroResponse>(
        '/api/v1/profile/me/heroes',
        { heroId },
      );

      const selectedHero = selectorResult?.items.find((item) => item.id === heroId) ?? null;
      if (selectedHero) {
        setRosterHeroMap((current) => {
          const next = new Map(current);
          next.set(heroId, selectedHero);
          return next;
        });
      }

      setProfileHeroes((current) => [...current, response]);
      setHeroModalOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setAddingHeroId(null);
    }
  };

  const handleOpenRosterHero = (slug: string) => {
    setSelectedHeroSlug(slug);
  };

  const handleCloseSelectedHero = () => {
    setSelectedHeroSlug(null);
  };

  const resetHeroFilters = () => {
    setPowerGradeFilters([]);
    setElementFilters([]);
    setHeroClassFilters([]);
    setHeroSearchQuery('');
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setHeroFiltersExpanded(false);
    }
  }, []);

  useEffect(() => {
    if (!overviewOpen) {
      return;
    }

    const updateViewport = () => {
      setOverviewViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, [overviewOpen]);

  useEffect(() => {
    setOverviewPage(0);
  }, [overviewOpen, sortedRosterCards]);

  useEffect(() => {
    if (overviewPage >= overviewPageCount) {
      setOverviewPage(Math.max(0, overviewPageCount - 1));
    }
  }, [overviewPage, overviewPageCount]);

  const handleRemoveHero = async (profileHeroId: string) => {
    setRemovingProfileHeroId(profileHeroId);

    try {
      await apiDeleteVoid(`/api/v1/profile/me/heroes/${profileHeroId}`);
      setProfileHeroes((current) => current.filter((item) => item.id !== profileHeroId));
      const nextTeams = warTeams.map((team) => ({
        ...team,
        slots: team.slots.map((slot) =>
          slot.playerProfileHeroId === profileHeroId
            ? { ...slot, playerProfileHeroId: null }
            : slot,
        ),
      }));
      setWarTeams(nextTeams);
      await queueWarTeamsSave(nextTeams);
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setRemovingProfileHeroId(null);
    }
  };

  const handleUpdateHeroPowerGrade = async (profileHeroId: string, nextPowerGrade: HeroPowerGrade) => {
    setUpdatingPowerGradeHeroId(profileHeroId);

    try {
      const response = await apiPutJson<
        PlayerProfileHeroPowerGradeUpdateRequest,
        PlayerProfileHeroResponse
      >(`/api/v1/profile/me/heroes/${profileHeroId}/power-grade`, {
        powerGrade: nextPowerGrade,
      });

      setProfileHeroes((current) =>
        current.map((hero) => (hero.id === profileHeroId ? response : hero)),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setUpdatingPowerGradeHeroId(null);
    }
  };

  const handleUpdateHeroTalentLevel = async (profileHeroId: string, nextTalentLevel: number) => {
    const hero = profileHeroes.find((item) => item.id === profileHeroId) ?? null;
    if (hero && !canUseTalentEmblems(hero.powerGrade)) {
      return;
    }

    setUpdatingTalentLevelHeroId(profileHeroId);

    try {
      const response = await apiPutJson<
        PlayerProfileHeroTalentLevelUpdateRequest,
        PlayerProfileHeroResponse
      >(`/api/v1/profile/me/heroes/${profileHeroId}/talent-level`, {
        talentLevel: nextTalentLevel,
      });

      setProfileHeroes((current) =>
        current.map((hero) => (hero.id === profileHeroId ? response : hero)),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setUpdatingTalentLevelHeroId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-4 text-sm text-[var(--foreground-muted)] shadow-lg">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
          <span>{messages.profile.loading}</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          {messages.profile.signInTitle}
        </h1>
        <p className="mt-3 text-base text-[var(--foreground-soft)]">
          {messages.profile.signInDescription}
        </p>
        <button
          type="button"
          onClick={login}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {messages.navbar.login}
        </button>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          {messages.profile.pageTitle}
        </h1>

        <div className="relative self-start">
          <div
            className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold ${
              profile?.status === 'COMPLETE'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
            }`}
          >
            {profile?.status === 'COMPLETE' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            <span>
              {profile?.status === 'COMPLETE'
                ? messages.profile.statusComplete
                : messages.profile.statusIncomplete}
            </span>
            {profile?.status !== 'COMPLETE' ? (
              <button
                type="button"
                onClick={() => setIsCompletionHelpOpen((prev) => !prev)}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-200 transition hover:bg-amber-300/20"
                aria-label={messages.profile.requiredForComplete}
                title={messages.profile.requiredForComplete}
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {profile?.status !== 'COMPLETE' && isCompletionHelpOpen ? (
            <div className="absolute right-0 top-full z-20 mt-3 w-80 rounded-2xl border border-amber-400/25 bg-[var(--surface-strong)] p-4 text-sm shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[var(--foreground)]">
                    {messages.profile.requiredForComplete}
                  </div>
                  <p className="mt-2 leading-6 text-[var(--foreground-soft)]">
                    {messages.profile.completionHint}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompletionHelpOpen(false)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  aria-label={locale === 'ru' ? 'Закрыть' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-6 inline-flex rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'info'
              ? 'bg-cyan-400/10 text-cyan-300'
              : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
          }`}
        >
          {messages.profile.tabInfo}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('heroes')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'heroes'
              ? 'bg-cyan-400/10 text-cyan-300'
              : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
          }`}
        >
          {messages.profile.tabHeroes}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('war')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'war'
              ? 'bg-cyan-400/10 text-cyan-300'
              : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
          }`}
        >
          {messages.profile.tabWar}
        </button>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      ) : null}

      {saveMessage ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {saveMessage}
        </div>
      ) : null}

      {saveError ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {saveError}
        </div>
      ) : null}

      {activeTab === 'info' ? (
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.emailLabel}
                </span>
                <input
                  value={profile?.email ?? ''}
                  disabled
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground-soft)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.gameNicknameLabel}
                </span>
                <input
                  value={form.currentGameNickname}
                  onChange={(event) => handleChange('currentGameNickname', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.firstNameLabel}
                </span>
                <input
                  value={form.firstName}
                  onChange={(event) => handleChange('firstName', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.lastNameLabel}
                </span>
                <input
                  value={form.lastName}
                  onChange={(event) => handleChange('lastName', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.telegramLabel}
                </span>
                <input
                  value={form.telegramUsername}
                  onChange={(event) => handleChange('telegramUsername', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.vkLabel}
                </span>
                <input
                  value={form.vkUsername}
                  onChange={(event) => handleChange('vkUsername', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.discordLabel}
                </span>
                <input
                  value={form.discordUsername}
                  onChange={(event) => handleChange('discordUsername', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {saving ? messages.profile.savingButton : messages.profile.saveButton}
              </span>
            </button>
          </div>
        </form>
      ) : activeTab === 'heroes' ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {locale === 'ru' ? 'Фильтры героев' : 'Hero filters'}
                  </div>
                  <div className="text-xs text-[var(--foreground-soft)]">
                    {locale === 'ru'
                      ? `Показано ${sortedRosterCards.length} из ${rosterCards.length}`
                      : `Showing ${sortedRosterCards.length} of ${rosterCards.length}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHeroFiltersExpanded((current) => !current)}
                  className="rounded-md p-1 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] sm:hidden"
                  aria-label={heroFiltersExpanded ? (locale === 'ru' ? 'Скрыть фильтры' : 'Hide filters') : (locale === 'ru' ? 'Показать фильтры' : 'Show filters')}
                >
                  <ChevronDown className={`h-5 w-5 transition ${heroFiltersExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className={`${heroFiltersExpanded ? 'flex' : 'hidden'} flex-col gap-4 sm:flex`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="grid grid-cols-2 gap-2 md:max-w-[28rem]">
                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                      <span>{locale === 'ru' ? 'Сортировка' : 'Sort'}</span>
                      <select
                        value={heroSortField}
                        onChange={(event) => setHeroSortField(event.target.value as HeroRosterSortField)}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                      >
                        <option value="createdAt">{locale === 'ru' ? 'По дате добавления' : 'By added date'}</option>
                        <option value="name">{locale === 'ru' ? 'По имени' : 'By name'}</option>
                        <option value="rarity">{locale === 'ru' ? 'По редкости' : 'By rarity'}</option>
                        <option value="element">{locale === 'ru' ? 'По стихии' : 'By element'}</option>
                        <option value="powerGrade">{locale === 'ru' ? 'По уровню перерождения' : 'By reborn level'}</option>
                        <option value="releaseDate">{locale === 'ru' ? 'По дате выхода' : 'By release date'}</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                      <span>{locale === 'ru' ? 'Порядок' : 'Order'}</span>
                      <select
                        value={heroSortOrder}
                        onChange={(event) => setHeroSortOrder(event.target.value as HeroRosterSortOrder)}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                      >
                        <option value="desc">{locale === 'ru' ? 'По убыванию' : 'Descending'}</option>
                        <option value="asc">{locale === 'ru' ? 'По возрастанию' : 'Ascending'}</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetHeroFilters}
                      title={locale === 'ru' ? 'Сбросить все фильтры героев' : 'Reset all hero filters'}
                      aria-label={locale === 'ru' ? 'Сбросить все фильтры героев' : 'Reset all hero filters'}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverviewOpen(true)}
                      disabled={sortedRosterCards.length === 0}
                      title={locale === 'ru' ? 'Открыть лист героев для скриншота' : 'Open hero screenshot overview'}
                      aria-label={locale === 'ru' ? 'Открыть лист героев для скриншота' : 'Open hero screenshot overview'}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <IconFilterSelect
                    label={locale === 'ru' ? 'Уровень перерождения' : 'Reborn level'}
                    values={powerGradeFilters}
                    allLabel={locale === 'ru' ? 'Все уровни' : 'All levels'}
                    options={powerGradeFilterOptions}
                    onChange={(nextValues) => setPowerGradeFilters(nextValues as HeroPowerGrade[])}
                    locale={heroLocale}
                  />

                  <IconFilterSelect
                    label={locale === 'ru' ? 'Элемент' : 'Element'}
                    values={elementFilters}
                    allLabel={locale === 'ru' ? 'Все элементы' : 'All elements'}
                    options={elementFilterOptions}
                    onChange={setElementFilters}
                    locale={heroLocale}
                  />

                  <IconFilterSelect
                    label={locale === 'ru' ? 'Класс героя' : 'Hero class'}
                    values={heroClassFilters}
                    allLabel={locale === 'ru' ? 'Все классы' : 'All classes'}
                    options={heroClassFilterOptions}
                    onChange={setHeroClassFilters}
                    locale={heroLocale}
                  />
                </div>

                <div>
                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                    <span>{locale === 'ru' ? 'Поиск по героям' : 'Hero search'}</span>
                    <input
                      value={heroSearchQuery}
                      onChange={(event) => setHeroSearchQuery(event.target.value)}
                      placeholder={locale === 'ru' ? 'Введите имя героя' : 'Type hero name'}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {loadingProfileHeroes ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                <span>{messages.profile.loadingHeroes}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm backdrop-blur-sm sm:p-6">
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
                <AddHeroTile
                  label={messages.profile.addHero}
                  onClick={openHeroModal}
                />

                {sortedRosterCards.map((hero) => (
                  <HeroPreviewTile
                    key={hero.profileHeroId}
                    profileHeroId={hero.profileHeroId}
                    name={hero.name}
                    previewUrl={hero.previewUrl}
                    elementName={hero.elementName}
                    heroClassName={hero.heroClassName}
                    heroClassKey={hero.heroClassKey}
                    powerGrade={hero.powerGrade}
                    talentLevel={hero.talentLevel}
                    costumeCollectionLevel={costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0}
                    locale={heroLocale}
                    powerGradeOptions={powerGradeOptions}
                    powerGradeUpdating={updatingPowerGradeHeroId === hero.profileHeroId}
                    talentLevelUpdating={updatingTalentLevelHeroId === hero.profileHeroId}
                    onClick={
                      hero.slug === String(hero.heroId)
                        ? undefined
                        : () => handleOpenRosterHero(hero.slug)
                    }
                    onPowerGradeChange={handleUpdateHeroPowerGrade}
                    onTalentLevelChange={handleUpdateHeroTalentLevel}
                    onRemove={
                      removingProfileHeroId === hero.profileHeroId
                        ? undefined
                        : () => void handleRemoveHero(hero.profileHeroId)
                    }
                    removeLabel={messages.profile.removeHero}
                  />
                ))}
              </div>

              {sortedRosterCards.length === 0 ? (
                <p className="mt-5 text-sm text-[var(--foreground-soft)]">
                  {rosterCards.length === 0
                    ? messages.profile.heroesEmpty
                    : locale === 'ru'
                      ? 'Нет героев по выбранным фильтрам.'
                      : 'No heroes match the selected filters.'}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {messages.profile.warTitle}
              </h2>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--foreground-soft)] sm:gap-3">
                  <span className="font-medium text-[var(--foreground)]">{messages.profile.warUsed}:</span>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    {messages.profile.warUsedCount.replace('{used}', String(usedWarHeroCount))}
                  </span>
                  {savingWarTeams ? (
                    <span className="inline-flex min-w-0 items-center gap-2 text-[11px] text-[var(--foreground-muted)] sm:text-xs">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                      {messages.profile.warSaving}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => void handleClearAllWarTeams()}
                  disabled={savingWarTeams || usedWarHeroCount === 0}
                  title={messages.profile.warClearAll}
                  aria-label={messages.profile.warClearAll}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eraser className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {warSaveError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {warSaveError}
            </div>
          ) : null}

          {loadingWarTeams || loadingProfileHeroes ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                <span>{messages.profile.loadingHeroes}</span>
              </div>
            </div>
          ) : rosterCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--foreground-soft)] shadow-sm backdrop-blur-sm">
              {messages.profile.warEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {warTeams.map((team) => (
                <div
                  key={team.teamIndex}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm backdrop-blur-sm sm:p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-soft)]">
                      {`${messages.profile.warTeam} ${team.teamIndex}`}
                    </h3>

                    <button
                      type="button"
                      onClick={() => void handleClearWarTeam(team.teamIndex)}
                      title={messages.profile.warClearTeam}
                      aria-label={messages.profile.warClearTeam}
                      disabled={savingWarTeams || team.slots.every((slot) => slot.playerProfileHeroId === null)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                    {team.slots.map((slot) => {
                      const hero = slot.playerProfileHeroId ? rosterHeroCardMap.get(slot.playerProfileHeroId) ?? null : null;

                      return (
                        <WarHeroSlot
                          key={`${team.teamIndex}-${slot.slot}`}
                          hero={hero}
                          locale={heroLocale}
                          compact={warCompactMode}
                          costumeCollectionLevel={hero ? (costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0) : 0}
                          label={messages.profile.addHero}
                          removeLabel={messages.profile.removeHero}
                          onClick={
                            hero && hero.slug !== String(hero.heroId)
                              ? () => handleOpenRosterHero(hero.slug)
                              : () => openWarSlotPicker(team.teamIndex, slot.slot)
                          }
                          onRemove={
                            hero
                              ? () => void handleClearWarSlot(team.teamIndex, slot.slot)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {heroModalOpen ? (
        <div
          className="fixed inset-0 z-[80] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setHeroModalOpen(false)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  {messages.profile.selectHero}
                </h3>

                <button
                  type="button"
                  onClick={() => setHeroModalOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-5">
                <input
                  ref={selectorInputRef}
                  value={selectorSearch}
                  onChange={(event) => setSelectorSearch(event.target.value)}
                  placeholder={messages.profile.searchHeroes}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </div>

              <div ref={selectorScrollRef} className="min-h-[20rem] flex-1 overflow-y-auto pr-1">
                {selectorError ? (
                  <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {selectorError}
                  </div>
                ) : null}

                {loadingSelector && (!selectorResult || selectorResult.items.length === 0) ? (
                  <div className="flex min-h-[18rem] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                      <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                      <span>{messages.profile.loadingHeroes}</span>
                    </div>
                  </div>
                ) : selectorResult && selectorResult.items.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      {selectorResult.items.map((hero) => (
                        <button
                          key={`${hero.id}-${hero.slug}`}
                          type="button"
                          onClick={() => void handleAddHero(hero.id)}
                          disabled={addingHeroId === hero.id}
                          className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-sm transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <div className="relative inline-block overflow-visible">
                            {resolveHeroClassKey(hero.heroClassName) ? (
                              <CornerIconBadge
                                imageUrl={HERO_CLASS_ICON_BY_KEY[resolveHeroClassKey(hero.heroClassName)!]}
                                alt={hero.heroClassName ?? (locale === 'ru' ? 'Класс героя' : 'Hero class')}
                                className="pointer-events-none absolute left-1 top-1 z-10"
                              />
                            ) : null}
                            {hero.isCostume ? (
                              <CornerIconBadge
                                imageUrl={COSTUME_ICON_URL}
                                alt={locale === 'ru' ? 'Костюм' : 'Costume'}
                                className="pointer-events-none absolute left-1 top-5 z-10"
                              />
                            ) : null}
                            <div className={`inline-block overflow-hidden rounded-2xl border p-[2px] ${getHeroPreviewAccentClass(hero.elementName)}`}>
                            {hero.previewUrl || hero.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={hero.previewUrl ?? hero.imageUrl ?? ''}
                                alt={hero.name}
                                className="h-20 w-20 rounded-[14px] object-cover sm:h-24 sm:w-24"
                              />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-[14px] bg-[var(--surface-strong)] text-xs text-[var(--foreground-soft)] sm:h-24 sm:w-24">
                                ?
                              </div>
                            )}
                          </div>
                          </div>

                          <div className="mt-3">
                            <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-[var(--foreground)]">
                              {hero.name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--foreground-soft)]">
                              <span>{hero.rarityStars}*</span>
                              {hero.releaseDate ? <span>{formatReleaseDate(hero.releaseDate, heroLocale)}</span> : null}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectorResult.hasNext ? (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={handleLoadMoreHeroes}
                          disabled={loadingMoreSelector}
                          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                        >
                          {loadingMoreSelector ? messages.profile.loadingHeroes : messages.profile.loadMore}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-soft)]">
                    {messages.profile.noHeroesFound}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {warSlotPicker ? (
        <div
          className="fixed inset-0 z-[90] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWarSlotPicker(null)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">
                    {messages.profile.selectRosterHero}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                    {messages.profile.warAvailableHeroes}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setWarSlotPicker(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-[18rem] flex-1 overflow-y-auto pr-1">
                {availableWarRosterCards.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
                    {availableWarRosterCards.map((hero) => (
                      <button
                        key={hero.profileHeroId}
                        type="button"
                        onClick={() => void handleAssignWarHero(hero.profileHeroId)}
                        disabled={savingWarTeams}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-left shadow-sm transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <div className="relative inline-block overflow-visible">
                            {hero.heroClassKey ? (
                              <CornerIconBadge
                                imageUrl={HERO_CLASS_ICON_BY_KEY[hero.heroClassKey]}
                                alt={hero.heroClassName ?? (locale === 'ru' ? 'Класс героя' : 'Hero class')}
                                className="pointer-events-none absolute left-1 top-1 z-10"
                              />
                            ) : null}
                            {(costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0) > 0 ? (
                              <CostumeCollectionBadge
                                level={costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0}
                                locale={heroLocale}
                                className="left-1 top-5"
                                textClassName="text-[6px] sm:text-[7px]"
                              />
                            ) : null}
                            <div className={`overflow-hidden rounded-2xl border p-[2px] ${getHeroPreviewAccentClass(hero.elementName)}`}>
                              {hero.previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                src={hero.previewUrl}
                                alt={hero.name}
                                className="h-16 w-16 rounded-[12px] object-cover sm:h-20 sm:w-20"
                              />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-[12px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-20 sm:w-20">
                                ?
                              </div>
                            )}
                          </div>
                          <PowerGradeBadge
                            powerGrade={hero.powerGrade}
                            label={getPowerGradeLabel(hero.powerGrade, heroLocale)}
                            imageUrl={POWER_GRADE_IMAGE_BY_CODE[hero.powerGrade]}
                            locale={heroLocale}
                          />
                          <TalentBadge
                            talentLevel={hero.talentLevel}
                            locale={heroLocale}
                          />
                        </div>

                        <div className="mt-2 space-y-1">
                          <div className="line-clamp-2 min-h-[2rem] text-[11px] font-semibold text-[var(--foreground)] sm:text-xs">
                            {hero.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-soft)] sm:text-xs">
                            <span>{hero.rarityStars}*</span>
                            {hero.releaseDate ? <span>{formatReleaseDate(hero.releaseDate, heroLocale)}</span> : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-soft)]">
                    {messages.profile.warNoAvailableHeroes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {overviewOpen ? (
        <div
          className="fixed inset-0 z-[120] overflow-hidden bg-black/80 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setOverviewOpen(false)}
        >
          <div className="flex h-full items-center justify-center overflow-auto">
            <div
              className="flex max-h-[calc(100dvh-1.5rem)] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-2.5"
              style={{
                width: `min(calc(100vw - 1.5rem), ${overviewColumnCount * overviewTileWidth + Math.max(overviewColumnCount - 1, 0) * overviewTileGap + 24}px)`,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                    {locale === 'ru' ? 'Лист героев для скриншота' : 'Hero screenshot overview'}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--foreground-soft)] sm:text-sm">{overviewSubtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOverviewOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  aria-label={locale === 'ru' ? 'Закрыть' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 overflow-auto">
                <div
                  className="grid justify-center gap-[4px] sm:gap-[6px]"
                  style={{
                    gridTemplateColumns: `repeat(${overviewColumnCount}, ${overviewTileWidth}px)`,
                  }}
                >
                  {overviewPageItems.map((hero) => (
                    <OverviewHeroTile
                      key={`overview-${hero.profileHeroId}`}
                      hero={hero}
                      locale={heroLocale}
                      costumeCollectionLevel={costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0}
                    />
                  ))}
                </div>
              </div>

              {overviewPageCount > 1 ? (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOverviewPage((current) => Math.max(0, current - 1))}
                    disabled={overviewPage === 0}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {locale === 'ru' ? 'Назад' : 'Previous'}
                  </button>
                  <div className="text-center text-[10px] text-[var(--foreground-soft)] sm:text-xs">
                    {locale === 'ru'
                      ? `Страница ${overviewPage + 1} из ${overviewPageCount}`
                      : `Page ${overviewPage + 1} of ${overviewPageCount}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverviewPage((current) => Math.min(overviewPageCount - 1, current + 1))}
                    disabled={overviewPage >= overviewPageCount - 1}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {locale === 'ru' ? 'Дальше' : 'Next'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <PublicHeroDetailsModal
        open={selectedHeroSlug !== null}
        locale={heroLocale}
        heroCard={selectedHeroCard}
        loading={selectedHeroLoading}
        error={selectedHeroError}
        heroDetails={selectedHeroDetails}
        heroVariants={selectedHeroVariants}
        heroExpertOpinions={[]}
        heroExpertOpinionsLoading={false}
        heroExpertOpinionsError={null}
        onClose={handleCloseSelectedHero}
        onOpenRelatedHero={(slug) => setSelectedHeroSlug(slug)}
      />
    </section>
  );
}

