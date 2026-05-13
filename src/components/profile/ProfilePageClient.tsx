'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CircleHelp, Eraser, LoaderCircle, Plus, Save, ShieldAlert, Trash2, X } from 'lucide-react';

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
type HeroRosterSortField = 'createdAt' | 'name' | 'rarity';
type HeroRosterSortOrder = 'asc' | 'desc';

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
  powerGrade: HeroPowerGrade;
  talentLevel: number;
  slug: string;
  name: string;
  rarityStars: number;
  createdAt: string;
  previewUrl: string | null;
  elementName: string | null;
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

const POWER_GRADE_ASSET_BASE = '/heroes/power-grades';
const POWER_GRADE_IMAGE_BY_CODE: Record<HeroPowerGrade, string> = {
  FIRST_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_first_ascension.webp`,
  SECOND_ASCENSION: `${POWER_GRADE_ASSET_BASE}/power_grade_second_ascension.webp`,
  FULLY_ASCENDED: `${POWER_GRADE_ASSET_BASE}/power_grade_fully_ascended.webp`,
  FIRST_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_first_limit_broken.webp`,
  SECOND_LIMIT_BROKEN: `${POWER_GRADE_ASSET_BASE}/power_grade_second_limit_broken.webp`,
};

const POWER_GRADE_ORDER: HeroPowerGrade[] = [
  'FIRST_ASCENSION',
  'SECOND_ASCENSION',
  'FULLY_ASCENDED',
  'FIRST_LIMIT_BROKEN',
  'SECOND_LIMIT_BROKEN',
];

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
  const canOpenAbove = params.triggerRect.top >= params.estimatedHeight + FLOATING_POPOVER_MARGIN;
  const topBase = canOpenAbove
    ? params.triggerRect.top - params.estimatedHeight - 8
    : params.triggerRect.bottom + 8;
  const maxTop = Math.max(FLOATING_POPOVER_MARGIN, viewportHeight - params.estimatedHeight - FLOATING_POPOVER_MARGIN);
  const top = clamp(topBase, FLOATING_POPOVER_MARGIN, maxTop);

  return { top, left, width };
}

