'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronDown, ChevronUp, CircleHelp, Eraser, FilePlus2, GripVertical, History, LoaderCircle, Monitor, Plus, RotateCcw, Save, Shield, ShieldAlert, Trash2, X } from 'lucide-react';

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
  PlayerWarModeResponse,
  PlayerWarStatAttackRecordResponse,
  PlayerWarStatAttackRecordUpsertRequest,
  PlayerWarStatAttackTeamResponse,
  PlayerWarStatTeamTagCatalogResponse,
  PlayerWarStatTeamTagResponse,
  PlayerWarStatTeamTagUpsertRequest,
  PlayerWarStatAttackTeamUpdateRequest,
  PlayerWarStatAttackTeamsResponse,
  PlayerWarStatTeamTagsUpdateRequest,
  WarStatAttackResultType,
} from '@/lib/types/player-profile';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  telegramUsername: string;
  vkUsername: string;
  discordUsername: string;
  currentGameNickname: string;
};

type ProfileTab = 'info' | 'heroes' | 'war' | 'warStats';

type HeroLocale = 'RU' | 'EN';
type HeroRosterSortField = 'createdAt' | 'name' | 'rarity' | 'element' | 'powerGrade' | 'releaseDate';
type HeroRosterSortOrder = 'asc' | 'desc';
type WarStatSortField = 'teamOrder' | 'successRate' | 'failedRate' | 'oneShotRate' | 'cleanupRate';
type WarStatSortOrder = 'asc' | 'desc';
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

type HeroFilterOptionResponse = {
  id: number;
  name: string;
  imageUrl?: string | null;
};

type HeroRarityFilterOptionResponse = HeroFilterOptionResponse & {
  stars: number;
};

