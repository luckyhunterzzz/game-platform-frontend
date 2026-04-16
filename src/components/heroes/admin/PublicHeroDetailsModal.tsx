'use client';

import { useMemo, useState } from 'react';

import DictionaryModal from './DictionaryModal';
import DictionaryInlineValue from '../DictionaryInlineValue';
import DictionaryMiniIcon from '../DictionaryMiniIcon';
import HeroInfoPopover from './HeroInfoPopover';
import HeroStatCalculatorPanel from './HeroStatCalculatorPanel';

export type PublicHeroCardItem = {
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
};

export type PublicHeroDetailsItem = {
  id: number;
  slug: string;
  name: string;
  element?: { id: number; name: string; imageUrl?: string | null } | null;
  rarity?: { id: number; stars: number; imageUrl?: string | null } | null;
  heroClass?: {
    id: number;
    name: string;
    imageUrl?: string | null;
    baseName?: string | null;
    baseDescription?: string | null;
    masterName?: string | null;
    masterDescription?: string | null;
  } | null;
  family?: { id: number; name: string; description?: string | null; imageUrl?: string | null } | null;
  manaSpeed?: { id: number; name: string; description?: string | null } | null;
  alphaTalent?: { id: number; name: string; description?: string | null; imageUrl?: string | null } | null;
  specialSkill?: { name: string; description: string } | null;
  passiveSkills: Array<{
    id: number;
    name: string;
    description: string;
    imageUrl?: string | null;
  }>;
  costumes: Array<{
    id: number;
    slug: string;
    name: string;
    costumeIndex?: number | null;
    bonus?: {
      attack?: number | null;
      armor?: number | null;
      hp?: number | null;
      mana?: number | null;
    } | null;
  }>;
  baseHeroId?: number | null;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  costumeBonusJson?: {
    attack?: number | null;
    armor?: number | null;
    hp?: number | null;
    mana?: number | null;
  } | null;
  imageUrl?: string | null;
  previewUrl?: string | null;
  releaseDate?: string | null;
};

export type PublicHeroVariantSummaryItem = {
  id: number;
  slug: string;
  name: string;
  costumeIndex?: number | null;
  imageUrl?: string | null;
  previewUrl?: string | null;
  elementName?: string | null;
  rarityName?: string | null;
  rarityStars?: number | null;
};

export type PublicHeroVariantsItem = {
  currentHero: PublicHeroDetailsItem;
  baseHero: PublicHeroVariantSummaryItem;
  costumes: PublicHeroVariantSummaryItem[];
};

type PublicHeroDetailsModalProps = {
  open: boolean;
  locale: 'RU' | 'EN';
  heroCard: PublicHeroCardItem | null;
  heroDetails: PublicHeroDetailsItem | null;
  heroVariants?: PublicHeroVariantsItem | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onOpenRelatedHero?: (slug: string) => void;
};