function getPowerGradeLabel(powerGrade: HeroPowerGrade, locale: HeroLocale): string {
  if (locale === 'RU') {
    switch (powerGrade) {
      case 'FIRST_ASCENSION':
        return 'Первая лычка';
      case 'SECOND_ASCENSION':
        return 'Вторая лычка';
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
    case 'FIRST_ASCENSION':
      return 'First ascension';
    case 'SECOND_ASCENSION':
      return 'Second ascension';
    case 'FULLY_ASCENDED':
      return 'Fully ascended';
    case 'FIRST_LIMIT_BROKEN':
      return 'First limit break';
    case 'SECOND_LIMIT_BROKEN':
      return 'Second limit break';
    default:
      return 'Power grade';
  }
}

function buildPowerGradeOptions(locale: HeroLocale): PowerGradeOption[] {
  return POWER_GRADE_ORDER.map((value) => ({
    value,
    label: getPowerGradeLabel(value, locale),
    imageUrl: POWER_GRADE_IMAGE_BY_CODE[value],
  }));
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
}: {
  powerGrade: HeroPowerGrade;
  label: string;
  imageUrl: string;
  interactive?: boolean;
  disabled?: boolean;
  options?: PowerGradeOption[];
  onChange?: (nextPowerGrade: HeroPowerGrade) => void;
  locale: HeroLocale;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(interactive);
  const popoverRef = useRef<HTMLDivElement | null>(null);
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
      if (!popoverRef.current?.contains(event.target as Node)) {
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
          className={`rounded-[5px] border border-white/12 bg-slate-950/88 p-px shadow-xl transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-70 ${
            highlight ? 'animate-pulse ring-1 ring-cyan-300/60' : ''
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className="h-5 w-5 rounded-[3px] object-contain sm:h-7 sm:w-7" />
        </button>
      ) : (
        <div className="rounded-[5px] border border-white/12 bg-slate-950/88 p-px shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className="h-5 w-5 rounded-[3px] object-contain sm:h-7 sm:w-7" />
        </div>
      )}

      {interactive && open && popoverStyle ? (
        <div
          className="fixed z-[120] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-2xl backdrop-blur-sm"
          style={{ top: popoverStyle.top, left: popoverStyle.left, width: popoverStyle.width }}
        >
          <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            {locale === 'RU' ? 'Степень прокачки' : 'Power grade'}
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
        </div>
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
}: {
  talentLevel: number;
  interactive?: boolean;
  disabled?: boolean;
  locale: HeroLocale;
  onChange?: (nextTalentLevel: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<string>(String(talentLevel));
  const [highlight, setHighlight] = useState(interactive);
  const popoverRef = useRef<HTMLDivElement | null>(null);
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
      if (!popoverRef.current?.contains(event.target as Node)) {
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
          className={`relative flex h-[22px] w-[22px] items-center justify-center rounded-md transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[30px] sm:w-[30px] ${
            highlight && talentLevel === 0 ? 'animate-pulse' : ''
          }`}
        >
          {hasVisibleGem ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TALENT_LEVEL_IMAGE_URL}
                alt={titleLabel}
                className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(15,23,42,0.65)]"
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
        <div className="relative flex h-[22px] w-[22px] items-center justify-center rounded-md sm:h-[30px] sm:w-[30px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TALENT_LEVEL_IMAGE_URL}
            alt={titleLabel}
            className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(15,23,42,0.65)]"
          />
          <span className="absolute inset-0 flex items-center justify-center px-[3px] text-[9px] font-extrabold leading-none text-slate-950 sm:px-1 sm:text-[11px]">
            {talentLevel}
          </span>
        </div>
      ) : null}

      {interactive && open && popoverStyle ? (
        <div
          className="fixed z-[120] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 shadow-2xl backdrop-blur-sm"
          style={{ top: popoverStyle.top, left: popoverStyle.left, width: popoverStyle.width }}
        >
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            {locale === 'RU' ? 'Уровень таланта' : 'Talent level'}
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
        </div>
      ) : null}
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
  powerGrade,
  isCostume,
  costumeIndex,
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
  powerGrade: HeroPowerGrade;
  isCostume?: boolean;
  costumeIndex?: number | null;
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
  const content = (
    <>
      <div className="relative overflow-visible">
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
          interactive
          disabled={talentLevelUpdating}
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
      {isCostume ? (
        <div className="pointer-events-none absolute left-1 top-1 z-10 rounded-full border border-cyan-400/40 bg-slate-950/85 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-cyan-200 shadow-lg sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[10px]">
          {`C${costumeIndex ?? '?'}`}
        </div>
      ) : null}

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
  onClick,
  onRemove,
}: {
  hero: RosterHeroCard | null;
  locale: HeroLocale;
  label: string;
  removeLabel: string;
  compact: boolean;
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

  return (
    <div className="group relative">
      {hero.isCostume ? (
        <div className="pointer-events-none absolute left-1 top-1 z-10 rounded-full border border-cyan-400/35 bg-slate-950/85 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-cyan-200 shadow-lg">
          {`C${hero.costumeIndex ?? '?'}`}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onClick}
        className={`flex aspect-[0.72] w-full flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center shadow-sm transition hover:bg-[var(--surface-hover)] ${
          compact ? 'gap-1 p-1.5 sm:p-2' : 'gap-1.5 p-2 sm:p-3'
        }`}
      >
        <div className="relative overflow-visible">
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

        const unresolvedIds = new Set(missingIds);
        let page = 0;
        let hasNext = true;
        const foundItems = new Map<number, PublicHeroCatalogItem>();

        while (hasNext && unresolvedIds.size > 0) {
          const params = new URLSearchParams({
            page: String(page),
            size: '100',
            language: heroLocale,
          });

          const response = await apiJson<PublicHeroPageResponse>(`/api/v1/public/heroes?${params.toString()}`);

          for (const item of response.items) {
            if (unresolvedIds.has(item.id)) {
              foundItems.set(item.id, item);
              unresolvedIds.delete(item.id);
            }
          }

          hasNext = response.hasNext;
          page += 1;
        }

        if (!cancelled && foundItems.size > 0) {
          setRosterHeroMap((current) => {
            const next = new Map(current);
            for (const [heroId, item] of foundItems.entries()) {
              next.set(heroId, item);
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
  }, [apiJson, authenticated, heroLocale, rosterHeroMap, uniqueHeroIds]);

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
        powerGrade: item.powerGrade,
        talentLevel: item.talentLevel,
        slug: hero?.slug ?? String(item.heroId),
        name: hero?.name ?? `Hero #${item.heroId}`,
        rarityStars: hero?.rarityStars ?? 0,
        createdAt: item.createdAt,
        previewUrl: hero?.previewUrl ?? hero?.imageUrl ?? null,
        elementName: hero?.elementName ?? null,
        isCostume: hero?.isCostume === true,
        costumeIndex: hero?.costumeIndex ?? null,
      };
    });
  }, [profileHeroes, rosterHeroMap]);

  const sortedRosterCards = useMemo<RosterHeroCard[]>(() => {
    const sorted = [...rosterCards];

    sorted.sort((left, right) => {
      let result = 0;

      if (heroSortField === 'name') {
        result = left.name.localeCompare(right.name, heroLocale === 'RU' ? 'ru' : 'en', {
          sensitivity: 'base',
        });
      } else if (heroSortField === 'rarity') {
        result = left.rarityStars - right.rarityStars;
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
  }, [heroLocale, heroSortField, heroSortOrder, rosterCards]);

  const rosterHeroCardMap = useMemo(() => {
    return new Map(sortedRosterCards.map((hero) => [hero.profileHeroId, hero]));
  }, [sortedRosterCards]);
  const powerGradeOptions = useMemo(() => buildPowerGradeOptions(heroLocale), [heroLocale]);

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

    return sortedRosterCards.filter(
      (hero) => hero.profileHeroId === selectedSlotHeroId || !usedWarHeroIds.has(hero.profileHeroId),
    );
  }, [sortedRosterCards, usedWarHeroIds, warSlotPicker, warTeams]);

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
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                {messages.profile.heroesTitle}
              </h2>

              <div className="flex flex-col gap-2 sm:flex-row">
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
                    powerGrade={hero.powerGrade}
                    talentLevel={hero.talentLevel}
                    isCostume={hero.isCostume}
                    costumeIndex={hero.costumeIndex}
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
                  {messages.profile.heroesEmpty}
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
          ) : sortedRosterCards.length === 0 ? (
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

                          <div className="mt-3">
                            <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-[var(--foreground)]">
                              {hero.name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--foreground-soft)]">
                              <span>{hero.rarityStars}*</span>
                              {hero.isCostume ? (
                                <span className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-cyan-300">
                                  {`C${hero.costumeIndex ?? '?'}`}
                                </span>
                              ) : null}
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
                            {hero.isCostume ? (
                              <span className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-cyan-300">
                                {`C${hero.costumeIndex ?? '?'}`}
                              </span>
                            ) : null}
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
