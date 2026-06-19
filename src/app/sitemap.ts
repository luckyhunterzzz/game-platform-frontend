import type { MetadataRoute } from 'next';

import { eventGuideItems } from '@/lib/static/events';
import { getHeroNames } from '@/lib/server/public-heroes';
import { resolveAlternateOrigin } from '@/lib/server/site-context';

export const dynamic = 'force-dynamic';

const enSiteUrl = resolveAlternateOrigin('en');
const ruSiteUrl = resolveAlternateOrigin('ru');

const staticRoutes = [
  '',
  '/alliance',
  '/chests',
  '/events',
  '/heroes',
  '/joint-purchases',
  '/privacy',
  '/terms',
  '/troops',
];

function buildLocalizedEntries(
  path: string,
  options: Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority' | 'lastModified'>,
): MetadataRoute.Sitemap {
  return [enSiteUrl, ruSiteUrl].map((siteUrl) => ({
    url: `${siteUrl}${path}`,
    ...options,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = staticRoutes.flatMap((route) =>
    buildLocalizedEntries(route, {
      lastModified: now,
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.8,
    }),
  );

  const eventPages: MetadataRoute.Sitemap = eventGuideItems.flatMap((event) =>
    buildLocalizedEntries(`/events/${event.slug}`, {
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }),
  );

  const heroPages: MetadataRoute.Sitemap = [];

  try {
    const heroItems = await getHeroNames('RU');
    const uniqueSlugs = [...new Set(heroItems.map((hero) => hero.slug).filter(Boolean))];

    heroPages.push(
      ...uniqueSlugs.flatMap((slug) =>
        buildLocalizedEntries(`/heroes?hero=${encodeURIComponent(slug)}`, {
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        }),
      ),
    );
  } catch (error) {
    console.error('Failed to generate hero sitemap entries', error);
  }

  return [...staticPages, ...eventPages, ...heroPages];
}
