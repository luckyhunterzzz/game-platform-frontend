import type { Metadata } from 'next';

import type { HeroLanguage, PublicHeroDetailsItem } from '@/lib/server/public-heroes';
import { buildAlternatesForPath, resolveAlternateOrigin } from '@/lib/server/site-context';

function toHeroLanguage(locale: 'ru' | 'en'): HeroLanguage {
  return locale === 'ru' ? 'RU' : 'EN';
}

function buildHeroTitle(details: PublicHeroDetailsItem, language: HeroLanguage): string {
  return language === 'RU'
    ? `${details.name} - герой Empires & Puzzles`
    : `${details.name} - Empires & Puzzles hero`;
}

function buildHeroDescription(details: PublicHeroDetailsItem, language: HeroLanguage): string {
  const rarityText = details.rarity?.stars ? `${details.rarity.stars}*` : null;
  const elementText = details.element?.name?.trim() || null;
  const classText = details.heroClass?.name?.trim() || null;
  const familyText = details.family?.name?.trim() || null;
  const manaSpeedText = details.manaSpeed?.name?.trim() || null;

  if (language === 'RU') {
    const parts = [
      rarityText ? `${rarityText} герой` : 'Герой',
      elementText ? `стихии ${elementText}` : null,
      classText ? `класса ${classText}` : null,
      familyText ? `из семьи ${familyText}` : null,
      manaSpeedText ? `со скоростью маны ${manaSpeedText}` : null,
    ].filter(Boolean);

    return `${details.name} - ${parts.join(' ')}. Смотрите карточку героя, характеристики и детали на GameOps Platform.`;
  }

  const parts = [
    rarityText ? `${rarityText} hero` : 'Hero',
    elementText ? `of the ${elementText} element` : null,
    classText ? `with the ${classText} class` : null,
    familyText ? `from the ${familyText} family` : null,
    manaSpeedText ? `and ${manaSpeedText} mana speed` : null,
  ].filter(Boolean);

  return `${details.name} - ${parts.join(' ')}. Explore hero details, stats, and card information on GameOps Platform.`;
}

function buildCatalogMetadata(locale: 'ru' | 'en'): Metadata {
  const pathWithQuery = '/heroes';

  if (locale === 'ru') {
    return {
      title: 'Каталог героев Empires & Puzzles',
      description: 'Каталог героев Empires & Puzzles с карточками, параметрами и подборками на GameOps Platform.',
      alternates: buildAlternatesForPath(pathWithQuery, locale),
    };
  }

  return {
    title: 'Empires & Puzzles Hero Catalog',
    description: 'Browse Empires & Puzzles heroes, cards, stats, and collections on GameOps Platform.',
    alternates: buildAlternatesForPath(pathWithQuery, locale),
  };
}

export function buildHeroesPageMetadata({
  locale,
  slug,
  details,
}: {
  locale: 'ru' | 'en';
  slug: string | null;
  details: PublicHeroDetailsItem | null;
}): Metadata {
  if (!slug || !details) {
    return buildCatalogMetadata(locale);
  }

  const heroLanguage = toHeroLanguage(locale);
  const title = buildHeroTitle(details, heroLanguage);
  const description = buildHeroDescription(details, heroLanguage);
  const pathWithQuery = `/heroes?hero=${encodeURIComponent(slug)}`;
  const imageUrl = details.imageUrl ?? details.previewUrl ?? '/favicon.ico';
  const alternateOrigin = resolveAlternateOrigin(locale);
  const absoluteImageUrl =
    imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
      ? imageUrl
      : `${alternateOrigin}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;

  return {
    title,
    description,
    alternates: buildAlternatesForPath(pathWithQuery, locale),
    openGraph: {
      type: 'website',
      url: `${alternateOrigin}${pathWithQuery}`,
      title,
      description,
      images: [{ url: absoluteImageUrl, alt: details.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}
