export type TroopElementKey = 'nature' | 'ice' | 'fire' | 'dark' | 'holy';

export type HeroClassKey =
  | 'barbarian'
  | 'cleric'
  | 'druid'
  | 'fighter'
  | 'monk'
  | 'paladin'
  | 'ranger'
  | 'rogue'
  | 'sorcerer'
  | 'wizard';

export type TroopSpecialtyKey =
  | 'critical_modifier_legendary_troop'
  | 'debuff_damage_reduction_legendary_troop'
  | 'extra_heal_on_heal_legendary_troop'
  | 'increase_special_damage_legendary_troop'
  | 'resist_debuffs_legendary_troop'
  | 'special_damage_reduction_legendary_troop'
  | 'status_effect_attack_addition_legendary_troop'
  | 'status_effect_attack_reduction_legendary_troop'
  | 'status_effect_defense_addition_legendary_troop'
  | 'status_effect_defense_reduction_legendary_troop';

export type TroopTemplate = {
  key: string;
  nameEn: string;
  nameRu: string;
  specialty: TroopSpecialtyKey;
  classes: [HeroClassKey, HeroClassKey];
};

export type TroopSpecialtyContent = {
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
};

export type TroopBonusSummary = {
  attack: string;
  defense: string;
  health: string;
  mana: string;
  classAttackBonus: string;
  classDefenseBonus: string;
  classHealthBonus: string;
  classManaBonus: string;
  totalAttack: string;
  totalDefense: string;
  totalHealth: string;
  totalMana: string;
};

export const TROOPS_ASSET_BASE = '/heroes/troops';
export const TROOP_SPECIALTY_ASSET_BASE = `${TROOPS_ASSET_BASE}/specialty`;
export const HERO_ELEMENT_ASSET_BASE = '/heroes/elements/elements';
export const HERO_CLASS_ASSET_BASE = '/heroes/elements/classes';
export const HERO_STAR_ASSET = '/heroes/elements/star/symbol_star_big_small.webp';
export const TROOP_STATS_ASSET_BASE = '/heroes/elements/stats';

export const TROOP_ELEMENT_PREFIX_BY_KEY: Record<TroopElementKey, string> = {
  nature: 'green',
  ice: 'blue',
  fire: 'red',
  dark: 'purple',
  holy: 'yellow',
};

export const TROOP_ELEMENT_ICON_BY_KEY: Record<TroopElementKey, string> = {
  nature: `${HERO_ELEMENT_ASSET_BASE}/herald_green.webp`,
  ice: `${HERO_ELEMENT_ASSET_BASE}/herald_blue.webp`,
  fire: `${HERO_ELEMENT_ASSET_BASE}/herald_red.webp`,
  dark: `${HERO_ELEMENT_ASSET_BASE}/herald_purple.webp`,
  holy: `${HERO_ELEMENT_ASSET_BASE}/herald_yellow.webp`,
};

export const TROOP_CLASS_ICON_BY_KEY: Record<HeroClassKey, string> = {
  barbarian: `${HERO_CLASS_ASSET_BASE}/barbarian.png`,
  cleric: `${HERO_CLASS_ASSET_BASE}/cleric.png`,
  druid: `${HERO_CLASS_ASSET_BASE}/druid.png`,
  fighter: `${HERO_CLASS_ASSET_BASE}/fighter.png`,
  monk: `${HERO_CLASS_ASSET_BASE}/monk.png`,
  paladin: `${HERO_CLASS_ASSET_BASE}/paladin.png`,
  ranger: `${HERO_CLASS_ASSET_BASE}/ranger.png`,
  rogue: `${HERO_CLASS_ASSET_BASE}/rogue.png`,
  sorcerer: `${HERO_CLASS_ASSET_BASE}/sorcerer.png`,
  wizard: `${HERO_CLASS_ASSET_BASE}/wizard.png`,
};

