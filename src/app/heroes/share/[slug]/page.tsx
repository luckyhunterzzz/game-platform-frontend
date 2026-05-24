import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import HeroShareRedirect from './HeroShareRedirect';
import {
  getHeroSharePageUrl,
  getHeroVariantsBySlug,
  SITE_URL,
  toAbsoluteSiteUrl,
  type HeroLanguage,
} from '@/lib/server/public-heroes';

type HeroSharePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    locale?: string;
  }>;
};

function resolveLanguage(value?: string): HeroLanguage {
  return value?.toUpperCase() === 'RU' ? 'RU' : 'EN';
}

function buildHeroDescription(
  details: NonNullable<Awaited<ReturnType<typeof getHeroVariantsBySlug>>>['currentHero'],
  language: HeroLanguage,
) {
  const rarityText = details.rarity?.stars ? `${details.rarity.stars}*` : null;
  const elementText = details.element?.name?.trim() || null;
  const classText = details.heroClass?.name?.trim() || null;
  const familyText = details.family?.name?.trim() || null;
  const manaSpeedText = details.manaSpeed?.name?.trim() || null;

  if (language === 'RU') {
    const prefix = [rarityText, elementText, 'герой.'].filter(Boolean).join(' ');
    const parts = [
      prefix || 'Герой.',
      classText ? `Класс: ${classText}.` : null,
      familyText ? `Семья: ${familyText}.` : null,
      manaSpeedText ? `Скорость: ${manaSpeedText}.` : null,
      'Посмотреть детали.',
    ].filter(Boolean);

    return parts.join(' ');
  }

  const prefix = [rarityText, elementText, 'hero.'].filter(Boolean).join(' ');
  const parts = [
    prefix || 'Hero.',
    classText ? `Class: ${classText}.` : null,
    familyText ? `Family: ${familyText}.` : null,
    manaSpeedText ? `Speed: ${manaSpeedText}.` : null,
    'View details.',
  ].filter(Boolean);

  return parts.join(' ');
}

export async function generateMetadata({ params, searchParams }: HeroSharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const language = resolveLanguage(resolvedSearchParams?.locale);
  const variants = await getHeroVariantsBySlug(slug, language);

  if (!variants?.currentHero) {
    return {
      title: 'Hero card',
      description: 'GameOps hero share card',
    };
  }

  const details = variants.currentHero;
  const title = details.name;
  const description = buildHeroDescription(details, language);
  const imageUrl = toAbsoluteSiteUrl(details.imageUrl ?? details.previewUrl ?? '/favicon.ico');
  const shareUrl = `${getHeroSharePageUrl(slug)}?locale=${language.toLowerCase()}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/heroes?hero=${encodeURIComponent(slug)}`,
    },
    openGraph: {
      type: 'website',
      url: shareUrl,
      title,
      description,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: title,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function HeroSharePage({ params, searchParams }: HeroSharePageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const language = resolveLanguage(resolvedSearchParams?.locale);
  const variants = await getHeroVariantsBySlug(slug, language);

  if (!variants?.currentHero) {
    notFound();
  }

  const details = variants.currentHero;
  const targetUrl = `/heroes?hero=${encodeURIComponent(slug)}`;
  const description = buildHeroDescription(details, language);
  const previewUrl = toAbsoluteSiteUrl(details.imageUrl ?? details.previewUrl ?? null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08111f] px-4 py-10 text-white">
      <HeroShareRedirect targetUrl={targetUrl} />
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-4">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={details.name} className="h-24 w-24 rounded-2xl object-cover" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{details.name}</h1>
            <p className="mt-2 text-sm text-white/70">{description}</p>
            <p className="mt-4 text-sm text-white/60">
              {language === 'RU'
                ? 'Если переход не сработал автоматически, откройте карточку героя вручную.'
                : 'If the redirect did not happen automatically, open the hero card manually.'}
            </p>
            <Link
              href={targetUrl}
              className="mt-4 inline-flex rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              {language === 'RU' ? 'Открыть героя' : 'Open hero'}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
