'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Navbar } from '@/components/Navbar';
import DictionaryModal from '@/components/heroes/admin/DictionaryModal';
import HeroInfoPopover from '@/components/heroes/admin/HeroInfoPopover';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import {
  buildTroopEntries,
  HERO_STAR_ASSET,
  TROOP_BONUS_SUMMARIES,
  TROOP_CLASS_ICON_BY_KEY,
  TROOP_CLASS_LABELS,
  TROOP_ELEMENT_ICON_BY_KEY,
  TROOP_ELEMENT_LABELS,
  TROOP_SPECIALTY_CONTENT,
  TROOP_SPECIALTY_ICON_BY_KEY,
  TROOP_SPECIALTY_LABELS,
  TROOP_STAT_ICON_BY_KEY,
  type HeroClassKey,
  type TroopBonusSummary,
  type TroopElementKey,
  type TroopEntry,
  type TroopSpecialtyKey,
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconUrl} alt={label} className="mx-auto h-10 w-10 object-contain" />
      <div className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">{label}</div>
      <div className="mt-1 text-base font-bold text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function buildTroopSpecialtyTooltip(troop: TroopEntry, locale: 'ru' | 'en') {
  const content = TROOP_SPECIALTY_CONTENT[troop.specialty];
  const title = locale === 'ru' ? content.titleRu : content.titleEn;
  const description = locale === 'ru' ? content.descriptionRu : content.descriptionEn;
  return `${title}\n\n${description}`;
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
  const summary: TroopBonusSummary | undefined = TROOP_BONUS_SUMMARIES[troop.key];
  const title = locale === 'ru' ? troop.nameRu : troop.nameEn;
  const closeLabel = locale === 'ru' ? 'Закрыть' : 'Close';

  if (!summary) {
    return (
      <DictionaryModal open={true} title={title} closeLabel={closeLabel} onClose={onClose}>
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
          {locale === 'ru' ? 'Бонусы этого отряда будут добавлены позже.' : 'Troop bonuses will be added later.'}
        </div>
      </DictionaryModal>
    );
  }

  const attackLabel = locale === 'ru' ? 'Атака' : 'Attack';
  const defenseLabel = locale === 'ru' ? 'Защита' : 'Defense';
  const healthLabel = locale === 'ru' ? 'Здоровье' : 'Health';
  const manaLabel = locale === 'ru' ? 'Мана' : 'Mana';

  return (
    <DictionaryModal open={true} title={title} closeLabel={closeLabel} onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            {locale === 'ru' ? 'Базовый бонус' : 'Base bonus'}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={attackLabel} value={summary.attack} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={defenseLabel} value={summary.defense} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={healthLabel} value={summary.health} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.mana} label={manaLabel} value={summary.mana} />
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={attackLabel} value={summary.classAttackBonus} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={defenseLabel} value={summary.classDefenseBonus} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={healthLabel} value={summary.classHealthBonus} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            {locale === 'ru' ? 'Суммарный бонус' : 'Total bonus'}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={attackLabel} value={summary.totalAttack} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={defenseLabel} value={summary.totalDefense} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={healthLabel} value={summary.totalHealth} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.mana} label={manaLabel} value={summary.totalMana} />
          </div>
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
  const troopTitle = locale === 'ru' ? troop.nameRu : troop.nameEn;
  const specialtyLabel = locale === 'ru' ? TROOP_SPECIALTY_LABELS[troop.specialty].ru : TROOP_SPECIALTY_LABELS[troop.specialty].en;

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]" title={troopTitle} aria-label={troopTitle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={troop.imageUrl} alt={troopTitle} className="aspect-square w-full scale-[0.72] object-contain" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-2">
          <div className="flex flex-col gap-1">
            {troop.classes.map((classKey) => (
              <div
                key={`${troop.key}-${troop.elementKey}-${classKey}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-950/78 p-1 shadow-lg"
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

          <HeroInfoPopover
            label={specialtyLabel}
            content={buildTroopSpecialtyTooltip(troop, locale)}
            trigger={
              // eslint-disable-next-line @next/next/no-img-element
              <img src={troop.specialtyImageUrl} alt={specialtyLabel} className="h-full w-full object-contain" />
            }
            triggerClassName="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/78 p-1.5 shadow-lg transition hover:bg-slate-900/88"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-slate-950/78 px-2 py-1 shadow-lg">
            {Array.from({ length: 5 }).map((_, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${troop.key}-${troop.elementKey}-star-${index}`} src={HERO_STAR_ASSET} alt="" className="h-3.5 w-3.5 object-contain" />
            ))}
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/78 p-1 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={troop.elementImageUrl}
              alt={locale === 'ru' ? TROOP_ELEMENT_LABELS[troop.elementKey].ru : TROOP_ELEMENT_LABELS[troop.elementKey].en}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1 text-sm font-semibold leading-tight text-[var(--foreground)]">{troopTitle}</div>
        <button
          type="button"
          onClick={() => onOpenBonus(troop)}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
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
  const [selectedElement, setSelectedElement] = useState<TroopElementKey | 'ALL'>('ALL');
  const [selectedClass, setSelectedClass] = useState<HeroClassKey | 'ALL'>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<TroopSpecialtyKey | 'ALL'>('ALL');
  const [selectedTroopBonus, setSelectedTroopBonus] = useState<TroopEntry | null>(null);

  const { authenticated } = useAuth();
  const { locale, messages } = useI18n();

  const quickLinks = useMemo<QuickLinkItem[]>(
    () => [
      { label: messages.home.navHeroes, href: '/heroes', imageSrc: '/home-quick-links/heroes.png' },
      { label: locale === 'ru' ? 'Отряды' : 'Troops', href: '/troops', imageSrc: '/heroes/troops/red_legendary_master_assassin.webp' },
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
      messages.home.navJointPurchases,
      messages.home.navJointPurchasesAuthHint,
    ],
  );

  const troops = useMemo(() => buildTroopEntries(), []);
  const filteredTroops = useMemo(() => {
    return troops.filter((troop) => {
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
  }, [selectedClass, selectedElement, selectedSpecialty, troops]);

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

  const pageTitle = locale === 'ru' ? 'Отряды' : 'Troops';
  const pageSubtitle =
    locale === 'ru'
      ? 'Все легендарные отряды в одном месте. Фильтруйте по стихии, классу и усилению.'
      : 'All legendary troops in one place. Filter by element, class and enhancement.';

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
          {quickLinks.map((item) => (
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
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-3 md:p-5">
            <FilterDropdown
              label={locale === 'ru' ? 'Стихия' : 'Element'}
              value={selectedElement}
              options={elementOptions}
              onChange={setSelectedElement}
            />
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
          </div>

          <div className="mb-4 text-sm text-[var(--foreground-soft)]">
            {locale === 'ru' ? `Найдено отрядов: ${filteredTroops.length}` : `Troops found: ${filteredTroops.length}`}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredTroops.map((troop) => (
              <TroopPreviewCard key={`${troop.elementKey}-${troop.key}`} troop={troop} locale={locale} onOpenBonus={setSelectedTroopBonus} />
            ))}
          </div>
        </section>
      </main>

      {selectedTroopBonus ? (
        <TroopBonusModal troop={selectedTroopBonus} locale={locale} onClose={() => setSelectedTroopBonus(null)} />
      ) : null}
    </div>
  );
}
