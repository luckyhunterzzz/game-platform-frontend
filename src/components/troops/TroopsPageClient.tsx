'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Navbar } from '@/components/Navbar';
import DictionaryModal from '@/components/heroes/admin/DictionaryModal';
import HeroInfoPopover from '@/components/heroes/admin/HeroInfoPopover';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  buildEpicTroopEntries,
  buildLegendaryTroopEntries,
  HERO_STAR_ASSET,
  TROOP_BONUS_SUMMARIES,
  TROOP_CLASS_ICON_BY_KEY,
  TROOP_CLASS_LABELS,
  TROOP_ELEMENT_ICON_BY_KEY,
  TROOP_ELEMENT_LABELS,
  TROOP_ENHANCEMENT_CONTENT,
  TROOP_ENHANCEMENT_ICON_BY_KEY,
  TROOP_ENHANCEMENT_LABELS,
  TROOP_SPECIALTY_CONTENT,
  TROOP_SPECIALTY_ICON_BY_KEY,
  TROOP_SPECIALTY_LABELS,
  TROOP_STAT_ICON_BY_KEY,
  TROOP_TIER_LABELS,
  type EpicTroopBonusSummary,
  type HeroClassKey,
  type LegendaryTroopEntry,
  type TroopBonusSummary,
  type TroopElementKey,
  type TroopEnhancementKey,
  type TroopEntry,
  type TroopSpecialtyKey,
  type TroopStatKey,
  type TroopTierKey,
} from '@/lib/static/troops';

type QuickLinkItem = {
  label: string;
  href: string;
  imageSrc: string;
  authHint?: string;
};

type FilterOption<T extends string> = {
  value: T | 'ALL';
  label: string;
  iconUrl?: string;
};

function useNearViewport<T extends HTMLElement>(rootMargin = '320px') {
  const ref = useRef<T | null>(null);
  const [hasIntersected, setHasIntersected] = useState(false);
  const supportsIntersectionObserver = typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'undefined';
  const isNearViewport = hasIntersected || !supportsIntersectionObserver;

  useEffect(() => {
    if (isNearViewport) {
      return;
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setHasIntersected(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isNearViewport, rootMargin]);

  return { ref, isNearViewport };
}

function getTroopElementFrameClass(elementKey: TroopElementKey): string {
  switch (elementKey) {
    case 'fire':
      return 'border-red-400/45 shadow-[0_0_0_1px_rgba(248,113,113,0.18)]';
    case 'ice':
      return 'border-sky-400/45 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]';
    case 'nature':
      return 'border-emerald-400/45 shadow-[0_0_0_1px_rgba(52,211,153,0.18)]';
    case 'dark':
      return 'border-fuchsia-400/45 shadow-[0_0_0_1px_rgba(232,121,249,0.18)]';
    case 'holy':
      return 'border-amber-300/55 shadow-[0_0_0_1px_rgba(252,211,77,0.2)]';
    default:
      return 'border-[var(--border)]';
  }
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 text-[var(--foreground-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | 'ALL';
  options: FilterOption<T>[];
  onChange: (value: T | 'ALL') => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedOption.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedOption.iconUrl} alt="" className="h-6 w-6 shrink-0 object-contain" />
          ) : null}
          <span className="truncate">{selectedOption.label}</span>
        </span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 shadow-2xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                option.value === value
                  ? 'bg-cyan-400/12 text-cyan-200'
                  : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {option.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={option.iconUrl} alt="" className="h-6 w-6 shrink-0 object-contain" />
              ) : (
                <span className="inline-flex h-6 w-6 shrink-0 rounded-md border border-dashed border-[var(--border)]" />
              )}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TroopBonusStatCard({
  iconUrl,
  label,
  value,
}: {
  iconUrl: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 text-center sm:rounded-2xl sm:p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconUrl} alt={label} className="mx-auto h-7 w-7 object-contain sm:h-10 sm:w-10" />
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[var(--foreground-muted)] sm:mt-2 sm:text-xs">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-[var(--foreground)] sm:mt-1 sm:text-base">{value}</div>
    </div>
  );
}

function getLegendaryTroopTooltipContent(troop: LegendaryTroopEntry, locale: 'ru' | 'en') {
  const content = TROOP_SPECIALTY_CONTENT[troop.specialty];
  return `${locale === 'ru' ? content.titleRu : content.titleEn}\n\n${locale === 'ru' ? content.descriptionRu : content.descriptionEn}`;
}

