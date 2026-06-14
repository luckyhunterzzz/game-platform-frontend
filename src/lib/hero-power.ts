export const HERO_POWER_SPECIAL_SKILL_BONUS = 40;

export function getHeroPowerStarBonus(rarityStars: number | null | undefined): number | null {
  switch (rarityStars) {
    case 3:
      return 25;
    case 4:
      return 45;
    case 5:
      return 85;
    default:
      return null;
  }
}

export function calculateHeroPower(params: {
  attack: number | null | undefined;
  armor: number | null | undefined;
  hp: number | null | undefined;
  rarityStars: number | null | undefined;
  talentCount?: number;
}): number | null {
  const { attack, armor, hp, rarityStars, talentCount = 0 } = params;
  const starBonus = getHeroPowerStarBonus(rarityStars);

  if (attack == null || armor == null || hp == null || starBonus == null) {
    return null;
  }

  const power =
    attack * 0.35 +
    armor * 0.28 +
    hp * 0.14 +
    HERO_POWER_SPECIAL_SKILL_BONUS +
    talentCount * 5 +
    starBonus;

  return Math.floor(power);
}
