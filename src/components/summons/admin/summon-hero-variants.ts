import type { SummonHeroOption, SummonHeroVariantMode } from '@/lib/types/summon';

function baseHeroId(hero: SummonHeroOption) {
  return hero.isCostume && hero.baseHeroId ? hero.baseHeroId : hero.id;
}

function isNewerCostume(candidate: SummonHeroOption, current: SummonHeroOption) {
  const candidateIndex = candidate.costumeIndex ?? -1;
  const currentIndex = current.costumeIndex ?? -1;
  return candidateIndex > currentIndex
    || (candidateIndex === currentIndex && candidate.id > current.id);
}

export function resolveHeroOptionsForMode(
  heroes: SummonHeroOption[],
  mode: SummonHeroVariantMode,
) {
  if (mode === 'EXACT') return heroes;

  const originals = new Map<number, SummonHeroOption>();
  const latestCostumes = new Map<number, SummonHeroOption>();

  heroes.forEach((hero) => {
    const rootId = baseHeroId(hero);
    if (!hero.isCostume) {
      originals.set(rootId, hero);
      return;
    }
    const current = latestCostumes.get(rootId);
    if (!current || isNewerCostume(hero, current)) {
      latestCostumes.set(rootId, hero);
    }
  });

  return [...originals.values()].map((original) => {
    if (mode === 'ORIGINAL') return original;
    return latestCostumes.get(original.id) ?? original;
  });
}

export function normalizeHeroIdsForMode(
  heroIds: number[],
  mode: SummonHeroVariantMode,
  heroes: SummonHeroOption[],
) {
  if (mode === 'EXACT') return [...new Set(heroIds)];

  const heroesById = new Map(heroes.map((hero) => [hero.id, hero]));
  const resolvedByBaseId = new Map(
    resolveHeroOptionsForMode(heroes, mode).map((hero) => [baseHeroId(hero), hero.id]),
  );
  const normalizedIds: number[] = [];
  const addedIds = new Set<number>();

  heroIds.forEach((heroId) => {
    const hero = heroesById.get(heroId);
    if (!hero) return;
    const resolvedId = resolvedByBaseId.get(baseHeroId(hero));
    if (resolvedId === undefined || addedIds.has(resolvedId)) return;
    addedIds.add(resolvedId);
    normalizedIds.push(resolvedId);
  });

  return normalizedIds;
}