function formatDate(value: string | null | undefined, locale: 'RU' | 'EN', fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'RU' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function relationName(value: string | null | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

function getPreviewAccentClass(elementName: string | null | undefined) {
  const normalized = (elementName ?? '').trim().toLocaleLowerCase();

  if (normalized.includes('ice') || normalized.includes('лед') || normalized.includes('лёд')) {
    return 'border-sky-300/60 bg-sky-400/12 shadow-[0_0_28px_rgba(56,189,248,0.32)]';
  }

  if (normalized.includes('fire') || normalized.includes('огонь')) {
    return 'border-rose-300/60 bg-rose-400/12 shadow-[0_0_28px_rgba(251,113,133,0.3)]';
  }

  if (normalized.includes('nature') || normalized.includes('природа')) {
    return 'border-emerald-300/60 bg-emerald-400/12 shadow-[0_0_28px_rgba(52,211,153,0.3)]';
  }

  if (normalized.includes('dark') || normalized.includes('тьма')) {
    return 'border-violet-300/60 bg-violet-400/12 shadow-[0_0_28px_rgba(167,139,250,0.3)]';
  }

  if (normalized.includes('holy') || normalized.includes('свят')) {
    return 'border-amber-300/70 bg-amber-300/14 shadow-[0_0_28px_rgba(251,191,36,0.28)]';
  }

  return 'border-[var(--border)] bg-[var(--surface-strong)]';
}

function formatCostumeVariantName(name: string | null | undefined, costumeIndex?: number | null) {
  const resolvedName = relationName(name, '');
  if (!resolvedName) {
    return costumeIndex != null ? `C${costumeIndex}` : '';
  }

  return costumeIndex != null ? `${resolvedName} C${costumeIndex}` : resolvedName;
}

function formatCostumeBonusContent(
  locale: 'RU' | 'EN',
  bonus:
    | {
        attack?: number | null;
        armor?: number | null;
        hp?: number | null;
        mana?: number | null;
      }
    | null
    | undefined,
) {
  if (!bonus) {
    return '';
  }

  const lines =
    locale === 'RU'
      ? [
          `Бонус к атаке: +${bonus.attack ?? 0}%`,
          `Бонус к защите: +${bonus.armor ?? 0}%`,
          `Бонус к здоровью: +${bonus.hp ?? 0}%`,
          `Бонус к мане: +${bonus.mana ?? 0}%`,
        ]
      : [
          `Attack Bonus: +${bonus.attack ?? 0}%`,
          `Defence Bonus: +${bonus.armor ?? 0}%`,
          `Health Bonus: +${bonus.hp ?? 0}%`,
          `Mana Bonus: +${bonus.mana ?? 0}%`,
        ];

  return lines.join('\n');
}

function StackedReferenceRow({
  label,
  value,
  imageUrl,
  tooltipContent,
  imageSize = 40,
  showImage = true,
  chromelessImage = true,
  labelClassName = '',
  valueClassName = '',
  hideValue = false,
}: {
  label: string;
  value: string;
  imageUrl?: string | null;
  tooltipContent?: string | null;
  imageSize?: number;
  showImage?: boolean;
  chromelessImage?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  hideValue?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className={`text-base font-bold text-[var(--foreground)] ${labelClassName}`}>{label}:</div>
      <div className="flex min-w-0 items-center gap-3 text-[var(--foreground)]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showImage ? (
            <DictionaryMiniIcon
              imageUrl={imageUrl}
              label={value}
              size={imageSize}
              chromeless={chromelessImage}
              fallbackToLetter={false}
              className="self-center"
            />
          ) : null}
          {!hideValue ? (
            <span
              className={`min-w-0 whitespace-nowrap text-[clamp(0.82rem,1vw,1rem)] leading-tight ${valueClassName}`}
            >
              {value}
            </span>
          ) : null}
        </div>
        {tooltipContent ? <HeroInfoPopover label={label} content={tooltipContent} /> : null}
      </div>
    </div>
  );
}

function CopyHeroLinkIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none">
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none">
      <rect x="5" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function PublicHeroDetailsModal({
  open,
  locale,
  heroCard,
  heroDetails,
  heroVariants = null,
  loading,
  error,
  onClose,
  onOpenRelatedHero,
}: PublicHeroDetailsModalProps) {
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [copiedHeroLink, setCopiedHeroLink] = useState(false);
  const [expandedSpecialSkillHeroId, setExpandedSpecialSkillHeroId] = useState<number | null>(null);

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            title: 'Просмотр героя',
            close: 'Закрыть',
            loading: 'Загрузка карточки героя...',
            imagePlaceholder: 'Изображение героя добавим позже',
            openImage: 'Открыть изображение полностью',
            closeImage: 'Закрыть просмотр',
            element: 'Элемент',
            rarity: 'Редкость',
            heroClass: 'Класс',
            family: 'Семья',
            manaSpeed: 'Скорость маны',
            alphaTalent: 'Альфа-талант',
            specialSkill: 'Специальный навык',
            passiveSkills: 'Пассивные навыки',
            costumes: 'Костюмы',
            baseHero: 'Базовый герой',
            releaseDate: 'Дата выхода',
            baseStats: 'Базовые статы',
            baseAttack: 'Атака',
            baseArmor: 'Броня',
            baseHp: 'HP',
            computedStats: 'Вычисляемые статы',
            computedStatsHint: 'Здесь позже появится отдельный блок с расчетными статами героя.',
            show: 'Показать',
            hide: 'Скрыть',
            showMore: 'Показать еще',
            showLess: 'Скрыть',
            noValue: 'Не указано',
            noPassiveSkills: 'Пассивные навыки пока не указаны',
            noCostumes: 'Костюмы пока не указаны',
            rarityStars: (stars: number) => `${stars}*`,
            detailsUnavailable: 'Не удалось загрузить детали героя',
          }
        : {
            title: 'Hero details',
            close: 'Close',
            loading: 'Loading hero details...',
            imagePlaceholder: 'Hero image will be added later',
            openImage: 'Open full image',
            closeImage: 'Close preview',
            element: 'Element',
            rarity: 'Rarity',
            heroClass: 'Class',
            family: 'Family',
            manaSpeed: 'Mana speed',
            alphaTalent: 'Alpha talent',
            specialSkill: 'Special skill',
            passiveSkills: 'Passive skills',
            costumes: 'Costumes',
            baseHero: 'Base hero',
            releaseDate: 'Release date',
            baseStats: 'Base stats',
            baseAttack: 'Attack',
            baseArmor: 'Armor',
            baseHp: 'HP',
            computedStats: 'Computed stats',
            computedStatsHint: 'A separate block with calculated hero stats will appear here later.',
            show: 'Show',
            hide: 'Hide',
            showMore: 'Show more',
            showLess: 'Show less',
            noValue: 'Not set',
            noPassiveSkills: 'No passive skills yet',
            noCostumes: 'No costumes yet',
            rarityStars: (stars: number) => `${stars}*`,
            detailsUnavailable: 'Failed to load hero details',
          },
    [locale],
  );

  const releaseDate = heroDetails?.releaseDate ? formatDate(heroDetails.releaseDate, locale, t.noValue) : null;
  const resolvedPreviewUrl = heroDetails?.previewUrl ?? heroCard?.previewUrl ?? heroDetails?.imageUrl ?? heroCard?.imageUrl ?? null;
  const resolvedImageUrl = heroDetails?.imageUrl ?? heroCard?.imageUrl ?? null;
  const imagePreviewSource = resolvedImageUrl ?? resolvedPreviewUrl;
  const currentHeroSlug = heroDetails?.slug ?? heroCard?.slug ?? null;
  const copyHeroLinkLabel =
    locale === 'RU' ? '\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u0433\u0435\u0440\u043e\u044f' : 'Copy hero link';
  const copiedHeroLinkLabel =
    locale === 'RU' ? '\u0421\u0441\u044b\u043b\u043a\u0430 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430' : 'Hero link copied';
  const currentHeroIsCostume =
    heroDetails?.baseHeroId != null && heroVariants?.baseHero.slug !== currentHeroSlug;
  const resolvedRarityStars = heroDetails?.rarity?.stars ?? heroCard?.rarityStars ?? null;
  const resolvedCostumes = heroVariants?.costumes ?? [];
  const specialSkillDescription = heroDetails?.specialSkill?.description?.trim() ?? '';
  const hasLongSpecialSkill = specialSkillDescription.length > 320;
  const resolvedElementName = heroDetails?.element?.name ?? heroCard?.elementName ?? null;
  const previewAccentClass = getPreviewAccentClass(resolvedElementName);
  const heroClassTooltip = [
    heroDetails?.heroClass?.baseName && heroDetails.heroClass.baseDescription
      ? `${heroDetails.heroClass.baseName}: ${heroDetails.heroClass.baseDescription}`
      : null,
    heroDetails?.heroClass?.masterName && heroDetails.heroClass.masterDescription
      ? `${heroDetails.heroClass.masterName}: ${heroDetails.heroClass.masterDescription}`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n');
  const heroLinkTooltip = copiedHeroLink ? copiedHeroLinkLabel : copyHeroLinkLabel;

  const specialSkillExpanded = heroDetails?.id != null && expandedSpecialSkillHeroId === heroDetails.id;

  const handleCopyHeroLink = async () => {
    if (!currentHeroSlug || typeof window === 'undefined') {
      return;
    }

    const url = new URL('/heroes', window.location.origin);
    url.searchParams.set('hero', currentHeroSlug);

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedHeroLink(true);
      window.setTimeout(() => setCopiedHeroLink(false), 1400);
    } catch {
      setCopiedHeroLink(false);
    }
  };

  const modalTitle = (
    <div className="flex min-w-0 items-center gap-3">
      {resolvedPreviewUrl ? (
        <div className={`overflow-hidden rounded-2xl border p-[2px] transition ${previewAccentClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedPreviewUrl}
            alt={heroDetails?.name ?? heroCard?.name ?? 'Hero preview'}
            className="h-12 w-12 rounded-[14px] object-cover"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex flex-1 items-center gap-2">
        <div className="min-w-0 truncate text-[1.35rem] font-bold text-[var(--foreground)] md:text-[1.5rem]">
          {heroDetails?.name ?? heroCard?.name ?? t.title}
        </div>
        {currentHeroSlug ? (
          <div className="relative inline-flex shrink-0">
            {copiedHeroLink ? (
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-md border border-[var(--border)] bg-slate-700/95 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-lg">
                {copiedHeroLinkLabel}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCopyHeroLink()}
              title={heroLinkTooltip}
              aria-label={heroLinkTooltip}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm leading-none transition ${
                copiedHeroLink
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-[var(--success-text)]'
                  : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:border-cyan-400/40 hover:text-cyan-300'
              }`}
            >
              <CopyHeroLinkIcon copied={copiedHeroLink} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderRelatedHeroChip = (
    slug: string,
    name: string,
    key: string | number,
    costumeIndex?: number | null,
  ) => {
    const isCurrent = currentHeroSlug === slug;
    const label = formatCostumeVariantName(name, costumeIndex);

    if (onOpenRelatedHero) {
      return (
        <button
          key={key}
          type="button"
          onClick={() => onOpenRelatedHero(slug)}
          disabled={isCurrent}
          className={`rounded-full border px-3 py-2 text-sm transition ${
            isCurrent
              ? 'cursor-default border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-200'
              : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15'
          }`}
        >
          {label}
        </button>
      );
    }

    return (
      <span
        key={key}
        className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground-soft)]"
      >
        {label}
      </span>
    );
  };

  return (
    <DictionaryModal open={open} title={modalTitle} closeLabel={t.close} onClose={onClose}>
      {loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error || t.detailsUnavailable}
        </div>
      ) : !heroCard || !heroDetails ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
          {t.detailsUnavailable}
        </div>
      ) : (
        <div className="space-y-6 text-[15px] md:text-base">
          <div className="space-y-4 md:flex md:items-start md:gap-4 md:space-y-0">
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] md:w-[360px] md:flex-none">
              {resolvedImageUrl ? (
                <button
                  type="button"
                  onClick={() => setImagePreviewOpen(true)}
                  className="block aspect-[4/5] w-full bg-[var(--surface-strong)] transition hover:bg-[var(--surface)] sm:aspect-[5/6] md:aspect-auto"
                  aria-label={t.openImage}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedImageUrl}
                    alt={heroDetails.name}
                    className="max-h-[75vh] w-full object-contain object-top"
                  />
                </button>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center px-6 text-center text-sm text-[var(--foreground-muted)] sm:aspect-[5/6] md:min-h-[24rem] md:aspect-auto">
                  {t.imagePlaceholder}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <StackedReferenceRow
                    label={t.element}
                    value={heroDetails.element?.name ?? heroCard.elementName ?? t.noValue}
                    imageUrl={heroDetails.element?.imageUrl}
                    imageSize={42}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
                  <div className="space-y-1.5">
                    <div className="text-base font-bold text-[var(--foreground)]">{t.rarity}:</div>
                    <div className="flex min-h-[25px] items-center">
                      {heroDetails.rarity?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={heroDetails.rarity.imageUrl}
                          alt={resolvedRarityStars != null ? t.rarityStars(resolvedRarityStars) : t.noValue}
                          className="h-[25px] w-[180px] max-w-full object-contain object-left"
                        />
                      ) : (
                        <span className="text-base font-semibold text-[var(--foreground)]">
                          {resolvedRarityStars != null ? t.rarityStars(resolvedRarityStars) : t.noValue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <StackedReferenceRow
                    label={t.heroClass}
                    value={heroDetails.heroClass?.name ?? heroCard.heroClassName ?? t.noValue}
                    imageUrl={heroDetails.heroClass?.imageUrl}
                    tooltipContent={heroClassTooltip || null}
                    imageSize={42}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <StackedReferenceRow
                    label={t.manaSpeed}
                    value={heroDetails.manaSpeed?.name ?? heroCard.manaSpeedName ?? t.noValue}
                    tooltipContent={heroDetails.manaSpeed?.description ?? null}
                    showImage={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
              <StackedReferenceRow
                label={t.family}
                value={heroDetails.family?.name ?? heroCard.familyName ?? t.noValue}
                imageUrl={heroDetails.family?.imageUrl}
                tooltipContent={heroDetails.family?.description ?? null}
                imageSize={42}
              />
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
              <StackedReferenceRow
                label={t.alphaTalent}
                value={heroDetails.alphaTalent?.name ?? heroCard.alphaTalentName ?? t.noValue}
                imageUrl={heroDetails.alphaTalent?.imageUrl}
                tooltipContent={heroDetails.alphaTalent?.description ?? null}
                imageSize={42}
              />
            </div>
            {heroDetails.costumeBonusJson ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)] md:col-span-2">
                <div className="flex min-w-0 items-center gap-3">
                  <DictionaryMiniIcon
                    imageUrl="/dictionary-icons/costume.png"
                    label={locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}
                    size={34}
                    chromeless
                    fallbackToLetter={false}
                  />
                  <span className="min-w-0 flex-1 text-base font-bold text-[var(--foreground)]">
                    {locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}
                  </span>
                  <HeroInfoPopover
                    label={locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}
                    content={formatCostumeBonusContent(locale, heroDetails.costumeBonusJson)}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.specialSkill}</div>
            <div className="text-base font-medium text-[var(--foreground)]">
              {heroDetails.specialSkill?.name ?? t.noValue}
            </div>
            <div
              className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-soft)] ${
                hasLongSpecialSkill && !specialSkillExpanded ? 'line-clamp-8 overflow-hidden' : ''
              }`}
            >
              {heroDetails.specialSkill?.description ?? t.noValue}
            </div>
            {hasLongSpecialSkill ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedSpecialSkillHeroId((prev) =>
                    heroDetails?.id == null ? null : prev === heroDetails.id ? null : heroDetails.id,
                  )
                }
                className="mt-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
              >
                {specialSkillExpanded ? t.showLess : t.showMore}
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.passiveSkills}</div>
            {heroDetails.passiveSkills.length === 0 ? (
              <div className="text-sm text-[var(--foreground-soft)]">{t.noPassiveSkills}</div>
            ) : (
              <div className="space-y-3">
                {heroDetails.passiveSkills.map((skill) => (
                  <div key={skill.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                    <div className="flex min-w-0 items-start gap-2 text-sm font-semibold text-[var(--foreground)]">
                      <DictionaryInlineValue
                        label={locale === 'RU' ? 'Навык' : 'Skill'}
                        value={skill.name}
                        imageUrl={skill.imageUrl}
                        chromelessIcon
                        iconSize={34}
                        valueClassName="font-semibold text-[var(--foreground)]"
                      />
                      <HeroInfoPopover label={skill.name} content={skill.description} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.costumes}</div>
                {resolvedCostumes.length === 0 ? (
                  <div className="text-sm text-[var(--foreground-soft)]">{t.noCostumes}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resolvedCostumes.map((costume) =>
                      renderRelatedHeroChip(costume.slug, costume.name, costume.id, costume.costumeIndex),
                    )}
                  </div>
                )}

                {heroVariants?.baseHero && currentHeroIsCostume && (
                  <div className="mt-5 border-t border-[var(--border)] pt-5">
                    <div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.baseHero}</div>
                    {onOpenRelatedHero ? (
                      <button
                        type="button"
                        onClick={() => onOpenRelatedHero(heroVariants.baseHero.slug)}
                        className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-left text-sm text-cyan-200 transition hover:bg-cyan-400/15"
                      >
                        {relationName(heroVariants.baseHero.name, t.noValue)}
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground-soft)]">
                        {relationName(heroVariants.baseHero.name, t.noValue)}
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.baseStats}</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                    {t.baseAttack}: {heroDetails.baseAttack ?? heroCard.baseAttack ?? t.noValue}
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                    {t.baseArmor}: {heroDetails.baseArmor ?? heroCard.baseArmor ?? t.noValue}
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                    {t.baseHp}: {heroDetails.baseHp ?? heroCard.baseHp ?? t.noValue}
                  </div>
                </div>
              </div>

              <HeroStatCalculatorPanel
                locale={locale}
                heroId={heroDetails.id}
                heroSlug={heroDetails.slug}
                calculateEndpoint={`/api/v1/public/heroes/${heroDetails.slug}/stats/calculate?language=${locale}`}
                isCostume={heroDetails.baseHeroId != null}
                currentCostumeIndex={
                  heroDetails.baseHeroId != null
                    ? heroVariants?.costumes.find((item) => item.slug === heroDetails.slug)?.costumeIndex ?? null
                    : null
                }
                baseAttack={heroDetails.baseAttack ?? heroCard.baseAttack ?? null}
                baseArmor={heroDetails.baseArmor ?? heroCard.baseArmor ?? null}
                baseHp={heroDetails.baseHp ?? heroCard.baseHp ?? null}
                costumes={heroDetails.costumes}
              />

              {releaseDate ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--foreground)]">
                  {t.releaseDate}: {releaseDate}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {imagePreviewOpen && imagePreviewSource && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImagePreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setImagePreviewOpen(false)}
            className="absolute right-4 top-4 rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-sm text-white transition hover:bg-black/50"
          >
            {t.closeImage}
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreviewSource}
            alt={heroDetails?.name ?? heroCard?.name ?? 'Hero image'}
            className="max-h-[92vh] max-w-[92vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </DictionaryModal>
  );
}
