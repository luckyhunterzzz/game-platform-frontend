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
};

function resolveLanguage(): HeroLanguage {
  return 'EN';
}

function buildHeroDescription(details: NonNullable<Awaited<ReturnType<typeof getHeroVariantsBySlug>>>['currentHero']) {
  if (details.rarity?.stars) {
    return `${details.rarity.stars}* hero. View details.`;
  }

  return 'Hero card. View details.';
}

export async function generateMetadata({ params }: HeroSharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const language = resolveLanguage();
  const variants = await getHeroVariantsBySlug(slug, language);

  if (!variants?.currentHero) {
    return {
      title: 'Hero card',
      description: 'GameOps hero share card',
    };
  }

  const details = variants.currentHero;
  const title = details.name;
  const description = buildHeroDescription(details);
  const imageUrl = toAbsoluteSiteUrl(details.previewUrl ?? details.imageUrl ?? '/favicon.ico');
  const shareUrl = getHeroSharePageUrl(slug);

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

export default async function HeroSharePage({ params }: HeroSharePageProps) {
  const { slug } = await params;
  const language = resolveLanguage();
  const variants = await getHeroVariantsBySlug(slug, language);

  if (!variants?.currentHero) {
    notFound();
  }

  const details = variants.currentHero;
  const targetUrl = `/heroes?hero=${encodeURIComponent(slug)}`;
  const description = buildHeroDescription(details);
  const previewUrl = toAbsoluteSiteUrl(details.previewUrl ?? details.imageUrl ?? null);

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
              If the redirect did not happen automatically, open the hero card manually.
            </p>
            <Link
              href={targetUrl}
              className="mt-4 inline-flex rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              Open hero
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