type HeroCatalogFiltersResponse = {
  elements: HeroFilterOptionResponse[];
  rarities: HeroRarityFilterOptionResponse[];
  heroClasses: HeroFilterOptionResponse[];
  families: HeroFilterOptionResponse[];
  manaSpeeds: HeroFilterOptionResponse[];
  alphaTalents: HeroFilterOptionResponse[];
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
  rarityImageUrl: string | null;
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

type PlayerProfileHeroCreateRequest = {
  heroId: number;
  powerGrade: HeroPowerGrade;
};

type PlayerWarStatAttackTeamsReorderRequest = {
  teamIds: string[];
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

type WarStatSlotPickerState = {
  teamId: string;
  slot: number;
} | null;

type WarStatHistoryModalState = {
  teamId: string;
} | null;

type WarStatAddRecordModalState = {
  teamId: string;
} | null;

type WarStatRecordDraft = {
  teamName: string;
  warModeCode: string;
  resultType: WarStatAttackResultType;
  battleDate: string;
};

type WarStatTeamTagPickerState = {
  teamId: string;
  selectedTagIds: string[];
} | null;

type WarStatTagEditorState = {
  tagId: string | null;
  name: string;
  iconKey: string;
  imageUrl: string;
} | null;

type WarImportNotice = {
  warModeCode: string;
  teamIndex: number;
  type: 'success' | 'error';
  message: string;
} | null;

type WarStatSummary = {
  success: number;
  failed: number;
  oneShot: number;
  cleanup: number;
  failFull: number;
  failCleanup: number;
};

const POWER_GRADE_ASSET_BASE = '/heroes/power-grades';
const HERO_CLASS_ASSET_BASE = '/heroes/elements/classes';
const COSTUME_ICON_URL = '/dictionary-icons/costume.png';
const WAR_MODE_ICON_BY_CODE: Record<string, string> = {
  SKYFIRE: '/war-modes/skyfire.png',
  RUSH_ATTACK: '/war-modes/rush_attack.png',
  WAR_EQUALIZER: '/war-modes/war_equalizer.png',
  ARROW_BARRAGE: '/war-modes/arrow_barrage.png',
  ATTACK_BOOST: '/war-modes/attack_boost.png',
  UNDEAD_HORDE: '/war-modes/undead_horde.png',
  BLOODY_BATTLE: '/war-modes/bloody_battle.png',
  CLOVERFIELD: '/war-modes/cloverfield.png',
  ANCIENT_TERROR: '/war-modes/ancient_terror.png',
};
const POWER_GRADE_IMAGE_BY_CODE: Record<HeroPowerGrade, string> = {
  FIRST_TIER: `${POWER_GRADE_ASSET_BASE}/power_grade_first_tier.png`,
  FIRST_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_first_ascension.webp`,
  SECOND_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_second_ascension.webp`,
  FULLY_ASCENDED: `${POWER_GRADE_ASSET_BASE}/power_grade_fully_ascended.webp`,
  FIRST_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_first_limit_broken.webp`,
  SECOND_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_second_limit_broken.webp`,
};
const RARE_POWER_GRADE_IMAGE_BY_CODE: Record<HeroPowerGrade, string> = {
  FIRST_TIER: `${POWER_GRADE_ASSET_BASE}/power_grade_first_tier_rare.webp`,
  FIRST_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_first_ascension_rare.webp`,
  SECOND_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_second_ascension_rare.webp`,
  FULLY_ASCENDED: `${POWER_GRADE_ASSET_BASE}/power_grade_second_ascension_rare.webp`,
  FIRST_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_first_limit_broken_rare.webp`,
  SECOND_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_second_limit_broken_rare.webp`,
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
const RARE_POWER_GRADE_ORDER: HeroPowerGrade[] = [
  'FIRST_TIER',
  'FIRST_ASCENSION',
  'FULLY_ASCENDED',
  'FIRST_LIMIT_BROKEN',
  'SECOND_LIMIT_BROKEN',
];
const TALENT_LEVEL_IMAGE_URL = '/heroes/talents/talents_level.png';
const DEFAULT_WAR_STAT_RESULT_TYPE: WarStatAttackResultType = 'SUCCESS_ONE_SHOT';

const FLOATING_POPOVER_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getElementTagLabel(code: string | null, locale: HeroLocale): string {
  switch ((code ?? '').toUpperCase()) {
    case 'FIRE':
      return locale === 'RU' ? 'Огонь' : 'Fire';
    case 'ICE':
      return locale === 'RU' ? 'Лёд' : 'Ice';
    case 'NATURE':
      return locale === 'RU' ? 'Природа' : 'Nature';
    case 'HOLY':
      return locale === 'RU' ? 'Святыня' : 'Holy';
    case 'DARK':
      return locale === 'RU' ? 'Тьма' : 'Dark';
    default:
      return code ?? (locale === 'RU' ? 'Стихия' : 'Element');
  }
}

function getWarStatTagLabel(
  tag: PlayerWarStatTeamTagResponse,
  locale: HeroLocale,
  warModeByCode: Map<string, PlayerWarModeResponse>,
): string {
  if (tag.scopeType === 'SYSTEM' && tag.category === 'WAR_MODE') {
    const warMode = tag.code ? warModeByCode.get(tag.code.toUpperCase()) : null;
    if (warMode) {
      return locale === 'RU' ? warMode.nameRu : warMode.nameEn;
    }
  }

  if (tag.scopeType === 'SYSTEM' && tag.category === 'ELEMENT') {
    return getElementTagLabel(tag.code, locale);
  }

  return tag.name;
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

function getPowerGradeLabelForRarity(
  powerGrade: HeroPowerGrade,
  locale: HeroLocale,
  rarityStars: number,
): string {
  if (rarityStars === 3) {
    if (locale === 'RU') {
      switch (powerGrade) {
        case 'FIRST_TIER':
          return 'Тир 1';
        case 'FIRST_ASCENSION':
          return 'Тир 2';
        case 'SECOND_ASCENSION':
        case 'FULLY_ASCENDED':
          return 'Тир 3';
        case 'FIRST_LIMIT_BROKEN':
          return 'Первый слом';
        case 'SECOND_LIMIT_BROKEN':
          return 'Второй слом';
        default:
          return 'Степень прокачки';
      }
    }

    switch (powerGrade) {
      case 'FIRST_TIER':
        return 'Tier 1';
      case 'FIRST_ASCENSION':
        return 'Tier 2';
      case 'SECOND_ASCENSION':
      case 'FULLY_ASCENDED':
        return 'Tier 3';
      case 'FIRST_LIMIT_BROKEN':
        return 'First limit break';
      case 'SECOND_LIMIT_BROKEN':
        return 'Second limit break';
      default:
        return 'Power grade';
    }
  }

  if (locale === 'RU') {
    switch (powerGrade) {
      case 'FIRST_TIER':
        return 'Первая лычка';
      case 'FIRST_ASCENSION':
        return 'Вторая лычка';
      case 'SECOND_ASCENSION':
        return 'Третья лычка';
      case 'FULLY_ASCENDED':
        return 'Четвертая лычка';
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

function getInitialPowerGradeForRarity(rarityStars: number): HeroPowerGrade {
  return rarityStars === 3 ? 'FULLY_ASCENDED' : 'FULLY_ASCENDED';
}

function getPowerGradeImage(powerGrade: HeroPowerGrade, rarityStars: number): string {
  return rarityStars === 3
    ? RARE_POWER_GRADE_IMAGE_BY_CODE[powerGrade]
    : POWER_GRADE_IMAGE_BY_CODE[powerGrade];
}

function getPowerGradeOrder(rarityStars: number): HeroPowerGrade[] {
  return rarityStars === 3 ? RARE_POWER_GRADE_ORDER : POWER_GRADE_ORDER;
}

function getPowerGradeSortRank(powerGrade: HeroPowerGrade, rarityStars: number): number {
  const order = getPowerGradeOrder(rarityStars);
  const rank = order.indexOf(powerGrade);
  return rank >= 0 ? rank : order.length;
}

function buildPowerGradeOptions(locale: HeroLocale, rarityStars: number): PowerGradeOption[] {
  return getPowerGradeOrder(rarityStars).map((value) => ({
    value,
    label: getPowerGradeLabelForRarity(value, locale, rarityStars),
    imageUrl: getPowerGradeImage(value, rarityStars),
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
      result =
        getPowerGradeSortRank(left.powerGrade, left.rarityStars) -
        getPowerGradeSortRank(right.powerGrade, right.rarityStars);
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
        <span className={`absolute bottom-[-1px] right-[-1px] z-20 flex min-w-[0.9em] items-center justify-center font-extrabold leading-none text-white [text-shadow:0_0_1px_rgba(0,0,0,1),0_0_3px_rgba(0,0,0,0.95),1px_0_0_rgba(0,0,0,0.95),-1px_0_0_rgba(0,0,0,0.95),0_1px_0_rgba(0,0,0,0.95),0_-1px_0_rgba(0,0,0,0.95)] ${textClassName}`}>
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
            highlight ? 'animate-pulse [filter:drop-shadow(0_0_4px_rgba(34,211,238,0.55))_drop-shadow(0_0_9px_rgba(34,211,238,0.35))]' : ''
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
  sizeClassName = 'h-[18px] w-[18px] sm:h-[24px] sm:w-[24px]',
  textClassName = 'text-[7px] sm:text-[8px]',
}: {
  talentLevel: number;
  interactive?: boolean;
  disabled?: boolean;
  locale: HeroLocale;
  onChange?: (nextTalentLevel: number) => void;
  sizeClassName?: string;
  textClassName?: string;
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
                <span className={`absolute inset-0 flex items-center justify-center font-extrabold leading-none text-white [text-shadow:0_0_1px_rgba(0,0,0,1),0_0_3px_rgba(0,0,0,0.95),1px_0_0_rgba(0,0,0,0.95),-1px_0_0_rgba(0,0,0,0.95),0_1px_0_rgba(0,0,0,0.95),0_-1px_0_rgba(0,0,0,0.95)] ${textClassName}`}>
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
          <span className={`absolute inset-0 flex items-center justify-center font-extrabold leading-none text-white [text-shadow:0_0_1px_rgba(0,0,0,1),0_0_3px_rgba(0,0,0,0.95),1px_0_0_rgba(0,0,0,0.95),-1px_0_0_rgba(0,0,0,0.95),0_1px_0_rgba(0,0,0,0.95),0_-1px_0_rgba(0,0,0,0.95)] ${textClassName}`}>
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
              <div
                className="max-h-[min(20rem,calc(100dvh-8rem))] space-y-1 overflow-y-auto overscroll-contain pr-1"
                onWheel={(event) => event.stopPropagation()}
              >
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
  warModeCode: string;
  teamIndex: number;
  slot: number;
} | null;

function buildDefaultWarModes(): PlayerWarModeResponse[] {
  return [
    {
      code: 'UNIVERSAL',
      nameRu: 'Универсальная',
      nameEn: 'Universal',
      descriptionRu: 'Команды для любого режима войны',
      descriptionEn: 'Teams for any war mode',
      sortOrder: 1,
    },
    {
      code: 'SKYFIRE',
      nameRu: 'Небесное пламя',
      nameEn: 'Skyfire',
      descriptionRu: 'Атакующие драконы становятся сильнее',
      descriptionEn: 'Attacking dragons are more powerful',
      sortOrder: 2,
    },
    {
      code: 'RUSH_ATTACK',
      nameRu: 'Стремительная атака',
      nameEn: 'Rush Attack',
      descriptionRu: 'Все герои: очень быстрая мана',
      descriptionEn: 'All heroes: very fast mana',
      sortOrder: 3,
    },
    {
      code: 'WAR_EQUALIZER',
      nameRu: 'Боевое равенство',
      nameEn: 'War Equalizer',
      descriptionRu: 'Каждые 3 хода: все статус-эффекты снимаются',
      descriptionEn: 'Every 3 turns: status effects removed',
      sortOrder: 4,
    },
    {
      code: 'ARROW_BARRAGE',
      nameRu: 'Град стрел',
      nameEn: 'Arrow Barrage',
      descriptionRu: 'При активации: атакующие теряют 25% текущего здоровья',
      descriptionEn: 'When activated: attackers lose 25% current HP',
      sortOrder: 5,
    },
    {
      code: 'ATTACK_BOOST',
      nameRu: 'Бонус к атаке',
      nameEn: 'Attack Boost',
      descriptionRu: 'Нарастающий бонус атаки для защитников (неснимаемый)',
      descriptionEn: 'Scaling attack buff for defenders (undispellable)',
      sortOrder: 6,
    },
    {
      code: 'UNDEAD_HORDE',
      nameRu: 'Орда зомби',
      nameEn: 'Undead Horde',
      descriptionRu: 'Каждые 5 ходов появляются скелеты-прислужники',
      descriptionEn: 'Every 5 turns: skeletal minions',
      sortOrder: 7,
    },
    {
      code: 'BLOODY_BATTLE',
      nameRu: 'Кровавая война',
      nameEn: 'Bloody Battle',
      descriptionRu: 'Нельзя лечиться и воскрешаться',
      descriptionEn: 'No healing / revival',
      sortOrder: 8,
    },
    {
      code: 'CLOVERFIELD',
      nameRu: 'Поле клевера',
      nameEn: 'Cloverfield',
      descriptionRu: 'Шанс применить особый навык дважды',
      descriptionEn: 'Chance to cast special skill twice',
      sortOrder: 9,
    },
    {
      code: 'ANCIENT_TERROR',
      nameRu: 'Древний ужас',
      nameEn: 'Ancient Terror',
      descriptionRu: 'При активации: атакующие / защитники получают +10 / +20 Безумия',
      descriptionEn: 'When activated: attackers / defenders get +10 / +20 insanity',
      sortOrder: 10,
    },
  ];
}

function normalizeWarModeCode(code: string): string {
  return code.trim().toUpperCase();
}

function getWarModeLabel(mode: PlayerWarModeResponse, locale: HeroLocale): string {
  return locale === 'RU' ? mode.nameRu : mode.nameEn;
}

function getWarModeDescription(mode: PlayerWarModeResponse, locale: HeroLocale): string {
  return locale === 'RU' ? mode.descriptionRu : mode.descriptionEn;
}

function getWarModeIconUrl(code: string): string | null {
  return WAR_MODE_ICON_BY_CODE[normalizeWarModeCode(code)] ?? null;
}

function WarModeIcon({
  warModeCode,
  label,
  sizeClassName = 'h-4 w-4',
}: {
  warModeCode: string;
  label: string;
  sizeClassName?: string;
}) {
  const imageUrl = getWarModeIconUrl(warModeCode);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={label}
        className={`${sizeClassName} shrink-0 object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.98))_drop-shadow(0_0_2px_rgba(0,0,0,0.75))]`}
      />
    );
  }

  return <Shield className={`${sizeClassName} shrink-0`} />;
}

function WarModeLabel({
  mode,
  locale,
  iconSizeClassName = 'h-4 w-4',
  textClassName = '',
}: {
  mode: PlayerWarModeResponse;
  locale: HeroLocale;
  iconSizeClassName?: string;
  textClassName?: string;
}) {
  const label = getWarModeLabel(mode, locale);

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${textClassName}`}>
      <WarModeIcon warModeCode={mode.code} label={label} sizeClassName={iconSizeClassName} />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function WarModeSelect({
  value,
  options,
  locale,
  onChange,
  includeAllOption = false,
  allLabel,
}: {
  value: string;
  options: PlayerWarModeResponse[];
  locale: HeroLocale;
  onChange: (nextValue: string) => void;
  includeAllOption?: boolean;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverPanelRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const normalizedValue = value.trim().toUpperCase();
  const selectedMode = options.find((option) => normalizeWarModeCode(option.code) === normalizedValue) ?? null;

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
          preferredWidth: 260,
          estimatedHeight: 320,
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
    <div ref={popoverRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-left text-sm text-[var(--foreground)] outline-none transition hover:bg-[var(--surface-hover)]"
      >
        {selectedMode ? (
          <WarModeLabel mode={selectedMode} locale={locale} />
        ) : (
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{allLabel ?? (locale === 'RU' ? 'Все режимы' : 'All war modes')}</span>
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && popoverStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popoverPanelRef}
              className="fixed z-[230] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-2xl backdrop-blur-sm"
              style={{ top: popoverStyle.top, left: popoverStyle.left, width: popoverStyle.width }}
            >
              <div className="max-h-80 overflow-y-auto">
                {includeAllOption ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('ALL');
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      normalizedValue === 'ALL'
                        ? 'bg-cyan-400/12 text-cyan-200'
                        : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>{allLabel ?? (locale === 'RU' ? 'Все режимы' : 'All war modes')}</span>
                  </button>
                ) : null}

                {options.map((option) => {
                  const selected = normalizeWarModeCode(option.code) === normalizedValue;

                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        onChange(option.code);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                        selected
                          ? 'bg-cyan-400/12 text-cyan-200'
                          : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <WarModeLabel mode={option} locale={locale} />
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

function normalizeWarTeams(
  teams: PlayerWarAttackTeamResponse[],
  warModes: PlayerWarModeResponse[] = buildDefaultWarModes(),
): PlayerWarAttackTeamResponse[] {
  const teamMap = new Map(
    teams.map((team) => [`${normalizeWarModeCode(team.warModeCode)}:${team.teamIndex}`, team] as const),
  );

  return warModes.flatMap((warMode) =>
    Array.from({ length: 6 }, (_, teamIndex) => {
      const currentTeam = teamMap.get(`${normalizeWarModeCode(warMode.code)}:${teamIndex + 1}`);
      const slotMap = new Map(currentTeam?.slots.map((slot) => [slot.slot, slot]));

      return {
        id: currentTeam?.id ?? `local-team-${warMode.code}-${teamIndex + 1}`,
        warModeCode: normalizeWarModeCode(warMode.code),
        teamIndex: teamIndex + 1,
        slots: Array.from({ length: 5 }, (_, slotIndex) => ({
          slot: slotIndex + 1,
          playerProfileHeroId: slotMap.get(slotIndex + 1)?.playerProfileHeroId ?? null,
        })),
      };
    }),
  );
}

function buildWarTeamsPayload(
  teams: PlayerWarAttackTeamResponse[],
): PlayerWarAttackTeamsUpdateRequest {
  return {
    teams: teams.map((team) => ({
      warModeCode: team.warModeCode,
      teamIndex: team.teamIndex,
      slots: team.slots.map((slot) => ({
        slot: slot.slot,
        playerProfileHeroId: slot.playerProfileHeroId,
      })),
    })),
  };
}

function normalizeWarStatTeams(
  teams: PlayerWarStatAttackTeamResponse[],
): PlayerWarStatAttackTeamResponse[] {
  return teams
    .map((team) => {
      const slotMap = new Map(team.slots.map((slot) => [slot.slot, slot]));

      return {
        ...team,
        slots: Array.from({ length: 5 }, (_, slotIndex) => ({
          slot: slotIndex + 1,
          playerProfileHeroId: slotMap.get(slotIndex + 1)?.playerProfileHeroId ?? null,
        })),
        tags: team.tags ?? [],
      };
    })
    .sort((left, right) => left.teamOrder - right.teamOrder);
}

function buildWarStatDraft(warModes: PlayerWarModeResponse[]): WarStatRecordDraft {
  const firstWarMode = warModes.find((mode) => normalizeWarModeCode(mode.code) !== 'UNIVERSAL') ?? warModes[0];

  return {
    teamName: '',
    warModeCode: firstWarMode?.code ?? 'SKYFIRE',
    resultType: DEFAULT_WAR_STAT_RESULT_TYPE,
    battleDate: getTodayDateInputValue(),
  };
}

function getWarStatResultTypeLabel(resultType: WarStatAttackResultType, locale: HeroLocale): string {
  if (locale === 'RU') {
    switch (resultType) {
      case 'SUCCESS_ONE_SHOT':
        return 'Шот целого';
      case 'SUCCESS_CLEANUP':
        return 'Добив раненого';
      case 'FAIL_FULL_ATTACK':
        return 'Провал атаки целого';
      case 'FAIL_CLEANUP':
        return 'Провал добива';
      default:
        return 'Результат';
    }
  }

  switch (resultType) {
    case 'SUCCESS_ONE_SHOT':
      return 'One-shot';
    case 'SUCCESS_CLEANUP':
      return 'Cleanup';
    case 'FAIL_FULL_ATTACK':
      return 'Failed full attack';
    case 'FAIL_CLEANUP':
      return 'Failed cleanup';
    default:
      return 'Result';
  }
}

function buildWarStatSummary(
  records: PlayerWarStatAttackRecordResponse[],
  warModeCodeFilter?: string,
): WarStatSummary {
  return records.reduce<WarStatSummary>(
    (summary, record) => {
      if (
        warModeCodeFilter &&
        warModeCodeFilter !== 'ALL' &&
        normalizeWarModeCode(record.warModeCode) !== normalizeWarModeCode(warModeCodeFilter)
      ) {
        return summary;
      }

      switch (record.resultType) {
        case 'SUCCESS_ONE_SHOT':
          summary.success += 1;
          summary.oneShot += 1;
          break;
        case 'SUCCESS_CLEANUP':
          summary.success += 1;
          summary.cleanup += 1;
          break;
        case 'FAIL_FULL_ATTACK':
          summary.failed += 1;
          summary.failFull += 1;
          break;
        case 'FAIL_CLEANUP':
          summary.failed += 1;
          summary.failCleanup += 1;
          break;
      }

      return summary;
    },
    {
      success: 0,
      failed: 0,
      oneShot: 0,
      cleanup: 0,
      failFull: 0,
      failCleanup: 0,
    },
  );
}

function getWarStatSuccessRate(summary: WarStatSummary): number {
  const total = summary.success + summary.failed;
  return total > 0 ? summary.success / total : 0;
}

function getWarStatFailedRate(summary: WarStatSummary): number {
  const total = summary.success + summary.failed;
  return total > 0 ? summary.failed / total : 0;
}

function getWarStatOneShotRate(summary: WarStatSummary): number {
  const totalFullAttempts = summary.oneShot + summary.failFull;
  return totalFullAttempts > 0 ? summary.oneShot / totalFullAttempts : 0;
}

function getWarStatCleanupRate(summary: WarStatSummary): number {
  const totalCleanupAttempts = summary.cleanup + summary.failCleanup;
  return totalCleanupAttempts > 0 ? summary.cleanup / totalCleanupAttempts : 0;
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
  rarityStars,
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
  rarityStars: number;
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
  const powerGradeLabel = getPowerGradeLabelForRarity(powerGrade, locale, rarityStars);
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
            sizeClassName="h-3 w-3 sm:h-5 sm:w-5"
          />
        ) : null}
        {costumeCollectionLevel > 0 ? (
          <CostumeCollectionBadge
            level={costumeCollectionLevel}
            locale={locale}
            className="left-1 top-5 sm:left-1.5 sm:top-7"
            sizeClassName="h-3 w-3 sm:h-5 sm:w-5"
            textClassName="text-[6px] sm:text-[8px]"
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
          imageUrl={getPowerGradeImage(powerGrade, rarityStars)}
          interactive
          disabled={powerGradeUpdating}
          options={powerGradeOptions}
          onChange={(nextPowerGrade) => onPowerGradeChange(profileHeroId, nextPowerGrade)}
          locale={locale}
          sizeClassName="h-4 w-4 sm:h-7 sm:w-7"
        />
        <TalentBadge
          talentLevel={talentLevel}
          interactive={talentEditable}
          disabled={!talentEditable || talentLevelUpdating}
          locale={locale}
          onChange={(nextTalentLevel) => onTalentLevelChange(profileHeroId, nextTalentLevel)}
          sizeClassName="h-[16px] w-[16px] sm:h-[30px] sm:w-[30px]"
          textClassName="text-[7px] sm:text-[16px]"
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
            textClassName="text-[6px] sm:text-[9px]"
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
          label={getPowerGradeLabelForRarity(hero.powerGrade, locale, hero.rarityStars)}
          imageUrl={getPowerGradeImage(hero.powerGrade, hero.rarityStars)}
          locale={locale}
          sizeClassName="h-3.5 w-3.5 sm:h-5 sm:w-5"
        />
        <TalentBadge
          talentLevel={hero.talentLevel}
          locale={locale}
          sizeClassName="h-[15px] w-[15px] sm:h-[22px] sm:w-[22px]"
          textClassName="text-[7px] sm:text-[11px]"
        />
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
              sizeClassName={compact ? 'h-3 w-3 sm:h-4 sm:w-4' : 'h-3.5 w-3.5 sm:h-5 sm:w-5'}
            />
          ) : null}
          {costumeCollectionLevel > 0 ? (
            <CostumeCollectionBadge
              level={costumeCollectionLevel}
              locale={locale}
              className="left-1 top-7"
              sizeClassName={compact ? 'h-3 w-3 sm:h-4 sm:w-4' : 'h-3.5 w-3.5 sm:h-5 sm:w-5'}
              textClassName={compact ? 'text-[6px] sm:text-[9px]' : 'text-[7px] sm:text-[11px] lg:text-[12px]'}
            />
          ) : null}
            <div className={`overflow-hidden rounded-2xl border p-[2px] ${accentClass}`}>
              {hero.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={hero.previewUrl}
                  alt={hero.name}
                  className={compact ? 'h-12 w-12 rounded-[12px] object-cover sm:h-16 sm:w-16' : 'h-16 w-16 rounded-[12px] object-cover sm:h-24 sm:w-24 lg:h-28 lg:w-28'}
                />
              ) : (
              <div className={compact ? 'flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-16 sm:w-16' : 'flex h-16 w-16 items-center justify-center rounded-[12px] bg-[var(--surface-strong)] text-[10px] text-[var(--foreground-soft)] sm:h-24 sm:w-24 lg:h-28 lg:w-28'}>
                ?
              </div>
            )}
          </div>
          <PowerGradeBadge
            powerGrade={hero.powerGrade}
            label={getPowerGradeLabelForRarity(hero.powerGrade, locale, hero.rarityStars)}
            imageUrl={getPowerGradeImage(hero.powerGrade, hero.rarityStars)}
            locale={locale}
            sizeClassName={compact ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-5 w-5 sm:h-8 sm:w-8 lg:h-9 lg:w-9'}
          />
          <TalentBadge
            talentLevel={hero.talentLevel}
            locale={locale}
            sizeClassName={compact ? 'h-[16px] w-[16px] sm:h-[20px] sm:w-[20px]' : 'h-[20px] w-[20px] sm:h-[28px] sm:w-[28px] lg:h-[32px] lg:w-[32px]'}
            textClassName={compact ? 'text-[7px] sm:text-[11px]' : 'text-[8px] sm:text-[14px] lg:text-[16px]'}
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
  const { apiJson, apiPutJson, apiPostJson, apiDelete, apiDeleteVoid } = useApi();
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
  const [rarityFilters, setRarityFilters] = useState<string[]>([]);
  const [powerGradeFilters, setPowerGradeFilters] = useState<HeroPowerGrade[]>([]);
  const [elementFilters, setElementFilters] = useState<string[]>([]);
  const [heroClassFilters, setHeroClassFilters] = useState<string[]>([]);
  const [heroFilterOptions, setHeroFilterOptions] = useState<HeroCatalogFiltersResponse | null>(null);
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
  const [warModes, setWarModes] = useState<PlayerWarModeResponse[]>(buildDefaultWarModes);
  const [activeWarModeCode, setActiveWarModeCode] = useState('UNIVERSAL');
  const [warTeams, setWarTeams] = useState<PlayerWarAttackTeamResponse[]>([]);
  const [loadingWarTeams, setLoadingWarTeams] = useState(false);
  const [savingWarTeams, setSavingWarTeams] = useState(false);
  const [warSaveError, setWarSaveError] = useState<string | null>(null);
  const [warSlotPicker, setWarSlotPicker] = useState<WarSlotPickerState>(null);
  const [warSlotPickerSearch, setWarSlotPickerSearch] = useState('');
  const [warCompactMode, setWarCompactMode] = useState(false);
  const [warTeamsExpanded, setWarTeamsExpanded] = useState(true);
  const [warStatTeams, setWarStatTeams] = useState<PlayerWarStatAttackTeamResponse[]>([]);
  const [loadingWarStatTeams, setLoadingWarStatTeams] = useState(false);
  const [savingWarStatTeams, setSavingWarStatTeams] = useState(false);
  const [warStatSaveError, setWarStatSaveError] = useState<string | null>(null);
  const [warStatSaveMessage, setWarStatSaveMessage] = useState<string | null>(null);
  const [warImportNotice, setWarImportNotice] = useState<WarImportNotice>(null);
  const [warStatSlotPicker, setWarStatSlotPicker] = useState<WarStatSlotPickerState>(null);
  const [warStatSlotPickerSearch, setWarStatSlotPickerSearch] = useState('');
  const [warStatHistoryModal, setWarStatHistoryModal] = useState<WarStatHistoryModalState>(null);
  const [warStatAddRecordModal, setWarStatAddRecordModal] = useState<WarStatAddRecordModalState>(null);
  const [warStatDraftsByTeamId, setWarStatDraftsByTeamId] = useState<Record<string, WarStatRecordDraft>>({});
  const [warStatSearchQuery, setWarStatSearchQuery] = useState('');
  const [warStatTagFilters, setWarStatTagFilters] = useState<string[]>([]);
  const [warStatControlsOpen, setWarStatControlsOpen] = useState(false);
  const [warStatSortField, setWarStatSortField] = useState<WarStatSortField>('teamOrder');
  const [warStatSortOrder, setWarStatSortOrder] = useState<WarStatSortOrder>('asc');
  const [warStatModeFilterCode, setWarStatModeFilterCode] = useState('ALL');
  const [warStatExpandedTeamIds, setWarStatExpandedTeamIds] = useState<string[]>([]);
  const [draggedWarStatTeamId, setDraggedWarStatTeamId] = useState<string | null>(null);
  const [warStatTagCatalog, setWarStatTagCatalog] = useState<PlayerWarStatTeamTagCatalogResponse | null>(null);
  const [warStatTeamTagPicker, setWarStatTeamTagPicker] = useState<WarStatTeamTagPickerState>(null);
  const [warStatTagEditor, setWarStatTagEditor] = useState<WarStatTagEditorState>(null);
  const [warStatTagManagerOpen, setWarStatTagManagerOpen] = useState(false);
  const [savingWarStatTags, setSavingWarStatTags] = useState(false);
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
      const defaultWarModes = buildDefaultWarModes();
      setWarModes(defaultWarModes);
      setActiveWarModeCode('UNIVERSAL');
      setWarTeams([]);
      return;
    }

    let cancelled = false;

    const loadWarTeams = async () => {
      setLoadingWarTeams(true);
      setWarSaveError(null);

      try {
        const response = await apiJson<PlayerWarAttackTeamsResponse>('/api/v1/profile/me/war-attack-teams');

        if (!cancelled) {
          const nextWarModes = response.warModes.length > 0 ? response.warModes : buildDefaultWarModes();
          setWarModes(nextWarModes);
          setWarTeams(normalizeWarTeams(response.teams, nextWarModes));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const defaultWarModes = buildDefaultWarModes();
        setWarModes(defaultWarModes);
        setActiveWarModeCode('UNIVERSAL');
        setWarTeams([]);

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
    if (!authenticated) {
      setWarStatTeams([]);
      setWarStatDraftsByTeamId({});
      return;
    }

    let cancelled = false;

    const loadWarStatTeams = async () => {
      setLoadingWarStatTeams(true);
      setWarStatSaveError(null);

      try {
        const response = await apiJson<PlayerWarStatAttackTeamsResponse>('/api/v1/profile/me/war-stat-attack-teams');

        if (!cancelled) {
          const nextTeams = normalizeWarStatTeams(response.teams);
          setWarStatTeams(nextTeams);
          setWarStatExpandedTeamIds([]);
          setWarStatDraftsByTeamId((current) => {
            const next: Record<string, WarStatRecordDraft> = {};
            for (const team of nextTeams) {
              next[team.id] = {
                ...(current[team.id] ?? buildWarStatDraft(response.warModes)),
                teamName: current[team.id]?.teamName ?? team.name,
              };
            }
            return next;
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setWarStatTeams([]);
        setWarStatDraftsByTeamId({});

        if (error instanceof ApiError) {
          setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
        } else {
          setWarStatSaveError(messages.profile.warStatsSaveError);
        }
      } finally {
        if (!cancelled) {
          setLoadingWarStatTeams(false);
        }
      }
    };

    void loadWarStatTeams();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authenticated, messages.profile.warStatsSaveError]);

  useEffect(() => {
    if (!authenticated) {
      setWarStatTagCatalog(null);
      return;
    }

    let cancelled = false;

    const loadWarStatTagCatalog = async () => {
      try {
        const response = await apiJson<PlayerWarStatTeamTagCatalogResponse>('/api/v1/profile/me/war-stat-tags');
        if (!cancelled) {
          setWarStatTagCatalog(response);
        }
      } catch {
        if (!cancelled) {
          setWarStatTagCatalog(null);
        }
      }
    };

    void loadWarStatTagCatalog();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authenticated]);

  useEffect(() => {
    if (warModes.some((warMode) => normalizeWarModeCode(warMode.code) === activeWarModeCode)) {
      return;
    }

    setActiveWarModeCode(normalizeWarModeCode(warModes[0]?.code ?? 'UNIVERSAL'));
  }, [activeWarModeCode, warModes]);

  useEffect(() => {
    setWarSlotPicker(null);
    setWarSlotPickerSearch('');
  }, [activeWarModeCode]);

  useEffect(() => {
    if (!warSlotPicker) {
      setWarSlotPickerSearch('');
    }
  }, [warSlotPicker]);

  useEffect(() => {
    if (!warStatSlotPicker) {
      setWarStatSlotPickerSearch('');
    }
  }, [warStatSlotPicker]);

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
    if (!heroModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [heroModalOpen]);

  useEffect(() => {
    if (!warStatTeamTagPicker && !warStatTagManagerOpen && !warStatTagEditor) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [warStatTeamTagPicker, warStatTagManagerOpen, warStatTagEditor]);

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
          `/api/v1/public/heroes/batch?language=${heroLocale}&includeDrafts=true`,
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
    if (!authenticated) {
      return;
    }

    let cancelled = false;

    const loadHeroFilterOptions = async () => {
      try {
        const response = await apiJson<HeroCatalogFiltersResponse>(`/api/v1/public/heroes/filters?language=${heroLocale}`);
        if (!cancelled) {
          setHeroFilterOptions(response);
        }
      } catch {
        if (!cancelled) {
          setHeroFilterOptions(null);
        }
      }
    };

    void loadHeroFilterOptions();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authenticated, heroLocale]);

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

  const rarityImageUrlByStars = useMemo(() => {
    const next = new Map<number, string | null>();
    for (const item of heroFilterOptions?.rarities ?? []) {
      next.set(item.stars, item.imageUrl ?? null);
    }
    return next;
  }, [heroFilterOptions]);

  const rosterCards = useMemo<RosterHeroCard[]>(() => {
    return profileHeroes.map((item) => {
      const hero = rosterHeroMap.get(item.heroId);
      const rarityStars = hero?.rarityStars ?? 0;

      return {
        profileHeroId: item.id,
        heroId: item.heroId,
        baseHeroId: hero?.baseHeroId ?? null,
        powerGrade: item.powerGrade,
        talentLevel: item.talentLevel,
        slug: hero?.slug ?? String(item.heroId),
        name: hero?.name ?? `Hero #${item.heroId}`,
        rarityStars,
        rarityImageUrl: rarityImageUrlByStars.get(rarityStars) ?? null,
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
  }, [profileHeroes, rarityImageUrlByStars, rosterHeroMap]);
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
      if (rarityFilters.length > 0 && !rarityFilters.includes(String(hero.rarityStars))) {
        return false;
      }

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
  }, [elementFilters, heroClassFilters, heroSearchQuery, powerGradeFilters, rarityFilters, rosterCards]);

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
  const powerGradeOptions = useMemo(() => buildPowerGradeOptions(heroLocale, 5), [heroLocale]);
  const powerGradeFilterOptions = useMemo<IconFilterOption[]>(
    () => powerGradeOptions.map((option) => ({ value: option.value, label: option.label, imageUrl: option.imageUrl })),
    [powerGradeOptions],
  );
  const rarityFilterOptions = useMemo<IconFilterOption[]>(() => {
    if (heroFilterOptions?.rarities?.length) {
      return [...heroFilterOptions.rarities]
        .sort((left, right) => left.stars - right.stars)
        .map((option) => ({
          value: String(option.stars),
          label: `${option.stars}*`,
          imageUrl: option.imageUrl ?? null,
        }));
    }

    return Array.from(new Set(rosterCards.map((hero) => hero.rarityStars).filter((value) => value > 0)))
      .sort((left, right) => left - right)
      .map((stars) => ({
        value: String(stars),
        label: `${stars}*`,
        imageUrl: rarityImageUrlByStars.get(stars) ?? null,
      }));
  }, [heroFilterOptions, rarityImageUrlByStars, rosterCards]);
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

  const activeWarMode = useMemo(
    () => warModes.find((mode) => normalizeWarModeCode(mode.code) === activeWarModeCode) ?? warModes[0] ?? null,
    [activeWarModeCode, warModes],
  );
  const activeWarTeams = useMemo(
    () =>
      warTeams
        .filter((team) => normalizeWarModeCode(team.warModeCode) === activeWarModeCode)
        .sort((left, right) => left.teamIndex - right.teamIndex),
    [activeWarModeCode, warTeams],
  );
  const usedWarHeroIds = useMemo(() => {
    return new Set(
      activeWarTeams.flatMap((team) =>
        team.slots
          .map((slot) => slot.playerProfileHeroId)
          .filter((playerProfileHeroId): playerProfileHeroId is string => playerProfileHeroId !== null),
      ),
    );
  }, [activeWarTeams]);

  const usedWarHeroCount = usedWarHeroIds.size;

  const availableWarRosterCards = useMemo(() => {
    if (!warSlotPicker) {
      return [];
    }

    const selectedSlotHeroId =
      activeWarTeams
        .find((team) => team.teamIndex === warSlotPicker.teamIndex)
        ?.slots.find((slot) => slot.slot === warSlotPicker.slot)?.playerProfileHeroId ?? null;

    const query = warSlotPickerSearch.trim().toLocaleLowerCase();

    return allSortedRosterCards.filter((hero) => {
      const available = hero.profileHeroId === selectedSlotHeroId || !usedWarHeroIds.has(hero.profileHeroId);
      if (!available) {
        return false;
      }
      if (!query) {
        return true;
      }
      return hero.name.toLocaleLowerCase().includes(query);
    });
  }, [activeWarTeams, allSortedRosterCards, usedWarHeroIds, warSlotPicker, warSlotPickerSearch]);
  const warStatTeamMap = useMemo(
    () => new Map(warStatTeams.map((team) => [team.id, team])),
    [warStatTeams],
  );
  const warModeByCode = useMemo(
    () => new Map(warModes.map((mode) => [normalizeWarModeCode(mode.code), mode])),
    [warModes],
  );
  const availableWarStatTags = useMemo(
    () => warStatTagCatalog?.items ?? [],
    [warStatTagCatalog],
  );
  const customWarStatTags = useMemo(
    () => availableWarStatTags.filter((tag) => tag.scopeType === 'CUSTOM'),
    [availableWarStatTags],
  );
  const availableWarStatTagOptions = useMemo<IconFilterOption[]>(
    () =>
      availableWarStatTags.map((tag) => ({
        value: tag.id,
        label: getWarStatTagLabel(tag, heroLocale, warModeByCode),
        imageUrl: tag.imageUrl,
      })),
    [availableWarStatTags, heroLocale, warModeByCode],
  );
  const familyTagIconOptions = useMemo<IconFilterOption[]>(
    () =>
      (heroFilterOptions?.families ?? [])
        .filter((family) => family.imageUrl)
        .map((family) => ({
          value: `family:${family.id}`,
          label: family.name,
          imageUrl: family.imageUrl,
        })),
    [heroFilterOptions],
  );
  const visibleWarStatTeams = useMemo(() => {
    const query = warStatSearchQuery.trim().toLocaleLowerCase();
    const filteredTeams = !query
      ? warStatTeams
      : warStatTeams.filter((team) => team.name.toLocaleLowerCase().includes(query));

    const filteredByTags =
      warStatTagFilters.length === 0
        ? filteredTeams
        : filteredTeams.filter((team) => warStatTagFilters.every((tagId) => team.tags.some((tag) => tag.id === tagId)));

    return [...filteredByTags].sort((left, right) => {
      if (warStatSortField === 'teamOrder') {
        return warStatSortOrder === 'asc'
          ? left.teamOrder - right.teamOrder
          : right.teamOrder - left.teamOrder;
      }

      const leftSummary = buildWarStatSummary(left.records, warStatModeFilterCode);
      const rightSummary = buildWarStatSummary(right.records, warStatModeFilterCode);

      const leftValue =
        warStatSortField === 'successRate'
          ? getWarStatSuccessRate(leftSummary)
          : warStatSortField === 'failedRate'
            ? getWarStatFailedRate(leftSummary)
            : warStatSortField === 'oneShotRate'
              ? getWarStatOneShotRate(leftSummary)
              : getWarStatCleanupRate(leftSummary);
      const rightValue =
        warStatSortField === 'successRate'
          ? getWarStatSuccessRate(rightSummary)
          : warStatSortField === 'failedRate'
            ? getWarStatFailedRate(rightSummary)
            : warStatSortField === 'oneShotRate'
              ? getWarStatOneShotRate(rightSummary)
              : getWarStatCleanupRate(rightSummary);

      if (leftValue === rightValue) {
        return left.teamOrder - right.teamOrder;
      }

      return warStatSortOrder === 'asc' ? leftValue - rightValue : rightValue - leftValue;
    });
  }, [warStatModeFilterCode, warStatSearchQuery, warStatSortField, warStatSortOrder, warStatTagFilters, warStatTeams]);
  const warStatManualOrderEnabled =
    warStatSortField === 'teamOrder' &&
    warStatSortOrder === 'asc' &&
    warStatModeFilterCode === 'ALL' &&
    warStatSearchQuery.trim().length === 0 &&
    warStatTagFilters.length === 0;
  const availableWarStatRosterCards = useMemo(() => {
    if (!warStatSlotPicker) {
      return [];
    }

    const currentTeam = warStatTeamMap.get(warStatSlotPicker.teamId);
    if (!currentTeam) {
      return [];
    }

    const usedIds = new Set(
      currentTeam.slots
        .map((slot) => slot.playerProfileHeroId)
        .filter((value): value is string => value !== null),
    );
    const selectedSlotHeroId =
      currentTeam.slots.find((slot) => slot.slot === warStatSlotPicker.slot)?.playerProfileHeroId ?? null;

    const query = warStatSlotPickerSearch.trim().toLocaleLowerCase();

    return allSortedRosterCards.filter((hero) => {
      const available = hero.profileHeroId === selectedSlotHeroId || !usedIds.has(hero.profileHeroId);
      if (!available) {
        return false;
      }
      if (!query) {
        return true;
      }
      return hero.name.toLocaleLowerCase().includes(query);
    });
  }, [allSortedRosterCards, warStatSlotPicker, warStatTeamMap, warStatSlotPickerSearch]);

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

        const nextWarModes = response.warModes.length > 0 ? response.warModes : warModes;
        setWarModes(nextWarModes);
        setWarTeams(normalizeWarTeams(response.teams, nextWarModes));
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
  }, [apiPutJson, messages.profile.warSaveError, warModes]);

  const applyWarStatResponse = useCallback((response: PlayerWarStatAttackTeamsResponse) => {
    const nextTeams = normalizeWarStatTeams(response.teams);
    setWarStatTeams(nextTeams);
    setWarStatExpandedTeamIds((current) => {
      const availableIds = new Set(nextTeams.map((team) => team.id));
      return current.filter((id) => availableIds.has(id));
    });
    setWarStatDraftsByTeamId((current) => {
      const next: Record<string, WarStatRecordDraft> = {};
      for (const team of nextTeams) {
        next[team.id] = {
          ...(current[team.id] ?? buildWarStatDraft(response.warModes)),
          teamName: current[team.id]?.teamName ?? team.name,
        };
      }
      return next;
    });
    setWarStatSaveError(null);
  }, []);

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

  useEffect(() => {
    if (loadingProfileHeroes || loadingWarStatTeams) {
      return;
    }

    const validProfileHeroIds = new Set(profileHeroes.map((hero) => hero.id));
    const hasInvalidHero = warStatTeams.some((team) =>
      team.slots.some((slot) => slot.playerProfileHeroId && !validProfileHeroIds.has(slot.playerProfileHeroId)),
    );

    if (!hasInvalidHero) {
      return;
    }

    void apiJson<PlayerWarStatAttackTeamsResponse>('/api/v1/profile/me/war-stat-attack-teams')
      .then((response) => {
        applyWarStatResponse(response);
      })
      .catch((error) => {
        if (error instanceof ApiError) {
          setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
        } else {
          setWarStatSaveError(messages.profile.warStatsSaveError);
        }
      });
  }, [apiJson, applyWarStatResponse, loadingProfileHeroes, loadingWarStatTeams, messages.profile.warStatsSaveError, profileHeroes, warStatTeams]);

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

  const openWarSlotPicker = (warModeCode: string, teamIndex: number, slot: number) => {
    setWarSlotPicker({
      warModeCode,
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
      if (
        normalizeWarModeCode(team.warModeCode) !== normalizeWarModeCode(warSlotPicker.warModeCode) ||
        team.teamIndex !== warSlotPicker.teamIndex
      ) {
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
      if (normalizeWarModeCode(team.warModeCode) !== activeWarModeCode || team.teamIndex !== teamIndex) {
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
      if (normalizeWarModeCode(team.warModeCode) !== activeWarModeCode || team.teamIndex !== teamIndex) {
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
    const nextTeams = warTeams.map((team) => {
      if (normalizeWarModeCode(team.warModeCode) !== activeWarModeCode) {
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

  const openWarStatSlotPicker = (teamId: string, slot: number) => {
    setWarStatSlotPicker({ teamId, slot });
    setWarStatSaveError(null);
  };

  const handleSaveWarStatTeam = async (
    teamId: string,
    nextSlots: PlayerWarStatAttackTeamResponse['slots'],
    nextName?: string,
  ) => {
    setSavingWarStatTeams(true);

    try {
      const response = await apiPutJson<PlayerWarStatAttackTeamUpdateRequest, PlayerWarStatAttackTeamsResponse>(
        `/api/v1/profile/me/war-stat-attack-teams/${teamId}`,
        { name: (nextName ?? warStatTeamMap.get(teamId)?.name ?? '').trim() || 'Team', slots: nextSlots },
      );
      applyWarStatResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTeams(false);
    }
  };

  const handleAssignWarStatHero = async (profileHeroId: string) => {
    if (!warStatSlotPicker) {
      return;
    }

    const team = warStatTeamMap.get(warStatSlotPicker.teamId);
    if (!team) {
      return;
    }

    const nextSlots = team.slots.map((slot) =>
      slot.slot === warStatSlotPicker.slot
        ? { ...slot, playerProfileHeroId: profileHeroId }
        : slot,
    );

    setWarStatTeams((current) =>
      current.map((item) =>
        item.id === team.id
          ? { ...item, slots: nextSlots }
          : item,
      ),
    );
    setWarStatSlotPicker(null);
    await handleSaveWarStatTeam(team.id, nextSlots);
  };

  const handleClearWarStatSlot = async (teamId: string, slotIndex: number) => {
    const team = warStatTeamMap.get(teamId);
    if (!team) {
      return;
    }

    const nextSlots = team.slots.map((slot) =>
      slot.slot === slotIndex
        ? { ...slot, playerProfileHeroId: null }
        : slot,
    );

    setWarStatTeams((current) =>
      current.map((item) =>
        item.id === team.id
          ? { ...item, slots: nextSlots }
          : item,
      ),
    );
    await handleSaveWarStatTeam(team.id, nextSlots);
  };

  const handleRenameWarStatTeam = async (teamId: string, nextName: string) => {
    const team = warStatTeamMap.get(teamId);
    if (!team) {
      return;
    }

    const trimmedName = nextName.trim() || `Team ${team.teamOrder}`;
    setWarStatTeams((current) =>
      current.map((item) =>
        item.id === team.id
          ? { ...item, name: trimmedName }
          : item,
      ),
    );
    setWarStatDraftsByTeamId((current) => ({
      ...current,
      [teamId]: {
        ...(current[teamId] ?? buildWarStatDraft(warModes)),
        teamName: trimmedName,
      },
    }));
    await handleSaveWarStatTeam(team.id, team.slots, trimmedName);
  };

  const handleCreateWarStatTeam = async () => {
    setSavingWarStatTeams(true);

    try {
      const response = await apiPostJson<Record<string, never>, PlayerWarStatAttackTeamsResponse>(
        '/api/v1/profile/me/war-stat-attack-teams',
        {},
      );
      applyWarStatResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTeams(false);
    }
  };

  const handleDeleteWarStatTeam = async (teamId: string) => {
    setSavingWarStatTeams(true);

    try {
      const response = await apiDelete<PlayerWarStatAttackTeamsResponse>(
        `/api/v1/profile/me/war-stat-attack-teams/${teamId}`,
      );
      applyWarStatResponse(response);
      if (warStatHistoryModal?.teamId === teamId) {
        setWarStatHistoryModal(null);
      }
      if (warStatAddRecordModal?.teamId === teamId) {
        setWarStatAddRecordModal(null);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTeams(false);
    }
  };

  const persistWarStatTeamOrder = async (
    nextTeams: PlayerWarStatAttackTeamResponse[],
    previousTeams: PlayerWarStatAttackTeamResponse[],
  ) => {
    const normalizedTeams = nextTeams.map((team, index) => ({
      ...team,
      teamOrder: index + 1,
    }));

    setWarStatTeams(normalizedTeams);
    setSavingWarStatTeams(true);
    setWarStatSaveError(null);
    setWarStatSaveMessage(null);

    try {
      const response = await apiPutJson<PlayerWarStatAttackTeamsReorderRequest, PlayerWarStatAttackTeamsResponse>(
        '/api/v1/profile/me/war-stat-attack-teams/order',
        { teamIds: normalizedTeams.map((team) => team.id) },
      );
      applyWarStatResponse(response);
    } catch (error) {
      setWarStatTeams(previousTeams);
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setDraggedWarStatTeamId(null);
      setSavingWarStatTeams(false);
    }
  };

  const handleReorderWarStatTeams = async (draggedTeamId: string, targetTeamId: string) => {
    if (!warStatManualOrderEnabled || draggedTeamId === targetTeamId) {
      return;
    }

    const draggedIndex = warStatTeams.findIndex((team) => team.id === draggedTeamId);
    const targetIndex = warStatTeams.findIndex((team) => team.id === targetTeamId);
    if (draggedIndex < 0 || targetIndex < 0) {
      return;
    }

    const previousTeams = warStatTeams;
    const nextTeams = [...warStatTeams];
    const [draggedTeam] = nextTeams.splice(draggedIndex, 1);
    nextTeams.splice(targetIndex, 0, draggedTeam);

    await persistWarStatTeamOrder(nextTeams, previousTeams);
  };

  const handleMoveWarStatTeam = async (teamId: string, direction: 'up' | 'down') => {
    if (!warStatManualOrderEnabled) {
      return;
    }

    const currentIndex = warStatTeams.findIndex((team) => team.id === teamId);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= warStatTeams.length) {
      return;
    }

    const previousTeams = warStatTeams;
    const nextTeams = [...warStatTeams];
    const [movedTeam] = nextTeams.splice(currentIndex, 1);
    nextTeams.splice(targetIndex, 0, movedTeam);

    await persistWarStatTeamOrder(nextTeams, previousTeams);
  };

  const handleWarStatDraftChange = (teamId: string, patch: Partial<WarStatRecordDraft>) => {
    setWarStatDraftsByTeamId((current) => ({
      ...current,
      [teamId]: {
        ...(current[teamId] ?? buildWarStatDraft(warModes)),
        ...patch,
      },
    }));
  };

  const openWarStatTeamTagPicker = (teamId: string) => {
    const team = warStatTeamMap.get(teamId);
    if (!team) {
      return;
    }
    setWarStatTeamTagPicker({
      teamId,
      selectedTagIds: team.tags.map((tag) => tag.id),
    });
    setWarStatSaveError(null);
  };

  const handleSaveWarStatTeamTags = async () => {
    if (!warStatTeamTagPicker) {
      return;
    }

    setSavingWarStatTags(true);
    try {
      const response = await apiPutJson<PlayerWarStatTeamTagsUpdateRequest, PlayerWarStatAttackTeamsResponse>(
        `/api/v1/profile/me/war-stat-attack-teams/${warStatTeamTagPicker.teamId}/tags`,
        { tagIds: warStatTeamTagPicker.selectedTagIds },
      );
      applyWarStatResponse(response);
      setWarStatTeamTagPicker(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTags(false);
    }
  };

  const handleCreateOrUpdateWarStatTag = async () => {
    if (!warStatTagEditor) {
      return;
    }

    const payload: PlayerWarStatTeamTagUpsertRequest = {
      name: warStatTagEditor.name,
      iconKey: warStatTagEditor.iconKey,
      imageUrl: warStatTagEditor.imageUrl,
    };

    setSavingWarStatTags(true);
    try {
      const response = warStatTagEditor.tagId
        ? await apiPutJson<PlayerWarStatTeamTagUpsertRequest, PlayerWarStatTeamTagCatalogResponse>(
            `/api/v1/profile/me/war-stat-tags/${warStatTagEditor.tagId}`,
            payload,
          )
        : await apiPostJson<PlayerWarStatTeamTagUpsertRequest, PlayerWarStatTeamTagCatalogResponse>(
            '/api/v1/profile/me/war-stat-tags',
            payload,
          );

      setWarStatTagCatalog(response);
      setWarStatTagEditor(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTags(false);
    }
  };

  const handleDeleteWarStatTag = async (tagId: string) => {
    setSavingWarStatTags(true);
    try {
      const response = await apiDelete<PlayerWarStatTeamTagCatalogResponse>(`/api/v1/profile/me/war-stat-tags/${tagId}`);
      setWarStatTagCatalog(response);
      setWarStatTagFilters((current) => current.filter((value) => value !== tagId));
      setWarStatTeams((current) =>
        current.map((team) => ({
          ...team,
          tags: team.tags.filter((tag) => tag.id !== tagId),
        })),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTags(false);
    }
  };

  const toggleWarStatDetails = (teamId: string) => {
    setWarStatExpandedTeamIds((current) =>
      current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId],
    );
  };

  const handleAddWarStatRecord = async (teamId: string) => {
    const draft = warStatDraftsByTeamId[teamId] ?? buildWarStatDraft(warModes);
    const team = warStatTeamMap.get(teamId);
    if (!team || team.slots.every((slot) => slot.playerProfileHeroId === null)) {
      return;
    }
    setSavingWarStatTeams(true);

    try {
      const response = await apiPostJson<PlayerWarStatAttackRecordUpsertRequest, PlayerWarStatAttackTeamsResponse>(
        `/api/v1/profile/me/war-stat-attack-teams/${teamId}/records`,
        draft,
      );
      applyWarStatResponse(response);
      setWarStatDraftsByTeamId((current) => ({
        ...current,
        [teamId]: {
          ...buildWarStatDraft(warModes),
          teamName: team.name,
        },
      }));
      setWarStatAddRecordModal(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTeams(false);
    }
  };

  const handleDeleteWarStatRecord = async (teamId: string, recordId: string) => {
    setSavingWarStatTeams(true);

    try {
      const response = await apiDelete<PlayerWarStatAttackTeamsResponse>(
        `/api/v1/profile/me/war-stat-attack-teams/${teamId}/records/${recordId}`,
      );
      applyWarStatResponse(response);
    } catch (error) {
      if (error instanceof ApiError) {
        setWarStatSaveError(error.message || messages.profile.warStatsSaveError);
      } else {
        setWarStatSaveError(messages.profile.warStatsSaveError);
      }
    } finally {
      setSavingWarStatTeams(false);
    }
  };

  const handleImportWarTeamToStats = async (warModeCode: string, teamIndex: number) => {
    setSavingWarStatTeams(true);
    setWarImportNotice(null);

    try {
      const response = await apiPostJson<
        { warModeCode: string; teamIndex: number },
        PlayerWarStatAttackTeamsResponse
      >('/api/v1/profile/me/war-stat-attack-teams/import-war-team', {
        warModeCode,
        teamIndex,
      });
      applyWarStatResponse(response);
      setWarImportNotice({
        warModeCode,
        teamIndex,
        type: 'success',
        message: locale === 'ru'
          ? 'Команда добавлена во вкладку "Военная статистика".'
          : 'Team was added to War statistics.',
      });
      setWarStatSaveError(null);
      setWarStatSaveMessage(null);
    } catch (error) {
      let nextMessage = messages.profile.warStatsSaveError;

      if (error instanceof ApiError) {
        nextMessage =
          error.message === 'This war statistic team already exists' || error.message === 'Request failed with status 400'
            ? (locale === 'ru'
                ? 'Команда уже добавлена.'
                : 'Team is already added.')
            : error.message === 'Cannot import an empty war team'
              ? (locale === 'ru'
                  ? 'Нельзя добавить пустую команду из вкладки "Война".'
                  : 'Cannot import an empty war team.')
              : (error.message || messages.profile.warStatsSaveError);
      }

      setWarImportNotice({
        warModeCode,
        teamIndex,
        type: 'error',
        message: nextMessage,
      });
      setWarStatSaveError(null);
      setWarStatSaveMessage(null);
    } finally {
      setSavingWarStatTeams(false);
    }
  };

  const handleAddHero = async (heroId: number) => {
    setAddingHeroId(heroId);

    try {
      const selectedHero = selectorResult?.items.find((item) => item.id === heroId) ?? null;
      const response = await apiPostJson<PlayerProfileHeroCreateRequest, PlayerProfileHeroResponse>(
        '/api/v1/profile/me/heroes',
        {
          heroId,
          powerGrade: getInitialPowerGradeForRarity(selectedHero?.rarityStars ?? 5),
        },
      );

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
    setRarityFilters([]);
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

      const nextWarStatTeams = warStatTeams.map((team) => ({
        ...team,
        slots: team.slots.map((slot) =>
          slot.playerProfileHeroId === profileHeroId
            ? { ...slot, playerProfileHeroId: null }
            : slot,
        ),
      }));
      setWarStatTeams(nextWarStatTeams);
      const latestWarStatState = await apiJson<PlayerWarStatAttackTeamsResponse>('/api/v1/profile/me/war-stat-attack-teams');
      applyWarStatResponse(latestWarStatState);
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
        <button
          type="button"
          onClick={() => setActiveTab('warStats')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'warStats'
              ? 'bg-cyan-400/10 text-cyan-300'
              : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
          }`}
        >
          {messages.profile.tabWarStats}
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

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <IconFilterSelect
                    label={locale === 'ru' ? 'Редкость' : 'Rarity'}
                    values={rarityFilters}
                    allLabel={locale === 'ru' ? 'Все редкости' : 'All rarities'}
                    options={rarityFilterOptions}
                    onChange={setRarityFilters}
                    locale={heroLocale}
                  />

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
                    rarityStars={hero.rarityStars}
                    elementName={hero.elementName}
                    heroClassName={hero.heroClassName}
                    heroClassKey={hero.heroClassKey}
                    powerGrade={hero.powerGrade}
                    talentLevel={hero.talentLevel}
                    costumeCollectionLevel={costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0}
                    locale={heroLocale}
                    powerGradeOptions={buildPowerGradeOptions(heroLocale, hero.rarityStars)}
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
      ) : activeTab === 'warStats' ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    {messages.profile.warStatsTitle}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--foreground-soft)]">
                    {messages.profile.warStatsSelectHeroes}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {savingWarStatTeams ? (
                    <span className="inline-flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                      {messages.profile.warStatsSaving}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setWarStatTagEditor({ tagId: null, name: '', iconKey: familyTagIconOptions[0]?.value ?? '', imageUrl: familyTagIconOptions[0]?.imageUrl ?? '' })}
                    disabled={savingWarStatTags || familyTagIconOptions.length === 0}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" />
                    <span>{locale === 'ru' ? 'Новая метка' : 'New tag'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarStatTagManagerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>{locale === 'ru' ? 'Мои метки' : 'My tags'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreateWarStatTeam()}
                    disabled={savingWarStatTeams}
                    title={messages.profile.warStatsAddTeam}
                    aria-label={messages.profile.warStatsAddTeam}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Shield className="h-4.5 w-4.5" />
                    <Plus className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-cyan-500 p-[1px] text-slate-950" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWarStatControlsOpen((current) => !current)}
                className="flex items-center justify-between gap-3 text-left text-sm font-medium text-[var(--foreground-soft)]"
              >
                <span>{locale === 'ru' ? 'Поиск и сортировка' : 'Search and sort'}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setWarStatSearchQuery('');
                      setWarStatTagFilters([]);
                      setWarStatSortField('teamOrder');
                      setWarStatSortOrder('asc');
                      setWarStatModeFilterCode('ALL');
                    }}
                    title={locale === 'ru' ? 'Сбросить поиск и сортировку' : 'Reset search and sorting'}
                    aria-label={locale === 'ru' ? 'Сбросить поиск и сортировку' : 'Reset search and sorting'}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <ChevronDown className={`h-4 w-4 transition ${warStatControlsOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {warStatControlsOpen ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                    <span>{locale === 'ru' ? 'Название команды' : 'Team name'}</span>
                    <input
                      value={warStatSearchQuery}
                      onChange={(event) => setWarStatSearchQuery(event.target.value)}
                      placeholder={locale === 'ru' ? 'Введите название команды' : 'Type team name'}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                    <span>{locale === 'ru' ? 'Режим войны' : 'War mode'}</span>
                    <WarModeSelect
                      value={warStatModeFilterCode}
                      options={warModes.filter((mode) => normalizeWarModeCode(mode.code) !== 'UNIVERSAL')}
                      locale={heroLocale}
                      onChange={setWarStatModeFilterCode}
                      includeAllOption
                      allLabel={locale === 'ru' ? 'Все режимы' : 'All war modes'}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                    <span>{locale === 'ru' ? 'Сортировка' : 'Sort by'}</span>
                    <select
                      value={warStatSortField}
                      onChange={(event) => setWarStatSortField(event.target.value as WarStatSortField)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    >
                      <option value="teamOrder">{locale === 'ru' ? 'Порядок команд' : 'Team order'}</option>
                      <option value="successRate">{locale === 'ru' ? 'Процент успешных атак' : 'Success rate'}</option>
                      <option value="failedRate">{locale === 'ru' ? 'Процент неуспешных атак' : 'Failed rate'}</option>
                      <option value="oneShotRate">{locale === 'ru' ? 'Процент шотов' : 'One-shot rate'}</option>
                      <option value="cleanupRate">{locale === 'ru' ? 'Процент добивов' : 'Cleanup rate'}</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                    <span>{locale === 'ru' ? 'Порядок' : 'Order'}</span>
                    <select
                      value={warStatSortOrder}
                      onChange={(event) => setWarStatSortOrder(event.target.value as WarStatSortOrder)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    >
                      <option value="asc">{locale === 'ru' ? 'По возрастанию' : 'Ascending'}</option>
                      <option value="desc">{locale === 'ru' ? 'По убыванию' : 'Descending'}</option>
                    </select>
                  </label>

                  <IconFilterSelect
                    label={locale === 'ru' ? 'Метки' : 'Tags'}
                    values={warStatTagFilters}
                    allLabel={locale === 'ru' ? 'Все метки' : 'All tags'}
                    options={availableWarStatTagOptions}
                    onChange={setWarStatTagFilters}
                    locale={heroLocale}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {warStatSaveMessage ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {warStatSaveMessage}
            </div>
          ) : null}

          {warStatSaveError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {warStatSaveError}
            </div>
          ) : null}

          {loadingWarStatTeams || loadingProfileHeroes ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                <span>{messages.profile.loadingHeroes}</span>
              </div>
            </div>
          ) : rosterCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--foreground-soft)] shadow-sm backdrop-blur-sm">
              {messages.profile.warStatsEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleWarStatTeams.map((team) => {
                const summary = buildWarStatSummary(team.records, warStatModeFilterCode);
                const draft = warStatDraftsByTeamId[team.id] ?? buildWarStatDraft(warModes);
                const teamLocked = team.records.length > 0;
                const teamExpanded = warStatExpandedTeamIds.includes(team.id);
                const teamEmpty = team.slots.every((slot) => slot.playerProfileHeroId === null);
                const teamIndex = warStatTeams.findIndex((item) => item.id === team.id);
                const canMoveWarStatTeamUp = warStatManualOrderEnabled && teamIndex > 0 && !savingWarStatTeams;
                const canMoveWarStatTeamDown =
                  warStatManualOrderEnabled && teamIndex >= 0 && teamIndex < warStatTeams.length - 1 && !savingWarStatTeams;

                return (
                  <div
                    key={team.id}
                    draggable={!warCompactMode && warStatManualOrderEnabled && !savingWarStatTeams}
                    onDragStart={(event) => {
                      if (warCompactMode || !warStatManualOrderEnabled || savingWarStatTeams) {
                        return;
                      }
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', team.id);
                      setDraggedWarStatTeamId(team.id);
                    }}
                    onDragOver={(event) => {
                      if (!warStatManualOrderEnabled || savingWarStatTeams) {
                        return;
                      }
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      if (!warStatManualOrderEnabled || savingWarStatTeams || !draggedWarStatTeamId) {
                        return;
                      }
                      event.preventDefault();
                      void handleReorderWarStatTeams(draggedWarStatTeamId, team.id);
                    }}
                    onDragEnd={() => setDraggedWarStatTeamId(null)}
                    className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm backdrop-blur-sm lg:grid-cols-[minmax(0,1fr)_340px] sm:p-4"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground-soft)]">
                            {warCompactMode ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => void handleMoveWarStatTeam(team.id, 'up')}
                                  disabled={!canMoveWarStatTeamUp}
                                  title={locale === 'ru' ? 'Поднять команду выше' : 'Move team up'}
                                  aria-label={locale === 'ru' ? 'Поднять команду выше' : 'Move team up'}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleMoveWarStatTeam(team.id, 'down')}
                                  disabled={!canMoveWarStatTeamDown}
                                  title={locale === 'ru' ? 'Опустить команду ниже' : 'Move team down'}
                                  aria-label={locale === 'ru' ? 'Опустить команду ниже' : 'Move team down'}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] ${
                                  warStatManualOrderEnabled ? 'cursor-grab' : 'cursor-not-allowed opacity-50'
                                }`}
                                title={
                                  warStatManualOrderEnabled
                                    ? (locale === 'ru' ? 'Перетащите, чтобы сменить порядок команды' : 'Drag to change team order')
                                    : (locale === 'ru' ? 'Для перетаскивания выберите сортировку по порядку команд, порядок по возрастанию и снимите фильтры' : 'To drag, use team order sorting, ascending order, and clear filters')
                                }
                              >
                                <GripVertical className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <span>{`${messages.profile.warTeam} ${team.teamOrder}`}</span>
                          </div>
                          <input
                            value={draft.teamName ?? team.name}
                            onChange={(event) => handleWarStatDraftChange(team.id, { teamName: event.target.value })}
                            onBlur={() => {
                              const nextName = (draft.teamName ?? team.name).trim();
                              if (nextName && nextName !== team.name) {
                                window.setTimeout(() => {
                                  void handleRenameWarStatTeam(team.id, nextName);
                                }, 0);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                (event.currentTarget as HTMLInputElement).blur();
                              }
                            }}
                            disabled={savingWarStatTeams}
                            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                          />
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {team.tags.map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                title={getWarStatTagLabel(tag, heroLocale, warModeByCode)}
                                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-2 py-1 text-[11px] text-[var(--foreground-soft)]"
                              >
                                {tag.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={tag.imageUrl} alt={getWarStatTagLabel(tag, heroLocale, warModeByCode)} className="h-4 w-4 object-contain" />
                                ) : null}
                                <span className="max-w-[9rem] truncate">{getWarStatTagLabel(tag, heroLocale, warModeByCode)}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => openWarStatTeamTagPicker(team.id)}
                              disabled={savingWarStatTags}
                              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{locale === 'ru' ? 'Метки' : 'Tags'}</span>
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDeleteWarStatTeam(team.id)}
                          title={messages.profile.warStatsDeleteTeam}
                          aria-label={messages.profile.warStatsDeleteTeam}
                          disabled={savingWarStatTeams}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                        {team.slots.map((slot) => {
                          const hero = slot.playerProfileHeroId ? rosterHeroCardMap.get(slot.playerProfileHeroId) ?? null : null;

                          return (
                            <WarHeroSlot
                              key={`${team.id}-${slot.slot}`}
                              hero={hero}
                              locale={heroLocale}
                              compact={warCompactMode}
                              costumeCollectionLevel={hero ? (costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0) : 0}
                              label={messages.profile.addHero}
                              removeLabel={messages.profile.removeHero}
                              onClick={
                                hero && hero.slug !== String(hero.heroId)
                                  ? () => handleOpenRosterHero(hero.slug)
                                  : teamLocked
                                    ? () => {}
                                    : () => openWarStatSlotPicker(team.id, slot.slot)
                              }
                              onRemove={
                                hero && !teamLocked
                                  ? () => void handleClearWarStatSlot(team.id, slot.slot)
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-3">
                          <div className="text-xs font-medium text-[var(--foreground-soft)]">
                            {messages.profile.warStatsSuccess}
                          </div>
                          <div className="mt-1 text-2xl font-bold text-emerald-300">
                            {summary.success}
                            <span className="ml-2 text-sm font-medium text-emerald-200">
                              ({summary.success + summary.failed > 0 ? Math.round((summary.success / (summary.success + summary.failed)) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-red-400/20 bg-red-400/8 p-3">
                          <div className="text-xs font-medium text-[var(--foreground-soft)]">
                            {messages.profile.warStatsFailed}
                          </div>
                          <div className="mt-1 text-2xl font-bold text-red-300">
                            {summary.failed}
                            <span className="ml-2 text-sm font-medium text-red-200">
                              ({summary.success + summary.failed > 0 ? Math.round((summary.failed / (summary.success + summary.failed)) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => toggleWarStatDetails(team.id)}
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
                        >
                          <span>{locale === 'ru' ? 'Детализация' : 'Details'}</span>
                          <ChevronDown className={`h-4 w-4 transition ${teamExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {teamExpanded ? (
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground-soft)]">
                              <div>{messages.profile.warStatsOneShot}</div>
                              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{summary.oneShot}</div>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground-soft)]">
                              <div>{messages.profile.warStatsCleanup}</div>
                              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{summary.cleanup}</div>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground-soft)]">
                              <div>{messages.profile.warStatsFailFull}</div>
                              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{summary.failFull}</div>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--foreground-soft)]">
                              <div>{messages.profile.warStatsFailCleanup}</div>
                              <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">{summary.failCleanup}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setWarStatHistoryModal({ teamId: team.id })}
                          title={locale === 'ru' ? 'Посмотреть историю' : 'View history'}
                          aria-label={locale === 'ru' ? 'Посмотреть историю' : 'View history'}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setWarStatAddRecordModal({ teamId: team.id })}
                          disabled={savingWarStatTeams || teamEmpty}
                          title={messages.profile.warStatsAddRecord}
                          aria-label={messages.profile.warStatsAddRecord}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <FilePlus2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => void handleCreateWarStatTeam()}
                  disabled={savingWarStatTeams}
                  title={messages.profile.warStatsAddTeam}
                  aria-label={messages.profile.warStatsAddTeam}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
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

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {warModes.map((warMode) => {
                  const modeCode = normalizeWarModeCode(warMode.code);
                  const selected = modeCode === activeWarModeCode;

                  return (
                    <button
                      key={warMode.code}
                      type="button"
                      onClick={() => setActiveWarModeCode(modeCode)}
                      className={`flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl border px-3 py-2 text-center text-xs font-semibold transition sm:text-sm ${
                        selected
                          ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-200'
                          : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <WarModeLabel
                        mode={warMode}
                        locale={heroLocale}
                        iconSizeClassName="h-4 w-4 sm:h-5 sm:w-5"
                        textClassName="justify-center"
                      />
                    </button>
                  );
                })}
              </div>

              {activeWarMode ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-[var(--foreground)]">
                    <WarModeLabel mode={activeWarMode} locale={heroLocale} iconSizeClassName="h-5 w-5" />
                  </div>
                  <p className="text-sm text-[var(--foreground-soft)]">
                    {getWarModeDescription(activeWarMode, heroLocale)}
                  </p>
                </div>
              ) : null}

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

              <button
                type="button"
                onClick={() => setWarTeamsExpanded((current) => !current)}
                className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-[var(--foreground-soft)]"
              >
                <span>{locale === 'ru' ? 'Список военных команд' : 'War team list'}</span>
                <ChevronDown className={`h-4 w-4 transition ${warTeamsExpanded ? 'rotate-180' : ''}`} />
              </button>
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
          ) : warTeamsExpanded ? (
            <div className="space-y-4">
              {activeWarTeams.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--foreground-soft)] shadow-sm backdrop-blur-sm">
                  {locale === 'ru' ? 'Военные команды пока не загружены.' : 'War teams are not loaded yet.'}
                </div>
              ) : (
                activeWarTeams.map((team) => (
                  <div
                    key={`${team.warModeCode}-${team.teamIndex}`}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm backdrop-blur-sm sm:p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground-soft)]">
                        {`${messages.profile.warTeam} ${team.teamIndex}`}
                      </h3>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleImportWarTeamToStats(team.warModeCode, team.teamIndex)}
                          title={messages.profile.warStatsImportTeam}
                          aria-label={messages.profile.warStatsImportTeam}
                          disabled={savingWarStatTeams || team.slots.every((slot) => slot.playerProfileHeroId === null)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>

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
                    </div>

                    {warImportNotice?.warModeCode === team.warModeCode && warImportNotice.teamIndex === team.teamIndex ? (
                      <div
                        className={`mb-3 rounded-2xl px-3 py-2 text-xs ${
                          warImportNotice.type === 'success'
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : 'border border-red-500/30 bg-red-500/10 text-red-300'
                        }`}
                      >
                        {warImportNotice.message}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                      {team.slots.map((slot) => {
                        const hero = slot.playerProfileHeroId ? rosterHeroCardMap.get(slot.playerProfileHeroId) ?? null : null;

                        return (
                          <WarHeroSlot
                            key={`${team.warModeCode}-${team.teamIndex}-${slot.slot}`}
                            hero={hero}
                            locale={heroLocale}
                            compact={warCompactMode}
                            costumeCollectionLevel={hero ? (costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0) : 0}
                            label={messages.profile.addHero}
                            removeLabel={messages.profile.removeHero}
                            onClick={
                              hero && hero.slug !== String(hero.heroId)
                                ? () => handleOpenRosterHero(hero.slug)
                                : () => openWarSlotPicker(team.warModeCode, team.teamIndex, slot.slot)
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
                ))
              )}
            </div>
          ) : null}
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

              <div className="mb-4">
                <input
                  value={warSlotPickerSearch}
                  onChange={(event) => setWarSlotPickerSearch(event.target.value)}
                  placeholder={messages.profile.searchHeroes}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </div>

              <div className="min-h-[18rem] flex-1 overflow-y-auto overscroll-contain pr-1" onWheel={(event) => event.stopPropagation()}>
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
                                sizeClassName="h-3 w-3 sm:h-4 sm:w-4"
                              />
                            ) : null}
                            {(costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0) > 0 ? (
                              <CostumeCollectionBadge
                                level={costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0}
                                locale={heroLocale}
                                className="left-1 top-5"
                                sizeClassName="h-3 w-3 sm:h-4 sm:w-4"
                                textClassName="text-[6px] sm:text-[9px]"
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
                            label={getPowerGradeLabelForRarity(hero.powerGrade, heroLocale, hero.rarityStars)}
                            imageUrl={getPowerGradeImage(hero.powerGrade, hero.rarityStars)}
                            locale={heroLocale}
                            sizeClassName="h-4 w-4 sm:h-5 sm:w-5"
                          />
                          <TalentBadge
                            talentLevel={hero.talentLevel}
                            locale={heroLocale}
                            sizeClassName="h-[16px] w-[16px] sm:h-[20px] sm:w-[20px]"
                            textClassName="text-[7px] sm:text-[11px]"
                          />
                        </div>

                        <div className="mt-2">
                          <div className="line-clamp-2 min-h-[2rem] text-[11px] font-semibold text-[var(--foreground)] sm:text-xs">
                            {hero.name}
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

      {warStatTeamTagPicker ? (
        <div
          className="fixed inset-0 z-[94] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWarStatTeamTagPicker(null)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">
                    {locale === 'ru' ? 'Метки команды' : 'Team tags'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                    {(locale === 'ru'
                      ? `Выбрано ${warStatTeamTagPicker.selectedTagIds.length} из ${warStatTagCatalog?.teamTagLimit ?? 7}`
                      : `Selected ${warStatTeamTagPicker.selectedTagIds.length} of ${warStatTagCatalog?.teamTagLimit ?? 7}`)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setWarStatTeamTagPicker(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-[18rem] flex-1 overflow-y-auto pr-1">
                <div className="space-y-1">
                  {availableWarStatTags.map((tag) => {
                    const selected = warStatTeamTagPicker.selectedTagIds.includes(tag.id);
                    const limitReached = !selected && warStatTeamTagPicker.selectedTagIds.length >= (warStatTagCatalog?.teamTagLimit ?? 7);
                    const tagLabel = getWarStatTagLabel(tag, heroLocale, warModeByCode);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        disabled={limitReached}
                        onClick={() =>
                          setWarStatTeamTagPicker((current) =>
                            current == null
                              ? current
                              : {
                                  ...current,
                                  selectedTagIds: selected
                                    ? current.selectedTagIds.filter((value) => value !== tag.id)
                                    : [...current.selectedTagIds, tag.id],
                                },
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition ${
                          selected
                            ? 'bg-cyan-400/12 text-cyan-200'
                            : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {tag.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tag.imageUrl} alt={tagLabel} className="h-7 w-7 object-contain" />
                        ) : (
                          <div className="h-7 w-7 rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)]" />
                        )}
                        <span className="min-w-0 flex-1 leading-tight">{tagLabel}</span>
                        {selected ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setWarStatTeamTagPicker(null)}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                >
                  {locale === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveWarStatTeamTags()}
                  disabled={savingWarStatTags}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingWarStatTags ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{locale === 'ru' ? 'Сохранить' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {warStatTagManagerOpen ? (
        <div
          className="fixed inset-0 z-[96] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWarStatTagManagerOpen(false)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)]">
                    {locale === 'ru' ? 'Мои метки' : 'My tags'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                    {locale === 'ru'
                      ? `Пользовательских меток: ${customWarStatTags.length} из ${warStatTagCatalog?.customTagLimit ?? 100}`
                      : `Custom tags: ${customWarStatTags.length} of ${warStatTagCatalog?.customTagLimit ?? 100}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setWarStatTagManagerOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setWarStatTagEditor({ tagId: null, name: '', iconKey: familyTagIconOptions[0]?.value ?? '', imageUrl: familyTagIconOptions[0]?.imageUrl ?? '' })}
                  disabled={familyTagIconOptions.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FilePlus2 className="h-4 w-4" />
                  <span>{locale === 'ru' ? 'Создать метку' : 'Create tag'}</span>
                </button>
              </div>

              <div className="min-h-[14rem] flex-1 overflow-y-auto overscroll-contain pr-1" onWheel={(event) => event.stopPropagation()}>
                {customWarStatTags.length > 0 ? (
                  <div className="space-y-2">
                    {customWarStatTags.map((tag) => {
                      const tagLabel = getWarStatTagLabel(tag, heroLocale, warModeByCode);
                      return (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {tag.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={tag.imageUrl} alt={tagLabel} className="h-8 w-8 object-contain" />
                            ) : null}
                            <span className="truncate text-sm font-medium text-[var(--foreground)]">{tagLabel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setWarStatTagEditor({ tagId: tag.id, name: tag.name, iconKey: tag.iconKey, imageUrl: tag.imageUrl ?? '' })}
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                            >
                              {locale === 'ru' ? 'Изменить' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteWarStatTag(tag.id)}
                              disabled={savingWarStatTags}
                              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {locale === 'ru' ? 'Удалить' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-soft)]">
                    {locale === 'ru' ? 'Пользовательских меток пока нет.' : 'No custom tags yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {warStatTagEditor ? (
        <div
          className="fixed inset-0 z-[97] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWarStatTagEditor(null)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  {warStatTagEditor.tagId
                    ? (locale === 'ru' ? 'Изменить метку' : 'Edit tag')
                    : (locale === 'ru' ? 'Новая метка' : 'New tag')}
                </h3>
                <button
                  type="button"
                  onClick={() => setWarStatTagEditor(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1" onWheel={(event) => event.stopPropagation()}>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{locale === 'ru' ? 'Название' : 'Name'}</span>
                  <input
                    value={warStatTagEditor.name}
                    onChange={(event) => setWarStatTagEditor((current) => current == null ? current : { ...current, name: event.target.value.slice(0, 50) })}
                    maxLength={50}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                  />
                </label>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-[var(--foreground)]">{locale === 'ru' ? 'Символ' : 'Icon'}</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {familyTagIconOptions.map((option) => {
                      const selected = option.value === warStatTagEditor.iconKey;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setWarStatTagEditor((current) => current == null ? current : { ...current, iconKey: option.value, imageUrl: option.imageUrl ?? '' })}
                          className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-xs transition ${
                            selected
                              ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          {option.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={option.imageUrl} alt="" className="h-8 w-8 object-contain" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setWarStatTagEditor(null)}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                >
                  {locale === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateOrUpdateWarStatTag()}
                  disabled={savingWarStatTags || !warStatTagEditor.name.trim() || !warStatTagEditor.imageUrl}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingWarStatTags ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>{locale === 'ru' ? 'Сохранить' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {warStatSlotPicker ? (
        <div
          className="fixed inset-0 z-[95] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWarStatSlotPicker(null)}
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
                  onClick={() => setWarStatSlotPicker(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4">
                <input
                  value={warStatSlotPickerSearch}
                  onChange={(event) => setWarStatSlotPickerSearch(event.target.value)}
                  placeholder={messages.profile.searchHeroes}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </div>
              <div className="min-h-[18rem] flex-1 overflow-y-auto pr-1">
                {availableWarStatRosterCards.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
                    {availableWarStatRosterCards.map((hero) => (
                      <button
                        key={hero.profileHeroId}
                        type="button"
                        onClick={() => void handleAssignWarStatHero(hero.profileHeroId)}
                        disabled={savingWarStatTeams}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-left shadow-sm transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <div className="relative inline-block overflow-visible">
                          {hero.heroClassKey ? (
                            <CornerIconBadge
                              imageUrl={HERO_CLASS_ICON_BY_KEY[hero.heroClassKey]}
                              alt={hero.heroClassName ?? (locale === 'ru' ? 'Класс героя' : 'Hero class')}
                              className="pointer-events-none absolute left-1 top-1 z-10"
                              sizeClassName="h-3 w-3 sm:h-4 sm:w-4"
                            />
                          ) : null}
                          {(costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0) > 0 ? (
                            <CostumeCollectionBadge
                              level={costumeCollectionLevelByGroup.get(hero.baseHeroId ?? hero.heroId) ?? 0}
                              locale={heroLocale}
                              className="left-1 top-5"
                              sizeClassName="h-3 w-3 sm:h-4 sm:w-4"
                              textClassName="text-[6px] sm:text-[9px]"
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
                            label={getPowerGradeLabelForRarity(hero.powerGrade, heroLocale, hero.rarityStars)}
                            imageUrl={getPowerGradeImage(hero.powerGrade, hero.rarityStars)}
                            locale={heroLocale}
                            sizeClassName="h-4 w-4 sm:h-5 sm:w-5"
                          />
                          <TalentBadge
                            talentLevel={hero.talentLevel}
                            locale={heroLocale}
                            sizeClassName="h-[16px] w-[16px] sm:h-[20px] sm:w-[20px]"
                            textClassName="text-[7px] sm:text-[11px]"
                          />
                        </div>

                        <div className="mt-2">
                          <div className="line-clamp-2 min-h-[2rem] text-[11px] font-semibold text-[var(--foreground)] sm:text-xs">
                            {hero.name}
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

      {warStatHistoryModal ? (
        <div
          className="fixed inset-0 z-[96] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWarStatHistoryModal(null)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  {locale === 'ru' ? 'История команды' : 'Team history'}
                </h3>
                <button
                  type="button"
                  onClick={() => setWarStatHistoryModal(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-[14rem] flex-1 overflow-y-auto pr-1">
                {(warStatTeamMap.get(warStatHistoryModal.teamId)?.records ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(warStatTeamMap.get(warStatHistoryModal.teamId)?.records ?? []).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--foreground)]">
                            {getWarStatResultTypeLabel(record.resultType, heroLocale)}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-soft)]">
                            <WarModeLabel
                              mode={
                                warModes.find((mode) => normalizeWarModeCode(mode.code) === normalizeWarModeCode(record.warModeCode)) ?? {
                                  code: record.warModeCode,
                                  nameRu: record.warModeCode,
                                  nameEn: record.warModeCode,
                                  descriptionRu: '',
                                  descriptionEn: '',
                                  sortOrder: 0,
                                }
                              }
                              locale={heroLocale}
                              iconSizeClassName="h-3.5 w-3.5"
                            />
                            <span>•</span>
                            <span>{record.battleDate}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteWarStatRecord(warStatHistoryModal.teamId, record.id)}
                          title={messages.profile.warStatsDeleteRecord}
                          aria-label={messages.profile.warStatsDeleteRecord}
                          disabled={savingWarStatTeams}
                          className="rounded-lg border border-red-500/30 bg-[var(--surface-strong)] p-1 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-soft)]">
                    {messages.profile.warStatsNoRecords}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {warStatAddRecordModal ? (
        <div
          className="fixed inset-0 z-[97] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setWarStatAddRecordModal(null)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  {messages.profile.warStatsAddRecord}
                </h3>
                <button
                  type="button"
                  onClick={() => setWarStatAddRecordModal(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {(() => {
                const teamId = warStatAddRecordModal.teamId;
                const draft = warStatDraftsByTeamId[teamId] ?? buildWarStatDraft(warModes);
                return (
                  <div className="space-y-3">
                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                      <span>{messages.profile.warStatsRecordType}</span>
                      <select
                        value={draft.resultType}
                        onChange={(event) => handleWarStatDraftChange(teamId, { resultType: event.target.value as WarStatAttackResultType })}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                      >
                        <option value="SUCCESS_ONE_SHOT">{messages.profile.warStatsOneShot}</option>
                        <option value="SUCCESS_CLEANUP">{messages.profile.warStatsCleanup}</option>
                        <option value="FAIL_FULL_ATTACK">{messages.profile.warStatsFailFull}</option>
                        <option value="FAIL_CLEANUP">{messages.profile.warStatsFailCleanup}</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                      <span>{messages.profile.warStatsWarMode}</span>
                      <WarModeSelect
                        value={draft.warModeCode}
                        onChange={(nextValue) => handleWarStatDraftChange(teamId, { warModeCode: nextValue })}
                        options={warModes.filter((mode) => normalizeWarModeCode(mode.code) !== 'UNIVERSAL')}
                        locale={heroLocale}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
                      <span>{messages.profile.warStatsBattleDate}</span>
                      <input
                        type="date"
                        value={draft.battleDate}
                        onChange={(event) => handleWarStatDraftChange(teamId, { battleDate: event.target.value })}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleAddWarStatRecord(teamId)}
                      disabled={savingWarStatTeams}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{messages.profile.warStatsAddRecord}</span>
                    </button>
                  </div>
                );
              })()}
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