export const TROOP_SPECIALTY_ICON_BY_KEY: Record<TroopSpecialtyKey, string> = {
  critical_modifier_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/critical_modifier_legendary_troop.webp`,
  debuff_damage_reduction_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/debuff_damage_reduction_legendary_troop.webp`,
  extra_heal_on_heal_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/extra_heal_on_heal_legendary_troop.webp`,
  increase_special_damage_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/increase_special_damage_legendary_troop.webp`,
  resist_debuffs_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/resist_debuffs_legendary_troop.webp`,
  special_damage_reduction_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/special_damage_reduction_legendary_troop.webp`,
  status_effect_attack_addition_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/status_effect_attack_addition_legendary_troop.webp`,
  status_effect_attack_reduction_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/status_effect_attack_reduction_legendary_troop.webp`,
  status_effect_defense_addition_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/status_effect_defense_addition_legendary_troop.webp`,
  status_effect_defense_reduction_legendary_troop: `${TROOP_SPECIALTY_ASSET_BASE}/status_effect_defense_reduction_legendary_troop.webp`,
};

export const TROOP_STAT_ICON_BY_KEY = {
  attack: `${TROOP_STATS_ASSET_BASE}/stat_atk.webp`,
  defense: `${TROOP_STATS_ASSET_BASE}/stat_defense.webp`,
  health: `${TROOP_STATS_ASSET_BASE}/stat_health.webp`,
  mana: `${TROOP_STATS_ASSET_BASE}/stat_mana_bonus.webp`,
} as const;

export const TROOP_CLASS_LABELS: Record<HeroClassKey, { en: string; ru: string }> = {
  barbarian: { en: 'Barbarian', ru: 'Варвар' },
  cleric: { en: 'Cleric', ru: 'Церковник' },
  druid: { en: 'Druid', ru: 'Друид' },
  fighter: { en: 'Fighter', ru: 'Боец' },
  monk: { en: 'Monk', ru: 'Монах' },
  paladin: { en: 'Paladin', ru: 'Паладин' },
  ranger: { en: 'Ranger', ru: 'Рейнджер' },
  rogue: { en: 'Rogue', ru: 'Разбойник' },
  sorcerer: { en: 'Sorcerer', ru: 'Колдун' },
  wizard: { en: 'Wizard', ru: 'Маг' },
};

export const TROOP_SPECIALTY_LABELS: Record<TroopSpecialtyKey, { en: string; ru: string }> = {
  critical_modifier_legendary_troop: { en: 'Critical Modifier', ru: 'Критический модификатор' },
  debuff_damage_reduction_legendary_troop: { en: 'Status Ailment Damage Reduction', ru: 'Уменьшение урона от недуга' },
  extra_heal_on_heal_legendary_troop: { en: 'Extra Healing', ru: 'Дополнительное исцеление' },
  increase_special_damage_legendary_troop: { en: 'Increased Special Skill Damage', ru: 'Увеличение урона от особого навыка' },
  resist_debuffs_legendary_troop: { en: 'Resist Status Ailments', ru: 'Сопротивление недугам' },
  special_damage_reduction_legendary_troop: { en: 'Special Skill Damage Reduction', ru: 'Уменьшение урона от особого навыка' },
  status_effect_attack_addition_legendary_troop: { en: 'Increase Status Effect Attack', ru: 'Увеличение эффектов атаки' },
  status_effect_attack_reduction_legendary_troop: { en: 'Attack Ailment Reduction', ru: 'Снижение недугов атаки' },
  status_effect_defense_addition_legendary_troop: { en: 'Increase Status Effect Defense', ru: 'Увеличение эффектов защиты' },
  status_effect_defense_reduction_legendary_troop: { en: 'Defense Ailment Reduction', ru: 'Снижение недугов защиты' },
};

export const TROOP_SPECIALTY_CONTENT: Record<TroopSpecialtyKey, TroopSpecialtyContent> = {
  critical_modifier_legendary_troop: {
    titleEn: 'Critical Modifier',
    titleRu: 'Критический модификатор',
    descriptionEn: 'Grants 15% critical chance to the character this troop is equipped on.',
    descriptionRu: 'Дает +15% шанса критического удара герою, который использует этот отряд.',
  },
  debuff_damage_reduction_legendary_troop: {
    titleEn: 'Status Ailment Damage Reduction',
    titleRu: 'Уменьшение урона от недуга',
    descriptionEn: 'Damage caused by status ailments and negative stacks is reduced by 10% for the character this troop is equipped on.',
    descriptionRu: 'Урон от недугов и негативных накапливаемых эффектов статуса снижается на 10% для героя, который использует этот отряд.',
  },
  extra_heal_on_heal_legendary_troop: {
    titleEn: 'Extra Healing',
    titleRu: 'Дополнительное исцеление',
    descriptionEn: 'The character this troop is equipped on receives extra 5% health once every turn if health is recovered.',
    descriptionRu: 'Герой, который использует этот отряд, получает 5% здоровья дополнительно раз за ход, если его здоровье восстанавливается.',
  },
  increase_special_damage_legendary_troop: {
    titleEn: 'Increased Special Skill Damage',
    titleRu: 'Увеличение урона от особого навыка',
    descriptionEn: 'Direct Special Damage done by the character this troop is equipped on is increased by 8%.',
    descriptionRu: 'Прямой урон от особых навыков, нанесенный героем, который использует этот отряд, увеличивается на 8%.',
  },
  resist_debuffs_legendary_troop: {
    titleEn: 'Resist Status Ailments',
    titleRu: 'Сопротивление недугам',
    descriptionEn: 'Character this troop is equipped on has 10% chance to resist status ailments.',
    descriptionRu: 'Герой, который использует этот отряд, с вероятностью 10% устоит против недугов.',
  },
  special_damage_reduction_legendary_troop: {
    titleEn: 'Special Skill Damage Reduction',
    titleRu: 'Уменьшение урона от особого навыка',
    descriptionEn: 'Direct Special Damage taken by the character this troop is equipped on is reduced by 8%.',
    descriptionRu: 'Прямой урон от особых навыков, полученный героем, который использует этот отряд, снижается на 8%.',
  },
  status_effect_attack_addition_legendary_troop: {
    titleEn: 'Increase Status Effect Attack',
    titleRu: 'Увеличение эффектов атаки',
    descriptionEn: 'Attack buffs are 8% more effective for the character this troop is equipped on.',
    descriptionRu: 'Усиления атаки на 8% эффективнее для героя, который использует этот отряд.',
  },
  status_effect_attack_reduction_legendary_troop: {
    titleEn: 'Attack Ailment Reduction',
    titleRu: 'Снижение недугов атаки',
    descriptionEn: 'Attack status ailments are 8% less effective against the character this troop is equipped on.',
    descriptionRu: 'Ослабления атаки на 8% менее эффективны против героя, который использует этот отряд.',
  },
  status_effect_defense_addition_legendary_troop: {
    titleEn: 'Increase Status Effect Defense',
    titleRu: 'Увеличение эффектов защиты',
    descriptionEn: 'Defense buffs are 8% more effective for the character this troop is equipped on.',
    descriptionRu: 'Усиления защиты на 8% эффективнее для героя, который использует этот отряд.',
  },
  status_effect_defense_reduction_legendary_troop: {
    titleEn: 'Defense Ailment Reduction',
    titleRu: 'Снижение недугов защиты',
    descriptionEn: 'Defense status ailments are 8% less effective against the character this troop is equipped on.',
    descriptionRu: 'Ослабления защиты на 8% менее эффективны против героя, который использует этот отряд.',
  },
};

export const TROOP_ELEMENT_LABELS: Record<TroopElementKey, { en: string; ru: string }> = {
  nature: { en: 'Nature', ru: 'Природа' },
  ice: { en: 'Ice', ru: 'Лёд' },
  fire: { en: 'Fire', ru: 'Огонь' },
  dark: { en: 'Dark', ru: 'Тьма' },
  holy: { en: 'Holy', ru: 'Святыня' },
};

export const TROOP_TEMPLATES: TroopTemplate[] = [
  { key: 'master_assassin', nameEn: 'Battle Master Assassin', nameRu: 'Боевой мастер ассасинов', specialty: 'status_effect_attack_addition_legendary_troop', classes: ['rogue', 'fighter'] },
  { key: 'barbarian', nameEn: 'Majestic Minotaur', nameRu: 'Величественный минотавр', specialty: 'status_effect_attack_addition_legendary_troop', classes: ['barbarian', 'druid'] },
  { key: 'furious_monk', nameEn: 'Furious Monk', nameRu: 'Яростный монах', specialty: 'extra_heal_on_heal_legendary_troop', classes: ['monk', 'barbarian'] },
  { key: 'cleric', nameEn: 'Unwavering Cleric', nameRu: 'Стойкий церковник', specialty: 'extra_heal_on_heal_legendary_troop', classes: ['cleric', 'fighter'] },
  { key: 'devoted_knight', nameEn: 'Devoted Knight', nameRu: 'Приверженный рыцарь', specialty: 'debuff_damage_reduction_legendary_troop', classes: ['paladin', 'cleric'] },
  { key: 'druid', nameEn: 'Enchanted Ent', nameRu: 'Очарованный энт', specialty: 'debuff_damage_reduction_legendary_troop', classes: ['druid', 'barbarian'] },
  { key: 'hunter_mage', nameEn: 'Hunter Mage', nameRu: 'Охотник-маг', specialty: 'status_effect_defense_reduction_legendary_troop', classes: ['sorcerer', 'ranger'] },
  { key: 'fighter', nameEn: 'Unstoppable Fighter', nameRu: 'Неудержимый боец', specialty: 'status_effect_defense_reduction_legendary_troop', classes: ['fighter', 'cleric'] },
  { key: 'divine_cleric', nameEn: 'Divine Cleric', nameRu: 'Божественный церковник', specialty: 'resist_debuffs_legendary_troop', classes: ['cleric', 'paladin'] },
  { key: 'monk', nameEn: 'Mighty Monk', nameRu: 'Могучий монах', specialty: 'resist_debuffs_legendary_troop', classes: ['monk', 'sorcerer'] },
  { key: 'paladin', nameEn: 'Elite Knight', nameRu: 'Элитный рыцарь', specialty: 'status_effect_defense_addition_legendary_troop', classes: ['paladin', 'rogue'] },
  { key: 'tree_spirit', nameEn: 'Enlightened Tree Spirit', nameRu: 'Просвещенный дух деревьев', specialty: 'status_effect_defense_addition_legendary_troop', classes: ['druid', 'wizard'] },
  { key: 'ranger', nameEn: 'Eternal Hunter', nameRu: 'Вечный охотник', specialty: 'status_effect_attack_reduction_legendary_troop', classes: ['ranger', 'wizard'] },
  { key: 'swashbuckler', nameEn: 'Swashbuckler Fighter', nameRu: 'Боец-головорез', specialty: 'status_effect_attack_reduction_legendary_troop', classes: ['fighter', 'rogue'] },
  { key: 'arcane_hunter', nameEn: 'Arcane Hunter', nameRu: 'Тайный охотник', specialty: 'critical_modifier_legendary_troop', classes: ['ranger', 'sorcerer'] },
  { key: 'rogue', nameEn: 'Unseen Assassin', nameRu: 'Невидимый убийца', specialty: 'critical_modifier_legendary_troop', classes: ['rogue', 'paladin'] },
  { key: 'sorcerer', nameEn: 'Royal Sorcerer', nameRu: 'Королевский колдун', specialty: 'special_damage_reduction_legendary_troop', classes: ['sorcerer', 'monk'] },
  { key: 'shaman_wizard', nameEn: 'Shaman Wizard', nameRu: 'Шаман-волшебник', specialty: 'special_damage_reduction_legendary_troop', classes: ['wizard', 'druid'] },
  { key: 'wizard', nameEn: 'Eldest Wizard', nameRu: 'Старейший маг', specialty: 'increase_special_damage_legendary_troop', classes: ['wizard', 'ranger'] },
  { key: 'serene_brute', nameEn: 'Serene Brute', nameRu: 'Безмятежный дикарь', specialty: 'increase_special_damage_legendary_troop', classes: ['barbarian', 'monk'] },
];

export const TROOP_BONUS_SUMMARIES: Record<string, TroopBonusSummary> = {
  arcane_hunter: { attack: '22%', defense: '25%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '29.3%', totalDefense: '32.5%', totalHealth: '43.8%', totalMana: '11%' },
  master_assassin: { attack: '22%', defense: '26%', health: '24%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '29.3%', totalDefense: '33.6%', totalHealth: '42.6%', totalMana: '11%' },
  devoted_knight: { attack: '21%', defense: '26%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '28.3%', totalDefense: '33.6%', totalHealth: '43.8%', totalMana: '11%' },
  divine_cleric: { attack: '27%', defense: '20%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '34.6%', totalDefense: '27.2%', totalHealth: '43.8%', totalMana: '11%' },
  wizard: { attack: '22%', defense: '26%', health: '24%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '29.3%', totalDefense: '33.6%', totalHealth: '42.6%', totalMana: '11%' },
  paladin: { attack: '22%', defense: '25%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '29.3%', totalDefense: '32.5%', totalHealth: '43.8%', totalMana: '11%' },
  druid: { attack: '23%', defense: '24%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '30.4%', totalDefense: '31.4%', totalHealth: '43.8%', totalMana: '11%' },
  tree_spirit: { attack: '24%', defense: '23%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '31.4%', totalDefense: '30.4%', totalHealth: '43.8%', totalMana: '11%' },
  ranger: { attack: '26%', defense: '22%', health: '24%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '33.6%', totalDefense: '29.3%', totalHealth: '42.6%', totalMana: '11%' },
  furious_monk: { attack: '26%', defense: '21%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '33.6%', totalDefense: '28.3%', totalHealth: '43.8%', totalMana: '11%' },
  hunter_mage: { attack: '23%', defense: '24%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '30.4%', totalDefense: '31.4%', totalHealth: '43.8%', totalMana: '11%' },
  barbarian: { attack: '27%', defense: '20%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '34.6%', totalDefense: '27.2%', totalHealth: '43.8%', totalMana: '11%' },
  monk: { attack: '25%', defense: '22%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '32.5%', totalDefense: '29.3%', totalHealth: '43.8%', totalMana: '11%' },
  sorcerer: { attack: '21%', defense: '26%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '28.3%', totalDefense: '33.6%', totalHealth: '43.8%', totalMana: '11%' },
  serene_brute: { attack: '20%', defense: '27%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '27.2%', totalDefense: '34.6%', totalHealth: '43.8%', totalMana: '11%' },
  shaman_wizard: { attack: '25%', defense: '22%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '32.5%', totalDefense: '29.3%', totalHealth: '43.8%', totalMana: '11%' },
  swashbuckler: { attack: '26%', defense: '22%', health: '24%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '33.6%', totalDefense: '29.3%', totalHealth: '42.6%', totalMana: '11%' },
  rogue: { attack: '26%', defense: '21%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '33.6%', totalDefense: '28.3%', totalHealth: '43.8%', totalMana: '11%' },
  fighter: { attack: '24%', defense: '23%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '31.4%', totalDefense: '30.4%', totalHealth: '43.8%', totalMana: '11%' },
  cleric: { attack: '20%', defense: '27%', health: '25%', mana: '11%', classAttackBonus: '6%', classDefenseBonus: '6%', classHealthBonus: '15%', classManaBonus: '0%', totalAttack: '27.2%', totalDefense: '34.6%', totalHealth: '43.8%', totalMana: '11%' },
};

export type TroopEntry = TroopTemplate & {
  elementKey: TroopElementKey;
  imageUrl: string;
  specialtyImageUrl: string;
  elementImageUrl: string;
};

const TROOP_ELEMENTS: TroopElementKey[] = ['nature', 'ice', 'fire', 'dark', 'holy'];

export function buildTroopEntries(): TroopEntry[] {
  return TROOP_ELEMENTS.flatMap((elementKey) =>
    TROOP_TEMPLATES.map((troop) => ({
      ...troop,
      elementKey,
      imageUrl: `${TROOPS_ASSET_BASE}/${TROOP_ELEMENT_PREFIX_BY_KEY[elementKey]}_legendary_${troop.key}.webp`,
      specialtyImageUrl: TROOP_SPECIALTY_ICON_BY_KEY[troop.specialty],
      elementImageUrl: TROOP_ELEMENT_ICON_BY_KEY[elementKey],
    })),
  );
}