function getEpicConversionTooltipContent(locale: 'ru' | 'en') {
  if (locale === 'ru') {
    return 'Преобразование эпических отрядов\n\nЭпический отряд можно преобразовать в этот легендарный отряд.';
  }

  return 'Epic troop conversion\n\nThe epic troop can be converted to this Legendary troop in the Barracks';
}

function getEpicStatOrder(summary: EpicTroopBonusSummary): TroopStatKey[] {
  const preferredOrder: TroopStatKey[] = ['attack', 'defense', 'health', 'healing', 'mana', 'critical', 'bypass'];
  return preferredOrder.filter((key) => summary[key] != null);
}

function getStatLabel(statKey: TroopStatKey, locale: 'ru' | 'en') {
  const labels: Record<TroopStatKey, { en: string; ru: string }> = {
    attack: { en: 'Attack', ru: 'Атака' },
    defense: { en: 'Defense', ru: 'Защита' },
    health: { en: 'Health', ru: 'Здоровье' },
    mana: { en: 'Mana', ru: 'Мана' },
    healing: { en: 'Healing', ru: 'Исцеление' },
    critical: { en: 'Critical', ru: 'Крит' },
    bypass: { en: 'Bypass', ru: 'Байпас' },
  };

  return locale === 'ru' ? labels[statKey].ru : labels[statKey].en;
}

