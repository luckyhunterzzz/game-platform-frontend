import type { MetadataRoute } from 'next';

import { eventGuideItems } from '@/lib/static/events';
import { getHeroNames } from '@/lib/server/public-heroes';

const siteUrl = 'https://gameops-platform.dev';
export const dynamic = 'force-dynamic';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  const eventPages: MetadataRoute.Sitemap = eventGuideItems.map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const heroPages: MetadataRoute.Sitemap = [];

  try {
    const heroItems = await getHeroNames('RU');
    const uniqueSlugs = [...new Set(heroItems.map((hero) => hero.slug).filter(Boolean))];

    heroPages.push(
      ...uniqueSlugs.map((slug) => ({
        url: `${siteUrl}/heroes?hero=${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    );
  } catch (error) {
    console.error('Failed to generate hero sitemap entries', error);
  }

  return [...staticPages, ...eventPages, ...heroPages];
}
