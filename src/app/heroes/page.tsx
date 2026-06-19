import type { Metadata } from 'next';
import { headers } from 'next/headers';

import HeroesPageShell from '@/components/heroes/HeroesPageShell';
import { buildHeroesPageMetadata } from '@/lib/server/hero-seo';
import { getHeroVariantsBySlug, type PublicHeroDetailsItem } from '@/lib/server/public-heroes';
import { resolveLocaleByHost } from '@/lib/server/site-context';

type HeroesPageProps = {
  searchParams?: Promise<{
    hero?: string;
  }>;
};

function normalizeHeroSlug(value?: string): string | null {
  const slug = value?.trim().toLowerCase() ?? '';
  return slug.length > 0 ? slug : null;
}

function renderHeroIntro(details: PublicHeroDetailsItem, locale: 'ru' | 'en') {
  const labels =
    locale === 'ru'
      ? {
          title: 'Карточка героя',
          element: 'Стихия',
          rarity: 'Редкость',
          heroClass: 'Класс',
          family: 'Семья',
          manaSpeed: 'Скорость маны',
          catalog: 'Перейти к каталогу героев',
          openHint: 'Полная карточка откроется в текущем интерфейсе ниже автоматически.',
        }
      : {
          title: 'Hero card',
          element: 'Element',
          rarity: 'Rarity',
          heroClass: 'Class',
          family: 'Family',
          manaSpeed: 'Mana speed',
          catalog: 'Open the hero catalog',
          openHint: 'The full card will open in the current interface below automatically.',
        };

  const facts = [
    details.element?.name ? { label: labels.element, value: details.element.name } : null,
    details.rarity?.stars ? { label: labels.rarity, value: `${details.rarity.stars}*` } : null,
    details.heroClass?.name ? { label: labels.heroClass, value: details.heroClass.name } : null,
    details.family?.name ? { label: labels.family, value: details.family.name } : null,
    details.manaSpeed?.name ? { label: labels.manaSpeed, value: details.manaSpeed.name } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section className="px-4 pt-8">
      <article className="mx-auto max-w-7xl rounded-3xl border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.10),rgba(15,23,42,0.04))] p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              {labels.title}
            </div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{details.name}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--foreground-soft)]">
              {locale === 'ru'
                ? `${details.name}${details.family?.name ? ` из семьи ${details.family.name}` : ''}${details.heroClass?.name ? `, класс ${details.heroClass.name}` : ''}${details.element?.name ? `, стихия ${details.element.name}` : ''}. ${labels.openHint}`
                : `${details.name}${details.family?.name ? ` from the ${details.family.name} family` : ''}${details.heroClass?.name ? `, ${details.heroClass.name} class` : ''}${details.element?.name ? `, ${details.element.name} element` : ''}. ${labels.openHint}`}
            </p>
          </div>

          {details.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={details.imageUrl}
              alt={details.name}
              className="h-32 w-32 rounded-2xl border border-[var(--border)] object-cover"
            />
          ) : null}
        </div>

        {facts.length > 0 ? (
          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <dt className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">{fact.label}</dt>
                <dd className="mt-2 text-sm font-semibold text-[var(--foreground)]">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-5 text-sm text-[var(--foreground-muted)]">
          <a href="/heroes" className="transition hover:text-[var(--foreground)]">
            {labels.catalog}
          </a>
        </div>
      </article>
    </section>
  );
}

export async function generateMetadata({ searchParams }: HeroesPageProps): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const slug = normalizeHeroSlug(resolvedSearchParams?.hero);
  const requestHeaders = await headers();
  const locale = resolveLocaleByHost(requestHeaders.get('host'));
  const language = locale === 'ru' ? 'RU' : 'EN';
  const details = slug ? (await getHeroVariantsBySlug(slug, language))?.currentHero ?? null : null;

  return buildHeroesPageMetadata({ locale, slug, details });
}

export default async function HeroesPage({ searchParams }: HeroesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const slug = normalizeHeroSlug(resolvedSearchParams?.hero);
  const requestHeaders = await headers();
  const locale = resolveLocaleByHost(requestHeaders.get('host'));
  const language = locale === 'ru' ? 'RU' : 'EN';
  const details = slug ? (await getHeroVariantsBySlug(slug, language))?.currentHero ?? null : null;

  return (
    <HeroesPageShell
      heroIntro={details ? renderHeroIntro(details, locale) : undefined}
      showCatalogHeader={!details}
    />
  );
}
