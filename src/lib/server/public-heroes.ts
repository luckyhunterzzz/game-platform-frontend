export type HeroLanguage = 'RU' | 'EN';

export type HeroLookupItem = {
  id: number;
  slug: string;
  name: string;
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
  heroCoachDate?: string | null;
  visitingOutfitterDate?: string | null;
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

export type PublicHeroVariantsResponse = {
  currentHero: PublicHeroDetailsItem;
  baseHero: PublicHeroVariantSummaryItem | null;
  costumes: PublicHeroVariantSummaryItem[];
};

export type HeroExpertOpinionPublicItem = {
  id: number;
  authorName: string;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  sourceType?: 'TELEGRAM' | 'VK' | 'FORUM' | 'YOUTUBE' | null;
  content?: string | null;
  publishedAt?: string | null;
};

const API_BASE_URL =
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:8081';
export const SITE_URL = 'https://gameops-platform.dev';

type FetchOptions = {
  revalidate?: number;
};

async function fetchApiJson<TResponse>(
  path: string,
  { revalidate = 3600 }: FetchOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'X-Request-Id': crypto.randomUUID(),
    },
    next: {
      revalidate,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function getHeroPageUrl(slug: string): string {
  return `${SITE_URL}/heroes/${slug}`;
}

export async function getHeroNames(language: HeroLanguage = 'RU'): Promise<HeroLookupItem[]> {
  return fetchApiJson<HeroLookupItem[]>(`/api/v1/public/heroes/names?language=${language}`);
}

export async function getHeroVariantsBySlug(
  slug: string,
  language: HeroLanguage = 'RU',
): Promise<PublicHeroVariantsResponse | null> {
  try {
    return await fetchApiJson<PublicHeroVariantsResponse>(
      `/api/v1/public/heroes/${slug}/variants?language=${language}`,
      { revalidate: 1800 },
    );
  } catch {
    return null;
  }
}

export async function getHeroExpertOpinionsBySlug(
  slug: string,
  language: HeroLanguage = 'RU',
): Promise<HeroExpertOpinionPublicItem[]> {
  try {
    return await fetchApiJson<HeroExpertOpinionPublicItem[]>(
      `/api/v1/public/heroes/${slug}/expert-opinions?language=${language}`,
      { revalidate: 1800 },
    );
  } catch {
    return [];
  }
}