function TroopBonusModal({
  troop,
  locale,
  onClose,
}: {
  troop: TroopEntry;
  locale: 'ru' | 'en';
  onClose: () => void;
}) {
  const title = locale === 'ru' ? troop.nameRu : troop.nameEn;
  const closeLabel = locale === 'ru' ? 'Закрыть' : 'Close';
  const [highlightEnhancements, setHighlightEnhancements] = useState(troop.tier === 'epic');

  useEffect(() => {
    if (troop.tier !== 'epic') {
      return;
    }

    const timeoutId = window.setTimeout(() => setHighlightEnhancements(false), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [troop.tier]);

  if (troop.tier === 'legendary') {
    const summary: TroopBonusSummary | undefined = TROOP_BONUS_SUMMARIES[troop.key];

    if (!summary) {
      return (
        <DictionaryModal open={true} title={title} closeLabel={closeLabel} onClose={onClose}>
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
            {locale === 'ru' ? 'Бонусы этого отряда будут добавлены позже.' : 'Troop bonuses will be added later.'}
          </div>
        </DictionaryModal>
      );
    }

    return (
      <DictionaryModal open={true} title={title} closeLabel={closeLabel} onClose={onClose}>
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              {locale === 'ru' ? 'Базовый бонус' : 'Base bonus'}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={getStatLabel('attack', locale)} value={summary.attack} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={getStatLabel('defense', locale)} value={summary.defense} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={getStatLabel('health', locale)} value={summary.health} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.mana} label={getStatLabel('mana', locale)} value={summary.mana} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              {locale === 'ru' ? 'Доп. бонус для классов' : 'Extra class bonus'}
            </div>
            <div className="flex items-center justify-center gap-3">
              {troop.classes.map((classKey) => (
                <div
                  key={`${troop.key}-bonus-${classKey}`}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TROOP_CLASS_ICON_BY_KEY[classKey]}
                    alt={locale === 'ru' ? TROOP_CLASS_LABELS[classKey].ru : TROOP_CLASS_LABELS[classKey].en}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={getStatLabel('attack', locale)} value={summary.classAttackBonus} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={getStatLabel('defense', locale)} value={summary.classDefenseBonus} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={getStatLabel('health', locale)} value={summary.classHealthBonus} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              {locale === 'ru' ? 'Суммарный бонус' : 'Total bonus'}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={getStatLabel('attack', locale)} value={summary.totalAttack} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={getStatLabel('defense', locale)} value={summary.totalDefense} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={getStatLabel('health', locale)} value={summary.totalHealth} />
              <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.mana} label={getStatLabel('mana', locale)} value={summary.totalMana} />
            </div>
          </div>
        </div>
      </DictionaryModal>
    );
  }

  const statOrder = getEpicStatOrder(troop.summary);

  return (
    <DictionaryModal open={true} title={title} closeLabel={closeLabel} onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            {locale === 'ru' ? 'Усиления' : 'Enhancements'}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {troop.enhancements.map((enhancementKey) => {
              const label =
                locale === 'ru'
                  ? TROOP_ENHANCEMENT_LABELS[enhancementKey].ru
                  : TROOP_ENHANCEMENT_LABELS[enhancementKey].en;
              const content = TROOP_ENHANCEMENT_CONTENT[enhancementKey];
              const tooltipContent = `${locale === 'ru' ? content.titleRu : content.titleEn}\n\n${locale === 'ru' ? content.descriptionRu : content.descriptionEn}`;

              return (
                <HeroInfoPopover
                  key={`${troop.key}-${enhancementKey}`}
                  label={label}
                  content={tooltipContent}
                  trigger={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={TROOP_STAT_ICON_BY_KEY[enhancementKey]} alt={label} className="h-full w-full object-contain" />
                  }
                  triggerClassName={`flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 transition hover:bg-[var(--surface-hover)] ${
                    highlightEnhancements ? 'animate-pulse shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_22px_rgba(34,211,238,0.22)]' : ''
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="text-sm text-[var(--foreground-soft)]">
          {locale === 'ru' ? 'Бонусы эпического отряда' : 'Epic troop bonuses'}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statOrder.map((statKey) => (
            <TroopBonusStatCard
              key={`${troop.key}-${statKey}`}
              iconUrl={TROOP_STAT_ICON_BY_KEY[statKey]}
              label={getStatLabel(statKey, locale)}
              value={troop.summary[statKey] ?? ''}
            />
          ))}
        </div>
      </div>
    </DictionaryModal>
  );
}

function TroopPreviewCard({
  troop,
  locale,
  onOpenBonus,
}: {
  troop: TroopEntry;
  locale: 'ru' | 'en';
  onOpenBonus: (troop: TroopEntry) => void;
}) {
  const { ref, isNearViewport } = useNearViewport<HTMLElement>();
  const troopTitle = locale === 'ru' ? troop.nameRu : troop.nameEn;
  const frameClass = getTroopElementFrameClass(troop.elementKey);
  const topRightLabel =
    troop.tier === 'legendary'
      ? locale === 'ru'
        ? TROOP_SPECIALTY_LABELS[troop.specialty].ru
        : TROOP_SPECIALTY_LABELS[troop.specialty].en
      : '';

  return (
    <article
      ref={ref}
      className={`rounded-xl border bg-[var(--surface-strong)] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.14)] ${frameClass}`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-[var(--surface)] ${frameClass}`}
        title={troopTitle}
        aria-label={troopTitle}
      >
        <button
          type="button"
          onClick={() => onOpenBonus(troop)}
          className="block w-full"
          aria-label={locale === 'ru' ? `Открыть бонусы ${troopTitle}` : `Open ${troopTitle} bonuses`}
        >
          {isNearViewport ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={troop.imageUrl}
                alt={troopTitle}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full scale-[0.58] object-contain"
              />
            </>
          ) : (
            <div className="aspect-square w-full" aria-hidden="true" />
          )}
        </button>

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-1.5">
          {troop.tier === 'legendary' ? (
            <div className="flex flex-col gap-1">
              {troop.classes.map((classKey) => (
                <div
                  key={`${troop.key}-${troop.elementKey}-${classKey}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-slate-950/78 p-1 shadow-lg"
                >
                  {isNearViewport ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={TROOP_CLASS_ICON_BY_KEY[classKey]}
                        alt={locale === 'ru' ? TROOP_CLASS_LABELS[classKey].ru : TROOP_CLASS_LABELS[classKey].en}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div />
          )}

          {troop.tier === 'legendary' ? (
            <div className="flex flex-col items-end gap-1">
              <HeroInfoPopover
                label={topRightLabel}
                content={getLegendaryTroopTooltipContent(troop, locale)}
                trigger={
                  isNearViewport ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={troop.specialtyImageUrl}
                        alt={topRightLabel}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    </>
                  ) : (
                    <span className="block h-full w-full" aria-hidden="true" />
                  )
                }
                triggerClassName="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-slate-950/78 p-1 shadow-lg transition hover:bg-slate-900/88"
              />
              {troop.hasEpicConversion ? (
                <HeroInfoPopover
                  label={locale === 'ru' ? 'Преобразование эпических отрядов' : 'Epic troop conversion'}
                  content={getEpicConversionTooltipContent(locale)}
                  trigger={
                    isNearViewport ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={troop.epicConversionImageUrl}
                          alt={locale === 'ru' ? 'Преобразование эпических отрядов' : 'Epic troop conversion'}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain"
                        />
                      </>
                    ) : (
                      <span className="block h-full w-full" aria-hidden="true" />
                    )
                  }
                  triggerClassName="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-slate-950/78 p-1 shadow-lg transition hover:bg-slate-900/88"
                />
              ) : null}
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-1.5">
          <div className="flex items-center gap-0.5 rounded-lg border border-white/15 bg-slate-950/78 px-1.5 py-0.5 shadow-lg">
            {Array.from({ length: troop.stars }).map((_, index) => (
              isNearViewport ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${troop.key}-${troop.elementKey}-star-${index}`}
                  src={HERO_STAR_ASSET}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-3 w-3 object-contain"
                />
              ) : (
                <span
                  key={`${troop.key}-${troop.elementKey}-star-placeholder-${index}`}
                  className="block h-3 w-3"
                  aria-hidden="true"
                />
              )
            ))}
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-slate-950/78 p-1 shadow-lg">
            {isNearViewport ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={troop.elementImageUrl}
                  alt={locale === 'ru' ? TROOP_ELEMENT_LABELS[troop.elementKey].ru : TROOP_ELEMENT_LABELS[troop.elementKey].en}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1 text-xs font-semibold leading-tight text-[var(--foreground)] sm:text-[13px]">{troopTitle}</div>
        <button
          type="button"
          onClick={() => onOpenBonus(troop)}
          className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[10px] font-semibold text-cyan-200 transition hover:bg-cyan-400/15 sm:h-5 sm:w-5 sm:text-[11px]"
          aria-label={locale === 'ru' ? `Бонусы отряда ${troopTitle}` : `Troop bonuses for ${troopTitle}`}
        >
          ?
        </button>
      </div>
    </article>
  );
}

export default function TroopsPageClient() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TroopTierKey>('legendary');
  const [selectedElement, setSelectedElement] = useState<TroopElementKey | 'ALL'>('ALL');
  const [selectedClass, setSelectedClass] = useState<HeroClassKey | 'ALL'>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<TroopSpecialtyKey | 'ALL'>('ALL');
  const [selectedEnhancement, setSelectedEnhancement] = useState<TroopEnhancementKey | 'ALL'>('ALL');
  const [selectedTroopBonus, setSelectedTroopBonus] = useState<TroopEntry | null>(null);

  const { authenticated } = useAuth();
  const { locale, messages } = useI18n();

  const quickLinks = useMemo<QuickLinkItem[]>(
    () => [
      { label: messages.home.navHeroes, href: '/heroes', imageSrc: '/home-quick-links/heroes.png' },
      { label: messages.home.navHeroCoach, href: '/hero-coach', imageSrc: '/heroes/activity-icons/hero-coach.png' },
      { label: messages.home.navOutfitter, href: '/outfitter', imageSrc: '/heroes/activity-icons/visiting-outfitter.png' },
      { label: locale === 'ru' ? 'Отряды' : 'Troops', href: '/troops', imageSrc: '/heroes/troops/legendary/red_legendary_master_assassin.webp' },
      { label: locale === 'ru' ? 'События' : 'Events', href: '/events', imageSrc: '/home-quick-links/events.png' },
      { label: locale === 'ru' ? 'Сундуки' : 'Chests', href: '/chests', imageSrc: '/home-quick-links/guides.png' },
      { label: locale === 'ru' ? 'Альянсы' : 'Alliances', href: '/alliance', imageSrc: '/home-quick-links/alliances.png' },
      {
        label: messages.home.navJointPurchases,
        href: '/joint-purchases',
        imageSrc: '/home-quick-links/joint-purchases.webp',
        authHint: authenticated ? undefined : messages.home.navJointPurchasesAuthHint,
      },
    ],
    [
      authenticated,
      locale,
      messages.home.navHeroes,
      messages.home.navHeroCoach,
      messages.home.navOutfitter,
      messages.home.navJointPurchases,
      messages.home.navJointPurchasesAuthHint,
    ],
  );

  const orderedQuickLinks = useMemo(() => {
    const order = [
      messages.home.navHeroes,
      locale === 'ru' ? 'Отряды' : 'Troops',
      locale === 'ru' ? 'Сундуки' : 'Chests',
      locale === 'ru' ? 'События' : 'Events',
      messages.home.navHeroCoach,
      messages.home.navOutfitter,
      locale === 'ru' ? 'Альянсы' : 'Alliances',
      messages.home.navJointPurchases,
    ];

    return [...quickLinks].sort((left, right) => order.indexOf(left.label) - order.indexOf(right.label));
  }, [locale, messages.home.navHeroes, messages.home.navHeroCoach, messages.home.navOutfitter, messages.home.navJointPurchases, quickLinks]);

  const legendaryTroops = useMemo(() => buildLegendaryTroopEntries(), []);
  const epicTroops = useMemo(() => buildEpicTroopEntries(), []);

  const visibleTroops = useMemo(() => {
    if (selectedTier === 'legendary') {
      return legendaryTroops.filter((troop) => {
        if (selectedElement !== 'ALL' && troop.elementKey !== selectedElement) {
          return false;
        }
        if (selectedClass !== 'ALL' && !troop.classes.includes(selectedClass)) {
          return false;
        }
        if (selectedSpecialty !== 'ALL' && troop.specialty !== selectedSpecialty) {
          return false;
        }
        return true;
      });
    }

    return epicTroops.filter((troop) => {
      if (selectedElement !== 'ALL' && troop.elementKey !== selectedElement) {
        return false;
      }
      if (selectedEnhancement !== 'ALL' && !troop.enhancements.includes(selectedEnhancement)) {
        return false;
      }
      return true;
    });
  }, [epicTroops, legendaryTroops, selectedClass, selectedElement, selectedEnhancement, selectedSpecialty, selectedTier]);

  const elementOptions = useMemo<FilterOption<TroopElementKey>[]>(
    () => [
      { value: 'ALL', label: locale === 'ru' ? 'Все стихии' : 'All elements' },
      ...(Object.keys(TROOP_ELEMENT_LABELS) as TroopElementKey[]).map((elementKey) => ({
        value: elementKey,
        label: locale === 'ru' ? TROOP_ELEMENT_LABELS[elementKey].ru : TROOP_ELEMENT_LABELS[elementKey].en,
        iconUrl: TROOP_ELEMENT_ICON_BY_KEY[elementKey],
      })),
    ],
    [locale],
  );

  const classOptions = useMemo<FilterOption<HeroClassKey>[]>(
    () => [
      { value: 'ALL', label: locale === 'ru' ? 'Все классы' : 'All classes' },
      ...(Object.keys(TROOP_CLASS_LABELS) as HeroClassKey[]).map((classKey) => ({
        value: classKey,
        label: locale === 'ru' ? TROOP_CLASS_LABELS[classKey].ru : TROOP_CLASS_LABELS[classKey].en,
        iconUrl: TROOP_CLASS_ICON_BY_KEY[classKey],
      })),
    ],
    [locale],
  );

  const specialtyOptions = useMemo<FilterOption<TroopSpecialtyKey>[]>(
    () => [
      { value: 'ALL', label: locale === 'ru' ? 'Все усиления' : 'All enhancements' },
      ...(Object.keys(TROOP_SPECIALTY_LABELS) as TroopSpecialtyKey[]).map((specialtyKey) => ({
        value: specialtyKey,
        label: locale === 'ru' ? TROOP_SPECIALTY_LABELS[specialtyKey].ru : TROOP_SPECIALTY_LABELS[specialtyKey].en,
        iconUrl: TROOP_SPECIALTY_ICON_BY_KEY[specialtyKey],
      })),
    ],
    [locale],
  );

  const enhancementOptions = useMemo<FilterOption<TroopEnhancementKey>[]>(
    () => [
      { value: 'ALL', label: locale === 'ru' ? 'Все усиления' : 'All enhancements' },
      ...(Object.keys(TROOP_ENHANCEMENT_LABELS) as TroopEnhancementKey[]).map((enhancementKey) => ({
        value: enhancementKey,
        label: locale === 'ru' ? TROOP_ENHANCEMENT_LABELS[enhancementKey].ru : TROOP_ENHANCEMENT_LABELS[enhancementKey].en,
        iconUrl: TROOP_ENHANCEMENT_ICON_BY_KEY[enhancementKey],
      })),
    ],
    [locale],
  );

  const pageTitle = locale === 'ru' ? 'Отряды' : 'Troops';
  const pageSubtitle =
    selectedTier === 'legendary'
      ? locale === 'ru'
        ? 'Все легендарные отряды в одном месте. Фильтруйте по стихии, классу и усилению.'
        : 'All legendary troops in one place. Filter by element, class and enhancement.'
      : locale === 'ru'
        ? 'Все эпические отряды в одном месте. Фильтруйте по стихии и усилению.'
        : 'All epic troops in one place. Filter by element and enhancement.';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 border-r border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-xl font-bold text-cyan-400">{messages.home.menuTitle}</h2>

            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageOne}
                </Link>
              </li>
              <li>
                <Link
                  href="/heroes"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.menuPageTwo}
                </Link>
              </li>
              <li>
                <Link
                  href="/hero-coach"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.navHeroCoach}
                </Link>
              </li>
              <li>
                <Link
                  href="/outfitter"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {messages.home.navOutfitter}
                </Link>
              </li>
              <li>
                <Link
                  href="/troops"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  {locale === 'ru' ? 'Отряды' : 'Troops'}
                </Link>
              </li>
              <li>
                <Link
                  href="/joint-purchases"
                  onClick={() => setSidebarOpen(false)}
                  className="block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                >
                  <span className="block">{messages.home.navJointPurchases}</span>
                  {!authenticated ? (
                    <span className="mt-1 block text-xs text-[var(--foreground-soft)]">
                      {messages.home.navJointPurchasesAuthHint}
                    </span>
                  ) : null}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex-1 bg-black/40 backdrop-blur-[1px]" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {orderedQuickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex w-20 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-lg transition-all hover:border-blue-500/40 hover:bg-[var(--surface-hover)] sm:w-32 sm:p-4"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition-transform group-hover:scale-105 sm:mb-3 sm:h-16 sm:w-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageSrc} alt={item.label} className="h-9 w-9 object-contain sm:h-12 sm:w-12" />
              </div>

              <span className="text-center text-[11px] font-semibold text-[var(--foreground-muted)] transition group-hover:text-blue-300 sm:text-xs">
                {item.label}
              </span>
              {item.authHint ? (
                <span className="mt-1 text-center text-[10px] font-medium text-[var(--foreground-soft)] sm:text-[11px]">
                  {item.authHint}
                </span>
              ) : null}
            </Link>
          ))}
        </div>

        <section className="w-full max-w-7xl">
          <div className="mb-8 rounded-[2rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_42%),linear-gradient(180deg,var(--surface-strong),var(--surface))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.18)] md:p-8">
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">{pageTitle}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)] md:text-base">{pageSubtitle}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {(Object.keys(TROOP_TIER_LABELS) as TroopTierKey[]).map((tierKey) => (
                <button
                  key={tierKey}
                  type="button"
                  onClick={() => {
                    setSelectedTier(tierKey);
                    setSelectedClass('ALL');
                    setSelectedSpecialty('ALL');
                    setSelectedEnhancement('ALL');
                  }}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                    selectedTier === tierKey
                      ? 'border-cyan-300/60 bg-cyan-400/12 text-cyan-100'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {locale === 'ru' ? TROOP_TIER_LABELS[tierKey].ru : TROOP_TIER_LABELS[tierKey].en}
                </button>
              ))}
            </div>
          </div>

          <div className={`mb-6 grid grid-cols-1 gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-5 ${selectedTier === 'legendary' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <FilterDropdown
              label={locale === 'ru' ? 'Стихия' : 'Element'}
              value={selectedElement}
              options={elementOptions}
              onChange={setSelectedElement}
            />

            {selectedTier === 'legendary' ? (
              <>
                <FilterDropdown
                  label={locale === 'ru' ? 'Класс' : 'Class'}
                  value={selectedClass}
                  options={classOptions}
                  onChange={setSelectedClass}
                />
                <FilterDropdown
                  label={locale === 'ru' ? 'Усиление' : 'Enhancement'}
                  value={selectedSpecialty}
                  options={specialtyOptions}
                  onChange={setSelectedSpecialty}
                />
              </>
            ) : (
              <FilterDropdown
                label={locale === 'ru' ? 'Усиление' : 'Enhancement'}
                value={selectedEnhancement}
                options={enhancementOptions}
                onChange={setSelectedEnhancement}
              />
            )}
          </div>

          <div className="mb-4 text-sm text-[var(--foreground-soft)]">
            {locale === 'ru' ? `Найдено отрядов: ${visibleTroops.length}` : `Troops found: ${visibleTroops.length}`}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visibleTroops.map((troop) => (
              <TroopPreviewCard
                key={`${troop.tier}-${troop.elementKey}-${troop.key}`}
                troop={troop}
                locale={locale}
                onOpenBonus={setSelectedTroopBonus}
              />
            ))}
          </div>
        </section>
      </main>

      {selectedTroopBonus ? (
        <TroopBonusModal
          key={`${selectedTroopBonus.tier}-${selectedTroopBonus.elementKey}-${selectedTroopBonus.key}`}
          troop={selectedTroopBonus}
          locale={locale}
          onClose={() => setSelectedTroopBonus(null)}
        />
      ) : null}
    </div>
  );
}

