'use client';

import { useMemo, useState } from 'react';

import DictionaryModal from './DictionaryModal';
import HeroInfoPopover from './HeroInfoPopover';
import HeroStatCalculatorPanel from './HeroStatCalculatorPanel';

export type PublicHeroCardItem = {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string | null;
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
  element?: { id: number; name: string } | null;
  rarity?: { id: number; stars: number } | null;
  heroClass?: {
    id: number;
    name: string;
    baseName?: string | null;
    baseDescription?: string | null;
    masterName?: string | null;
    masterDescription?: string | null;
  } | null;
  family?: { id: number; name: string; description?: string | null } | null;
  manaSpeed?: { id: number; name: string; description?: string | null } | null;
  alphaTalent?: { id: number; name: string; description?: string | null } | null;
  specialSkill?: { name: string; description: string } | null;
  passiveSkills: Array<{
    id: number;
    name: string;
    description: string;
  }>;
  costumes: Array<{
    id: number;
    slug: string;
    name: string;
    costumeIndex?: number | null;
  }>;
  baseHeroId?: number | null;
  imageUrl?: string | null;
  releaseDate?: string | null;
};

export type PublicHeroVariantSummaryItem = {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string | null;
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
            noValue: 'Not set',
            noPassiveSkills: 'No passive skills yet',
            noCostumes: 'No costumes yet',
            rarityStars: (stars: number) => `${stars}*`,
            detailsUnavailable: 'Failed to load hero details',
          },
    [locale],
  );

  const releaseDate = heroDetails?.releaseDate ? formatDate(heroDetails.releaseDate, locale, t.noValue) : null;
  const resolvedImageUrl = heroDetails?.imageUrl ?? heroCard?.imageUrl ?? null;
  const currentHeroSlug = heroDetails?.slug ?? heroCard?.slug ?? null;
  const currentHeroIsCostume =
    heroDetails?.baseHeroId != null && heroVariants?.baseHero.slug !== currentHeroSlug;
  const resolvedRarityStars = heroDetails?.rarity?.stars ?? heroCard?.rarityStars ?? null;
  const resolvedCostumes = heroVariants?.costumes ?? [];
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

  const renderRelatedHeroChip = (slug: string, name: string, key: string | number) => {
    const isCurrent = currentHeroSlug === slug;

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
          {name}
        </button>
      );
    }

    return (
      <span
        key={key}
        className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground-soft)]"
      >
        {name}
      </span>
    );
  };

  return (
    <DictionaryModal open={open} title={t.title} closeLabel={t.close} onClose={onClose}>
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
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)]">
              {resolvedImageUrl ? (
                <button
                  type="button"
                  onClick={() => setImagePreviewOpen(true)}
                  className="block w-full bg-[var(--surface-strong)] transition hover:bg-[var(--surface)]"
                  aria-label={t.openImage}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedImageUrl}
                    alt={heroDetails.name}
                    className="h-[32rem] w-full object-contain object-top"
                  />
                </button>
              ) : (
                <div className="flex h-[32rem] items-center justify-center px-6 text-center text-sm text-[var(--foreground-muted)]">
                  {t.imagePlaceholder}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="text-2xl font-semibold text-[var(--foreground)]">{heroDetails.name}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  {t.element}: {heroDetails.element?.name ?? heroCard.elementName ?? t.noValue}
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  {t.rarity}:{' '}
                  {resolvedRarityStars != null ? t.rarityStars(resolvedRarityStars) : t.noValue}
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <span>{t.heroClass}: {heroDetails.heroClass?.name ?? heroCard.heroClassName ?? t.noValue}</span>
                    {heroClassTooltip ? <HeroInfoPopover label={t.heroClass} content={heroClassTooltip} /> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <span>{t.manaSpeed}: {heroDetails.manaSpeed?.name ?? heroCard.manaSpeedName ?? t.noValue}</span>
                    {heroDetails.manaSpeed?.description ? (
                      <HeroInfoPopover label={t.manaSpeed} content={heroDetails.manaSpeed.description} />
                    ) : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <span>{t.family}: {heroDetails.family?.name ?? heroCard.familyName ?? t.noValue}</span>
                    {heroDetails.family?.description ? (
                      <HeroInfoPopover label={t.family} content={heroDetails.family.description} />
                    ) : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <span>{t.alphaTalent}: {heroDetails.alphaTalent?.name ?? heroCard.alphaTalentName ?? t.noValue}</span>
                    {heroDetails.alphaTalent?.description ? (
                      <HeroInfoPopover label={t.alphaTalent} content={heroDetails.alphaTalent.description} />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.specialSkill}</div>
            <div className="text-base font-medium text-[var(--foreground)]">
              {heroDetails.specialSkill?.name ?? t.noValue}
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-soft)]">
              {heroDetails.specialSkill?.description ?? t.noValue}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.passiveSkills}</div>
            {heroDetails.passiveSkills.length === 0 ? (
              <div className="text-sm text-[var(--foreground-soft)]">{t.noPassiveSkills}</div>
            ) : (
              <div className="space-y-3">
                {heroDetails.passiveSkills.map((skill) => (
                  <div key={skill.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                      <span>{skill.name}</span>
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
                      renderRelatedHeroChip(costume.slug, costume.name, costume.id),
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
                    {t.baseAttack}: {heroCard.baseAttack ?? t.noValue}
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                    {t.baseArmor}: {heroCard.baseArmor ?? t.noValue}
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground)]">
                    {t.baseHp}: {heroCard.baseHp ?? t.noValue}
                  </div>
                </div>
              </div>

              <HeroStatCalculatorPanel
                locale={locale}
                heroId={heroDetails.id}
                heroSlug={heroDetails.slug}
                calculateEndpoint={`/api/v1/public/heroes/${heroDetails.slug}/stats/calculate?language=${locale}`}
                isCostume={heroDetails.baseHeroId != null}
                baseAttack={heroCard.baseAttack ?? null}
                baseArmor={heroCard.baseArmor ?? null}
                baseHp={heroCard.baseHp ?? null}
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

      {imagePreviewOpen && resolvedImageUrl && (
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
            src={resolvedImageUrl}
            alt={heroDetails?.name ?? heroCard?.name ?? 'Hero image'}
            className="max-h-[92vh] max-w-[92vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </DictionaryModal>
  );
}
