'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import DictionaryModal from './DictionaryModal';
import DictionaryInlineValue from '../DictionaryInlineValue';
import DictionaryMiniIcon from '../DictionaryMiniIcon';
import HeroInfoPopover from './HeroInfoPopover';
import HeroStatCalculatorPanel, { type HeroStatTroopOption } from './HeroStatCalculatorPanel';
import HeroExpertOpinionsPublicBlock from './HeroExpertOpinionsPublicBlock';
import type { HeroExpertOpinionPublicResponseDto } from '@/lib/types/hero-expert-opinion';
import { buildEpicTroopEntries } from '@/lib/static/troops';

const MANA_OPTIMIZATION_VISIBLE_TROOPS_LIMIT = 2;

export type PublicHeroCardItem = {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string | null;
  previewUrl?: string | null;
  elementName: string;
  rarityName: string;
  rarityStars: number;
  heroClassName: string;
  manaSpeedName: string;
  familyName?: string | null;
  alphaTalentName?: string | null;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
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
    bonus?: {
      attack?: number | null;
      armor?: number | null;
      hp?: number | null;
      mana?: number | null;
    } | null;
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

export type PublicHeroVariantsItem = {
  currentHero: PublicHeroDetailsItem;
  baseHero: PublicHeroVariantSummaryItem;
  costumes: PublicHeroVariantSummaryItem[];
};

type PublicHeroDetailsModalProps = {
  open: boolean;
  locale: 'RU' | 'EN';
  heroCard: PublicHeroCardItem | null;
  heroDetails: PublicHeroDetailsItem | null;
  heroVariants?: PublicHeroVariantsItem | null;
  heroExpertOpinions?: HeroExpertOpinionPublicResponseDto[];
  heroExpertOpinionsLoading?: boolean;
  heroExpertOpinionsError?: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onOpenRelatedHero?: (slug: string) => void;
};

type LimitBreakElementKey = 'nature' | 'ice' | 'fire' | 'dark' | 'holy';

type LimitBreakRequirementItem = {
  imageUrl: string;
  label: string;
  quantity?: number | null;
};

type LimitBreakRequirementRow = {
  title: string;
  subtitle: string;
  iconUrl: string;
  items: LimitBreakRequirementItem[];
};

type HeroClassKey =
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

type TroopSpecialtyKey =
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

type TroopMeta = {
  key: string;
  nameEn: string;
  nameRu: string;
  specialties: TroopSpecialtyKey;
  classes: [HeroClassKey, HeroClassKey];
};

type TroopSpecialtyContent = {
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
};

type TroopBonusSummary = {
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

type ManaOptimizationSpeedKey =
  | 'very_fast'
  | 'fast'
  | 'average'
  | 'slow'
  | 'very_slow'
  | 'changing_tides'
  | 'charge'
  | 'dancer'
  | 'magic'
  | 'slayer'
  | 'styx';

type ManaOptimizationTroopType = 'legendary_5' | 'epic_mana_15' | 'epic_mana_20';

type ManaOptimizationScenario = {
  id: string;
  speed: ManaOptimizationSpeedKey;
  fromTiles: string;
  toTiles: string;
  requiredManaBonus: number;
  stageLabelEn?: string;
  stageLabelRu?: string;
};

type ManaOptimizationSupportChip = {
  iconUrl?: string;
  text: string;
};

type ManaOptimizationLine = {
  key: string;
  minLevel: number;
  troopManaBonusPercent: number;
  supportChips: ManaOptimizationSupportChip[];
  fallbackText?: string | null;
};

type ManaOptimizationTroopCardItem = {
  key: string;
  name: string;
  imageUrl: string | null;
  classKeys?: HeroClassKey[];
};

type ManaOptimizationOption = {
  key: string;
  troopType: ManaOptimizationTroopType;
  troopItems: ManaOptimizationTroopCardItem[];
  stars: 4 | 5;
  lines: ManaOptimizationLine[];
  elementKey?: LimitBreakElementKey | null;
};

type ManaOptimizationScenarioView = ManaOptimizationScenario & {
  options: ManaOptimizationOption[];
};

type FamilyManaVariant = {
  bonusPercent: number;
  membersRequired: number;
  conditional?: boolean;
  customConditionKey?: 'bards_solo' | 'lunar_rabbit_pair';
};

type FamilyManaConfig = {
  defaultBonusPercent?: number;
  variants: FamilyManaVariant[];
};

type ManaOptimizationLevelBonus = {
  level: number;
  manaBonus: number;
};

type ManaOptimizationLegendaryTroopData = {
  troopKey: string;
  levels: ManaOptimizationLevelBonus[];
};

const LIMIT_BREAK_ASSET_BASE = '/heroes/limit-break';
const FIRST_LIMIT_BREAK_ICON = `${LIMIT_BREAK_ASSET_BASE}/power_grade_first_limit_broken.webp`;
const SECOND_LIMIT_BREAK_ICON = `${LIMIT_BREAK_ASSET_BASE}/power_grade_second_limit_broken.webp`;
const TROOPS_ASSET_BASE = '/heroes/troops/legendary';
const TROOP_SPECIALTY_ASSET_BASE = `${TROOPS_ASSET_BASE}/specialty`;
const HERO_ELEMENT_ASSET_BASE = '/heroes/elements/elements';
const HERO_CLASS_ASSET_BASE = '/heroes/elements/classes';
const HERO_STAR_ASSET = '/heroes/elements/star/symbol_star_big_small.webp';
const HERO_STATS_ASSET_BASE = '/heroes/elements/stats';
const TROOP_STAT_ICON_BY_KEY = {
  attack: `${HERO_STATS_ASSET_BASE}/stat_atk.webp`,
  defense: `${HERO_STATS_ASSET_BASE}/stat_defense.webp`,
  health: `${HERO_STATS_ASSET_BASE}/stat_health.webp`,
  mana: `${HERO_STATS_ASSET_BASE}/stat_mana_bonus.webp`,
} as const;

const TROOP_ELEMENT_PREFIX_BY_KEY: Record<LimitBreakElementKey, string> = {
  nature: 'green',
  ice: 'blue',
  fire: 'red',
  dark: 'purple',
  holy: 'yellow',
};

const TROOP_ELEMENT_ICON_BY_KEY: Record<LimitBreakElementKey, string> = {
  nature: `${HERO_ELEMENT_ASSET_BASE}/herald_green.webp`,
  ice: `${HERO_ELEMENT_ASSET_BASE}/herald_blue.webp`,
  fire: `${HERO_ELEMENT_ASSET_BASE}/herald_red.webp`,
  dark: `${HERO_ELEMENT_ASSET_BASE}/herald_purple.webp`,
  holy: `${HERO_ELEMENT_ASSET_BASE}/herald_yellow.webp`,
};

const TROOP_CLASS_ICON_BY_KEY: Record<HeroClassKey, string> = {
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

const TROOP_CLASS_LABELS: Record<HeroClassKey, { en: string; ru: string }> = {
  barbarian: { en: 'Barbarian', ru: 'Варвар' },
  cleric: { en: 'Cleric', ru: 'Церковник' },
  druid: { en: 'Druid', ru: 'Друид' },
  fighter: { en: 'Fighter', ru: 'Боец' },
  monk: { en: 'Monk', ru: 'Монах' },
  paladin: { en: 'Paladin', ru: 'Паладин' },
  ranger: { en: 'Ranger', ru: 'Охотник' },
  rogue: { en: 'Rogue', ru: 'Ассасин' },
  sorcerer: { en: 'Sorcerer', ru: 'Колдун' },
  wizard: { en: 'Wizard', ru: 'Волшебник' },
};

const COSTUME_ICON_URL = '/dictionary-icons/costume.png';
const MANA_TALENT_PLUS_TWO_CLASSES = new Set<HeroClassKey>([
  'cleric',
  'wizard',
  'paladin',
  'barbarian',
  'fighter',
  'rogue',
  'ranger',
]);
const MANA_TALENT_PLUS_FOUR_CLASSES = new Set<HeroClassKey>(['sorcerer', 'monk', 'druid']);

const MANA_OPTIMIZATION_SCENARIOS: ManaOptimizationScenario[] = [
  { id: 'very-fast-6_5-to-6', speed: 'very_fast', fromTiles: '6.5', toTiles: '6', requiredManaBonus: 9 },
  { id: 'fast-8-to-7', speed: 'fast', fromTiles: '8', toTiles: '7', requiredManaBonus: 15 },
  { id: 'average-10-to-9', speed: 'average', fromTiles: '10', toTiles: '9', requiredManaBonus: 12 },
  { id: 'average-10-to-8', speed: 'average', fromTiles: '10', toTiles: '8', requiredManaBonus: 25 },
  { id: 'slow-12-to-11', speed: 'slow', fromTiles: '12', toTiles: '11', requiredManaBonus: 10 },
  { id: 'slow-12-to-10', speed: 'slow', fromTiles: '12', toTiles: '10', requiredManaBonus: 20 },
  { id: 'very-slow-13_5-to-13', speed: 'very_slow', fromTiles: '13.5', toTiles: '13', requiredManaBonus: 4 },
  { id: 'very-slow-13_5-to-12', speed: 'very_slow', fromTiles: '13.5', toTiles: '12', requiredManaBonus: 13 },
  { id: 'very-slow-13_5-to-11', speed: 'very_slow', fromTiles: '13.5', toTiles: '11', requiredManaBonus: 23 },
  {
    id: 'changing-tides-wave-1-8-to-7',
    speed: 'changing_tides',
    fromTiles: '8',
    toTiles: '7',
    requiredManaBonus: 15,
    stageLabelEn: 'Wave 1',
    stageLabelRu: '\u0412\u043e\u043b\u043d\u0430 1',
  },
  {
    id: 'changing-tides-wave-1-8-to-6',
    speed: 'changing_tides',
    fromTiles: '8',
    toTiles: '6',
    requiredManaBonus: 34,
    stageLabelEn: 'Wave 1',
    stageLabelRu: '\u0412\u043e\u043b\u043d\u0430 1',
  },
  {
    id: 'changing-tides-wave-2-10-to-9',
    speed: 'changing_tides',
    fromTiles: '10',
    toTiles: '9',
    requiredManaBonus: 12,
    stageLabelEn: 'Wave 2',
    stageLabelRu: '\u0412\u043e\u043b\u043d\u0430 2',
  },
  {
    id: 'changing-tides-wave-2-10-to-8',
    speed: 'changing_tides',
    fromTiles: '10',
    toTiles: '8',
    requiredManaBonus: 25,
    stageLabelEn: 'Wave 2',
    stageLabelRu: '\u0412\u043e\u043b\u043d\u0430 2',
  },
  {
    id: 'charge-1-4_9-to-4',
    speed: 'charge',
    fromTiles: '4.9',
    toTiles: '4',
    requiredManaBonus: 23,
    stageLabelEn: 'Charge 1',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 1',
  },
  {
    id: 'charge-2-9_8-to-9',
    speed: 'charge',
    fromTiles: '9.8',
    toTiles: '9',
    requiredManaBonus: 9,
    stageLabelEn: 'Charge 2',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 2',
  },
  {
    id: 'charge-2-9_8-to-8',
    speed: 'charge',
    fromTiles: '9.8',
    toTiles: '8',
    requiredManaBonus: 23,
    stageLabelEn: 'Charge 2',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 2',
  },
  {
    id: 'charge-3-14_7-to-14',
    speed: 'charge',
    fromTiles: '14.7',
    toTiles: '14',
    requiredManaBonus: 6,
    stageLabelEn: 'Charge 3',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 3',
  },
  {
    id: 'charge-3-14_7-to-13',
    speed: 'charge',
    fromTiles: '14.7',
    toTiles: '13',
    requiredManaBonus: 14,
    stageLabelEn: 'Charge 3',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 3',
  },
  {
    id: 'charge-3-14_7-to-12',
    speed: 'charge',
    fromTiles: '14.7',
    toTiles: '12',
    requiredManaBonus: 23,
    stageLabelEn: 'Charge 3',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 3',
  },
  { id: 'dancer-7-to-6', speed: 'dancer', fromTiles: '7', toTiles: '6', requiredManaBonus: 17 },
  {
    id: 'magic-1-5_5-to-5',
    speed: 'magic',
    fromTiles: '5.5',
    toTiles: '5',
    requiredManaBonus: 11,
    stageLabelEn: 'Charge 1',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 1',
  },
  {
    id: 'magic-2-12_3-to-12',
    speed: 'magic',
    fromTiles: '12.3',
    toTiles: '12',
    requiredManaBonus: 3,
    stageLabelEn: 'Charge 2',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 2',
  },
  {
    id: 'magic-2-12_3-to-11',
    speed: 'magic',
    fromTiles: '12.3',
    toTiles: '11',
    requiredManaBonus: 12,
    stageLabelEn: 'Charge 2',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 2',
  },
  {
    id: 'magic-2-12_3-to-10',
    speed: 'magic',
    fromTiles: '12.3',
    toTiles: '10',
    requiredManaBonus: 23,
    stageLabelEn: 'Charge 2',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 2',
  },
  { id: 'slayer-11-to-10', speed: 'slayer', fromTiles: '11', toTiles: '10', requiredManaBonus: 10 },
  { id: 'slayer-11-to-9', speed: 'slayer', fromTiles: '11', toTiles: '9', requiredManaBonus: 23 },
  {
    id: 'styx-1-6-to-5',
    speed: 'styx',
    fromTiles: '6',
    toTiles: '5',
    requiredManaBonus: 20,
    stageLabelEn: 'Charge 1',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 1',
  },
  {
    id: 'styx-2-9-to-8',
    speed: 'styx',
    fromTiles: '9',
    toTiles: '8',
    requiredManaBonus: 13,
    stageLabelEn: 'Charge 2',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 2',
  },
  {
    id: 'styx-2-9-to-7',
    speed: 'styx',
    fromTiles: '9',
    toTiles: '7',
    requiredManaBonus: 29,
    stageLabelEn: 'Charge 2',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 2',
  },
  {
    id: 'styx-3-12-to-11',
    speed: 'styx',
    fromTiles: '12',
    toTiles: '11',
    requiredManaBonus: 10,
    stageLabelEn: 'Charge 3',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 3',
  },
  {
    id: 'styx-3-12-to-10',
    speed: 'styx',
    fromTiles: '12',
    toTiles: '10',
    requiredManaBonus: 20,
    stageLabelEn: 'Charge 3',
    stageLabelRu: '\u0417\u0430\u0440\u044f\u0434 3',
  },
];

const LEGENDARY_MANA_LEVELS_BY_TROOP_KEY: Record<string, ManaOptimizationLegendaryTroopData> = {
  fighter: { troopKey: 'fighter', levels: [{ level: 1, manaBonus: 5 }, { level: 10, manaBonus: 7 }, { level: 20, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  cleric: { troopKey: 'cleric', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 20, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  barbarian: { troopKey: 'barbarian', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  druid: { troopKey: 'druid', levels: [{ level: 1, manaBonus: 5 }, { level: 10, manaBonus: 7 }, { level: 20, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  monk: { troopKey: 'monk', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  sorcerer: { troopKey: 'sorcerer', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  ranger: { troopKey: 'ranger', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 20, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  wizard: { troopKey: 'wizard', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 20, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  rogue: { troopKey: 'rogue', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  paladin: { troopKey: 'paladin', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  arcane_hunter: { troopKey: 'arcane_hunter', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  master_assassin: { troopKey: 'master_assassin', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  devoted_knight: { troopKey: 'devoted_knight', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  divine_cleric: { troopKey: 'divine_cleric', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  tree_spirit: { troopKey: 'tree_spirit', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  furious_monk: { troopKey: 'furious_monk', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  hunter_mage: { troopKey: 'hunter_mage', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 29, manaBonus: 11 }] },
  serene_brute: { troopKey: 'serene_brute', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  shaman_wizard: { troopKey: 'shaman_wizard', levels: [{ level: 1, manaBonus: 5 }, { level: 9, manaBonus: 7 }, { level: 19, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
  swashbuckler: { troopKey: 'swashbuckler', levels: [{ level: 1, manaBonus: 5 }, { level: 10, manaBonus: 7 }, { level: 20, manaBonus: 9 }, { level: 28, manaBonus: 11 }] },
};

const EPIC_MANA_15_LEVELS: ManaOptimizationLevelBonus[] = [
  { level: 1, manaBonus: 5 },
  { level: 5, manaBonus: 7 },
  { level: 11, manaBonus: 9 },
  { level: 17, manaBonus: 11 },
  { level: 23, manaBonus: 13 },
  { level: 29, manaBonus: 15 },
];

const EPIC_MANA_20_LEVELS: ManaOptimizationLevelBonus[] = [
  { level: 1, manaBonus: 5 },
  { level: 5, manaBonus: 8 },
  { level: 11, manaBonus: 11 },
  { level: 17, manaBonus: 14 },
  { level: 23, manaBonus: 17 },
  { level: 29, manaBonus: 20 },
];

const EPIC_MANA_20_CYCLOPS_LEVELS: ManaOptimizationLevelBonus[] = [
  { level: 1, manaBonus: 5 },
  { level: 5, manaBonus: 8 },
  { level: 12, manaBonus: 11 },
  { level: 16, manaBonus: 14 },
  { level: 23, manaBonus: 17 },
  { level: 27, manaBonus: 20 },
];

const TROOP_CATALOG: TroopMeta[] = [
  {
    key: 'master_assassin',
    nameEn: 'Battle Master Assassin',
    nameRu: 'Боевой мастер ассасинов',
    specialties: 'status_effect_attack_addition_legendary_troop',
    classes: ['rogue', 'fighter'],
  },
  {
    key: 'barbarian',
    nameEn: 'Majestic Minotaur',
    nameRu: 'Величественный минотавр',
    specialties: 'status_effect_attack_addition_legendary_troop',
    classes: ['barbarian', 'druid'],
  },
  {
    key: 'furious_monk',
    nameEn: 'Furious Monk',
    nameRu: 'Яростный монах',
    specialties: 'extra_heal_on_heal_legendary_troop',
    classes: ['monk', 'barbarian'],
  },
  {
    key: 'cleric',
    nameEn: 'Unwavering Cleric',
    nameRu: 'Стойкий церковник',
    specialties: 'extra_heal_on_heal_legendary_troop',
    classes: ['cleric', 'fighter'],
  },
  {
    key: 'devoted_knight',
    nameEn: 'Devoted Knight',
    nameRu: 'Приверженный рыцарь',
    specialties: 'debuff_damage_reduction_legendary_troop',
    classes: ['paladin', 'cleric'],
  },
  {
    key: 'druid',
    nameEn: 'Enchanted Ent',
    nameRu: 'Очарованный энт',
    specialties: 'debuff_damage_reduction_legendary_troop',
    classes: ['druid', 'barbarian'],
  },
  {
    key: 'hunter_mage',
    nameEn: 'Hunter Mage',
    nameRu: 'Охотник-маг',
    specialties: 'status_effect_defense_reduction_legendary_troop',
    classes: ['sorcerer', 'ranger'],
  },
  {
    key: 'fighter',
    nameEn: 'Unstoppable Fighter',
    nameRu: 'Неудержимый боец',
    specialties: 'status_effect_defense_reduction_legendary_troop',
    classes: ['fighter', 'cleric'],
  },
  {
    key: 'divine_cleric',
    nameEn: 'Divine Cleric',
    nameRu: 'Божественный церковник',
    specialties: 'resist_debuffs_legendary_troop',
    classes: ['cleric', 'paladin'],
  },
  {
    key: 'monk',
    nameEn: 'Mighty Monk',
    nameRu: 'Могучий монах',
    specialties: 'resist_debuffs_legendary_troop',
    classes: ['monk', 'sorcerer'],
  },
  {
    key: 'paladin',
    nameEn: 'Elite Knight',
    nameRu: 'Элитный рыцарь',
    specialties: 'status_effect_defense_addition_legendary_troop',
    classes: ['paladin', 'rogue'],
  },
  {
    key: 'tree_spirit',
    nameEn: 'Enlightened Tree Spirit',
    nameRu: 'Просвещенный дух деревьев',
    specialties: 'status_effect_defense_addition_legendary_troop',
    classes: ['druid', 'wizard'],
  },
  {
    key: 'ranger',
    nameEn: 'Eternal Hunter',
    nameRu: 'Вечный охотник',
    specialties: 'status_effect_attack_reduction_legendary_troop',
    classes: ['ranger', 'wizard'],
  },
  {
    key: 'swashbuckler',
    nameEn: 'Swashbuckler Fighter',
    nameRu: 'Боец-головорез',
    specialties: 'status_effect_attack_reduction_legendary_troop',
    classes: ['fighter', 'rogue'],
  },
  {
    key: 'arcane_hunter',
    nameEn: 'Arcane Hunter',
    nameRu: 'Тайный охотник',
    specialties: 'critical_modifier_legendary_troop',
    classes: ['ranger', 'sorcerer'],
  },
  {
    key: 'rogue',
    nameEn: 'Unseen Assassin',
    nameRu: 'Невидимый убийца',
    specialties: 'critical_modifier_legendary_troop',
    classes: ['rogue', 'paladin'],
  },
  {
    key: 'sorcerer',
    nameEn: 'Royal Sorcerer',
    nameRu: 'Королевский колдун',
    specialties: 'special_damage_reduction_legendary_troop',
    classes: ['sorcerer', 'monk'],
  },
  {
    key: 'shaman_wizard',
    nameEn: 'Shaman Wizard',
    nameRu: 'Шаман-волшебник',
    specialties: 'special_damage_reduction_legendary_troop',
    classes: ['wizard', 'druid'],
  },
  {
    key: 'wizard',
    nameEn: 'Eldest Wizard',
    nameRu: 'Старейший маг',
    specialties: 'increase_special_damage_legendary_troop',
    classes: ['wizard', 'ranger'],
  },
  {
    key: 'serene_brute',
    nameEn: 'Serene Brute',
    nameRu: 'Безмятежный дикарь',
    specialties: 'increase_special_damage_legendary_troop',
    classes: ['barbarian', 'monk'],
  },
];

const TROOP_SPECIALTY_CONTENT: Record<TroopSpecialtyKey, TroopSpecialtyContent> = {
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

const TROOP_BONUS_SUMMARIES: Record<string, TroopBonusSummary> = {
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

const LIMIT_BREAK_REQUIREMENTS: Record<LimitBreakElementKey, Omit<LimitBreakRequirementRow, 'title' | 'subtitle'>[]> = {
  nature: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_nature.png`, label: 'Legendary Nature Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_nature.png`, label: 'Epic Nature Aether', quantity: 20 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_nature.png`, label: 'Rare Nature Aether', quantity: 35 },
      ],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/chainmail_shirt.png`, label: 'Chainmail Shirt', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/sturdy_shield.png`, label: 'Sturdy Shield', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/tall_boots.png`, label: 'Tall Boots', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 10 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_nature.png`, label: 'Legendary Nature Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_nature.png`, label: 'Epic Nature Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_nature.png`, label: 'Rare Nature Aether', quantity: 10 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/mysterious_tonic.png`, label: 'Mysterious Tonic', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_nature.png`, label: 'Legendary Nature Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_nature.png`, label: 'Epic Nature Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_nature.png`, label: 'Rare Nature Aether', quantity: 5 },
      ],
    },
  ],
  ice: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_ice.png`, label: 'Legendary Ice Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_ice.png`, label: 'Epic Ice Aether', quantity: 20 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_ice.png`, label: 'Rare Ice Aether', quantity: 35 },
      ],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/battle_manual.png`, label: 'Battle Manual', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/scabbard.png`, label: 'Scabbard', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/warm_cape.png`, label: 'Warm Cape', quantity: 1 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 10 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_ice.png`, label: 'Legendary Ice Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_ice.png`, label: 'Epic Ice Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_ice.png`, label: 'Rare Ice Aether', quantity: 10 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/ascension_elite_farsight_telescope.png`, label: 'Farsight Telescope', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_ice.png`, label: 'Legendary Ice Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_ice.png`, label: 'Epic Ice Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_ice.png`, label: 'Rare Ice Aether', quantity: 5 },
      ],
    },
  ],
  fire: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_fire.png`, label: 'Legendary Fire Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_fire.png`, label: 'Epic Fire Aether', quantity: 20 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_fire.png`, label: 'Rare Fire Aether', quantity: 35 },
      ],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/chainmail_shirt.png`, label: 'Chainmail Shirt', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/hidden_blade.png`, label: 'Hidden Blade', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/scabbard.png`, label: 'Scabbard', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 10 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_fire.png`, label: 'Legendary Fire Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_fire.png`, label: 'Epic Fire Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_fire.png`, label: 'Rare Fire Aether', quantity: 10 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/mystic_rings.png`, label: 'Mystic Rings', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_fire.png`, label: 'Legendary Fire Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_fire.png`, label: 'Epic Fire Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_fire.png`, label: 'Rare Fire Aether', quantity: 5 },
      ],
    },
  ],
  dark: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_dark.png`, label: 'Legendary Dark Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_dark.png`, label: 'Epic Dark Aether', quantity: 20 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_dark.png`, label: 'Rare Dark Aether', quantity: 35 },
      ],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/battle_manual.png`, label: 'Battle Manual', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/tall_boots.png`, label: 'Tall Boots', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/trap_tools.png`, label: 'Trap Tools', quantity: 1 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 10 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_dark.png`, label: 'Legendary Dark Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_dark.png`, label: 'Epic Dark Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_dark.png`, label: 'Rare Dark Aether', quantity: 10 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/royal_tabard.png`, label: 'Royal Tabard', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_dark.png`, label: 'Legendary Dark Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_dark.png`, label: 'Epic Dark Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_dark.png`, label: 'Rare Dark Aether', quantity: 5 },
      ],
    },
  ],
  holy: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_holy.png`, label: 'Legendary Holy Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_holy.png`, label: 'Epic Holy Aether', quantity: 20 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_holy.png`, label: 'Rare Holy Aether', quantity: 35 },
      ],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/battle_manual.png`, label: 'Battle Manual', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/orb_of_magic.png`, label: 'Orb of Magic', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/tall_boots.png`, label: 'Tall Boots', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 10 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_holy.png`, label: 'Legendary Holy Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_holy.png`, label: 'Epic Holy Aether', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_holy.png`, label: 'Rare Holy Aether', quantity: 10 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/poison_darts.png`, label: 'Poison Darts', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_holy.png`, label: 'Legendary Holy Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_holy.png`, label: 'Epic Holy Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_holy.png`, label: 'Rare Holy Aether', quantity: 5 },
      ],
    },
  ],
};

const COSTUME_LIMIT_BREAK_REQUIREMENTS: Record<
  LimitBreakElementKey,
  Omit<LimitBreakRequirementRow, 'title' | 'subtitle'>[]
> = {
  nature: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [{ imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_nature.png`, label: 'Rare Nature Aether', quantity: 5 }],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/chainmail_shirt.png`, label: 'Chainmail Shirt', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/sturdy_shield.png`, label: 'Sturdy Shield', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/tall_boots.png`, label: 'Tall Boots', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_nature.png`, label: 'Rare Nature Aether', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/mysterious_tonic.png`, label: 'Mysterious Tonic', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_nature.png`, label: 'Legendary Nature Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_nature.png`, label: 'Epic Nature Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_nature.png`, label: 'Rare Nature Aether', quantity: 5 },
      ],
    },
  ],
  ice: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [{ imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_ice.png`, label: 'Rare Ice Aether', quantity: 5 }],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/battle_manual.png`, label: 'Battle Manual', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/scabbard.png`, label: 'Scabbard', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/warm_cape.png`, label: 'Warm Cape', quantity: 1 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_ice.png`, label: 'Rare Ice Aether', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/ascension_elite_farsight_telescope.png`, label: 'Farsight Telescope', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_ice.png`, label: 'Legendary Ice Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_ice.png`, label: 'Epic Ice Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_ice.png`, label: 'Rare Ice Aether', quantity: 5 },
      ],
    },
  ],
  fire: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [{ imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_fire.png`, label: 'Rare Fire Aether', quantity: 5 }],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/chainmail_shirt.png`, label: 'Chainmail Shirt', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/hidden_blade.png`, label: 'Hidden Blade', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/scabbard.png`, label: 'Scabbard', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_fire.png`, label: 'Rare Fire Aether', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/mystic_rings.png`, label: 'Mystic Rings', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_fire.png`, label: 'Legendary Fire Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_fire.png`, label: 'Epic Fire Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_fire.png`, label: 'Rare Fire Aether', quantity: 5 },
      ],
    },
  ],
  dark: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [{ imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_dark.png`, label: 'Rare Dark Aether', quantity: 5 }],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/battle_manual.png`, label: 'Battle Manual', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/tall_boots.png`, label: 'Tall Boots', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/trap_tools.png`, label: 'Trap Tools', quantity: 1 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_dark.png`, label: 'Rare Dark Aether', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/royal_tabard.png`, label: 'Royal Tabard', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_dark.png`, label: 'Legendary Dark Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_dark.png`, label: 'Epic Dark Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_dark.png`, label: 'Rare Dark Aether', quantity: 5 },
      ],
    },
  ],
  holy: [
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [{ imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_holy.png`, label: 'Rare Holy Aether', quantity: 5 }],
    },
    {
      iconUrl: FIRST_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/battle_manual.png`, label: 'Battle Manual', quantity: 5 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/orb_of_magic.png`, label: 'Orb of Magic', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/tall_boots.png`, label: 'Tall Boots', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary.png`, label: 'Alpha Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_holy.png`, label: 'Rare Holy Aether', quantity: 5 },
      ],
    },
    {
      iconUrl: SECOND_LIMIT_BREAK_ICON,
      items: [
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/poison_darts.png`, label: 'Poison Darts', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_legendary_holy.png`, label: 'Legendary Holy Aether', quantity: 1 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_epic_holy.png`, label: 'Epic Holy Aether', quantity: 3 },
        { imageUrl: `${LIMIT_BREAK_ASSET_BASE}/aether_rare_holy.png`, label: 'Rare Holy Aether', quantity: 5 },
      ],
    },
  ],
};

function formatDate(value: string | null | undefined, locale: 'RU' | 'EN', fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'RU' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDateInPastOrToday(value: string | null | undefined): boolean {
  const parsed = parseIsoDate(value);
  if (!parsed) return false;

  parsed.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed.getTime() <= today.getTime();
}

function relationName(value: string | null | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

function getPreviewAccentClass(elementName: string | null | undefined) {
  const normalized = (elementName ?? '').trim().toLocaleLowerCase();

  if (normalized.includes('ice') || normalized.includes('лед') || normalized.includes('лёд')) {
    return 'border-sky-300/60 bg-gradient-to-b from-sky-400/72 via-sky-400/28 to-sky-950/12 shadow-[0_0_28px_rgba(56,189,248,0.32)]';
  }

  if (normalized.includes('fire') || normalized.includes('огонь')) {
    return 'border-rose-300/60 bg-gradient-to-b from-rose-400/72 via-rose-400/28 to-red-950/12 shadow-[0_0_28px_rgba(251,113,133,0.3)]';
  }

  if (normalized.includes('nature') || normalized.includes('природа')) {
    return 'border-emerald-300/60 bg-gradient-to-b from-emerald-400/72 via-emerald-400/28 to-emerald-950/12 shadow-[0_0_28px_rgba(52,211,153,0.3)]';
  }

  if (normalized.includes('dark') || normalized.includes('тьма')) {
    return 'border-violet-300/60 bg-gradient-to-b from-violet-400/68 via-violet-400/28 to-purple-950/16 shadow-[0_0_28px_rgba(167,139,250,0.3)]';
  }

  if (normalized.includes('holy') || normalized.includes('свят')) {
    return 'border-amber-300/70 bg-gradient-to-b from-amber-300/70 via-amber-300/28 to-yellow-950/10 shadow-[0_0_28px_rgba(251,191,36,0.28)]';
  }

  return 'border-[var(--border)] bg-gradient-to-b from-[var(--surface-strong)] to-[var(--surface)]';
}

function formatCostumeVariantName(name: string | null | undefined, costumeIndex?: number | null) {
  const resolvedName = relationName(name, '');
  if (!resolvedName) {
    return costumeIndex != null ? `C${costumeIndex}` : '';
  }

  return costumeIndex != null ? `${resolvedName} C${costumeIndex}` : resolvedName;
}

function formatCostumeBonusContent(
  locale: 'RU' | 'EN',
  bonus:
    | {
        attack?: number | null;
        armor?: number | null;
        hp?: number | null;
        mana?: number | null;
      }
    | null
    | undefined,
) {
  if (!bonus) {
    return '';
  }

  const lines =
    locale === 'RU'
      ? [
          `Бонус к атаке: +${bonus.attack ?? 0}%`,
          `Бонус к защите: +${bonus.armor ?? 0}%`,
          `Бонус к здоровью: +${bonus.hp ?? 0}%`,
          `Бонус к мане: +${bonus.mana ?? 0}%`,
        ]
      : [
          `Attack Bonus: +${bonus.attack ?? 0}%`,
          `Defence Bonus: +${bonus.armor ?? 0}%`,
          `Health Bonus: +${bonus.hp ?? 0}%`,
          `Mana Bonus: +${bonus.mana ?? 0}%`,
        ];

  return lines.join('\n');
}

function HeroAvailabilityInfoCard({
  title,
  imageUrl,
  tooltipContent,
  statusText,
}: {
  title: string;
  imageUrl: string;
  tooltipContent: string;
  statusText: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">{title}</div>
        <HeroInfoPopover label={title} content={tooltipContent} />
      </div>
      <div className="mt-3 text-sm leading-6 text-[var(--foreground-soft)]">{statusText}</div>
      <div className="mt-4 flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} className="h-24 w-24 object-contain" />
      </div>
    </div>
  );
}

function StackedReferenceRow({
  label,
  value,
  imageUrl,
  tooltipContent,
  imageSize = 40,
  showImage = true,
  chromelessImage = true,
  labelClassName = '',
  valueClassName = '',
  hideValue = false,
}: {
  label: string;
  value: string;
  imageUrl?: string | null;
  tooltipContent?: string | null;
  imageSize?: number;
  showImage?: boolean;
  chromelessImage?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  hideValue?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className={`text-base font-bold text-[var(--foreground)] ${labelClassName}`}>{label}:</div>
      <div className="flex min-w-0 items-center gap-3 text-[var(--foreground)]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showImage ? (
            <DictionaryMiniIcon
              imageUrl={imageUrl}
              label={value}
              size={imageSize}
              chromeless={chromelessImage}
              fallbackToLetter={false}
              className="self-center"
            />
          ) : null}
          {!hideValue ? (
            <span
              className={`min-w-0 whitespace-nowrap text-[clamp(0.82rem,1vw,1rem)] leading-tight ${valueClassName}`}
            >
              {value}
            </span>
          ) : null}
        </div>
        {tooltipContent ? <HeroInfoPopover label={label} content={tooltipContent} /> : null}
      </div>
    </div>
  );
}

function CopyHeroLinkIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none">
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="none">
      <rect x="5" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function AccordionChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-5 w-5 text-[var(--foreground-muted)] transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function resolveLimitBreakElementKey(value: string | null | undefined): LimitBreakElementKey | null {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  if (normalized.includes('nature') || normalized.includes('природ')) {
    return 'nature';
  }

  if (normalized.includes('ice') || normalized.includes('лёд') || normalized.includes('лед')) {
    return 'ice';
  }

  if (normalized.includes('fire') || normalized.includes('огонь')) {
    return 'fire';
  }

  if (normalized.includes('dark') || normalized.includes('тьм')) {
    return 'dark';
  }

  if (normalized.includes('holy') || normalized.includes('свят')) {
    return 'holy';
  }

  return null;
}

function resolveHeroClassKey(value: string | null | undefined): HeroClassKey | null {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  if (normalized.includes('barbarian') || normalized.includes('варвар')) return 'barbarian';
  if (normalized.includes('cleric') || normalized.includes('церков')) return 'cleric';
  if (normalized.includes('druid') || normalized.includes('друид')) return 'druid';
  if (normalized.includes('fighter') || normalized.includes('боец')) return 'fighter';
  if (normalized.includes('monk') || normalized.includes('монах')) return 'monk';
  if (normalized.includes('paladin') || normalized.includes('палад')) return 'paladin';
  if (normalized.includes('ranger') || normalized.includes('охот')) return 'ranger';
  if (normalized.includes('rogue') || normalized.includes('ассас') || normalized.includes('разбой')) return 'rogue';
  if (normalized.includes('sorcerer') || normalized.includes('колдун') || normalized.includes('маг')) return 'sorcerer';
  if (normalized.includes('wizard') || normalized.includes('волшеб')) return 'wizard';

  return null;
}

function resolveHeroClassKeyFromImageUrl(value: string | null | undefined): HeroClassKey | null {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  for (const classKey of Object.keys(TROOP_CLASS_ICON_BY_KEY) as HeroClassKey[]) {
    if (normalized.includes(`/${classKey}.`) || normalized.includes(`\\${classKey}.`) || normalized.endsWith(`${classKey}.png`)) {
      return classKey;
    }
  }

  return null;
}

function resolveManaSpeedKey(value: string | null | undefined): ManaOptimizationSpeedKey | null {
  const normalized = (value ?? '').trim().toLocaleLowerCase();

  if (
    normalized.includes('changing tides') ||
    normalized.includes('changingtides') ||
    normalized.includes('\u0432\u043e\u043b\u043d')
  ) {
    return 'changing_tides';
  }

  if (normalized.includes('charge') || normalized.includes('\u0437\u0430\u0440\u044f\u0434')) {
    return 'charge';
  }

  if (normalized.includes('dancer') || normalized.includes('\u0442\u0430\u043d\u0446')) {
    return 'dancer';
  }

  if (normalized.includes('magic') || normalized.includes('\u043c\u0430\u0433')) {
    return 'magic';
  }

  if (normalized.includes('slayer') || normalized.includes('\u0441\u043b\u0435\u0439')) {
    return 'slayer';
  }

  if (normalized.includes('styx') || normalized.includes('\u0441\u0442\u0438\u043a\u0441')) {
    return 'styx';
  }

  if (
    normalized.includes('very slow') ||
    normalized.includes('veryslow') ||
    normalized.includes('\u043e\u0447\u0435\u043d\u044c \u043c\u0435\u0434\u043b')
  ) {
    return 'very_slow';
  }

  if (
    normalized.includes('very fast') ||
    normalized.includes('veryfast') ||
    normalized.includes('очень быстр')
  ) {
    return 'very_fast';
  }

  if (normalized.includes('fast') || normalized.includes('быстр')) {
    return 'fast';
  }

  if (
    normalized.includes('average') ||
    normalized.includes('medium') ||
    normalized.includes('avg') ||
    normalized.includes('средн')
  ) {
    return 'average';
  }

  if (normalized.includes('slow') || normalized.includes('медлен')) {
    return 'slow';
  }

  return null;
}

function getManaTalentBonus(classKey: HeroClassKey | null): 0 | 2 | 4 {
  if (!classKey) {
    return 0;
  }

  if (MANA_TALENT_PLUS_FOUR_CLASSES.has(classKey)) {
    return 4;
  }

  if (MANA_TALENT_PLUS_TWO_CLASSES.has(classKey)) {
    return 2;
  }

  return 0;
}

function getTroopElementFrameClass(elementKey: LimitBreakElementKey | null | undefined): string {
  switch (elementKey) {
    case 'fire':
      return 'border-red-400/45 shadow-[0_0_0_1px_rgba(248,113,113,0.18)]';
    case 'ice':
      return 'border-sky-400/45 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]';
    case 'nature':
      return 'border-emerald-400/45 shadow-[0_0_0_1px_rgba(52,211,153,0.18)]';
    case 'dark':
      return 'border-fuchsia-400/45 shadow-[0_0_0_1px_rgba(232,121,249,0.18)]';
    case 'holy':
      return 'border-amber-300/55 shadow-[0_0_0_1px_rgba(252,211,77,0.2)]';
    default:
      return 'border-[var(--border)]';
  }
}

function findMinimumTroopLevelForManaThreshold(
  levels: ManaOptimizationLevelBonus[],
  requiredManaBonus: number,
  passiveManaBonus: number,
): number | null {
  const neededFromTroop = Math.max(requiredManaBonus - passiveManaBonus, 0);

  for (const item of levels) {
    if (item.manaBonus >= neededFromTroop) {
      return item.level;
    }
  }

  return null;
}

function findManaBonusForTroopLevel(levels: ManaOptimizationLevelBonus[], level: number): number {
  return levels.find((item) => item.level === level)?.manaBonus ?? 0;
}

function normalizeFamilyIdentifier(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function resolveFamilyManaConfig(
  familyName: string | null | undefined,
  heroSlug: string | null | undefined,
): FamilyManaConfig | null {
  const normalizedFamily = normalizeFamilyIdentifier(familyName);
  const normalizedSlug = (heroSlug ?? '').trim().toLowerCase();

  if (
    normalizedFamily.includes('the institute') ||
    normalizedFamily.includes('институт')
  ) {
    return {
      defaultBonusPercent: 5,
      variants: [
        { bonusPercent: 9, membersRequired: 2 },
        { bonusPercent: 13, membersRequired: 3 },
      ],
    };
  }

  if (
    normalizedFamily.includes('wonderland') ||
    normalizedFamily.includes('страна чудес')
  ) {
    return {
      variants: [
        { bonusPercent: 2, membersRequired: 2, conditional: true },
        { bonusPercent: 4, membersRequired: 3, conditional: true },
        { bonusPercent: 7, membersRequired: 4, conditional: true },
        { bonusPercent: 12, membersRequired: 5, conditional: true },
      ],
    };
  }

  if (
    normalizedFamily.includes('pirates') ||
    normalizedFamily.includes('пираты')
  ) {
    return {
      variants: [
        { bonusPercent: 2, membersRequired: 2, conditional: true },
        { bonusPercent: 4, membersRequired: 3, conditional: true },
        { bonusPercent: 7, membersRequired: 4, conditional: true },
        { bonusPercent: 12, membersRequired: 5, conditional: true },
      ],
    };
  }

  if (
    normalizedFamily.includes('sakura') ||
    normalizedFamily.includes('сакура')
  ) {
    return {
      defaultBonusPercent: 3,
      variants: [
        { bonusPercent: 6, membersRequired: 2 },
        { bonusPercent: 9, membersRequired: 3 },
        { bonusPercent: 11, membersRequired: 4 },
        { bonusPercent: 13, membersRequired: 5 },
      ],
    };
  }

  if (
    normalizedFamily.includes('morlovia') ||
    normalizedFamily.includes('морловия')
  ) {
    return {
      defaultBonusPercent: 3,
      variants: [
        { bonusPercent: 6, membersRequired: 2 },
        { bonusPercent: 9, membersRequired: 3 },
      ],
    };
  }

  if (
    normalizedFamily.includes('legends 2017') ||
    normalizedFamily.includes('легенды 2017') ||
    normalizedFamily.includes('легенд 2017') ||
    normalizedFamily.includes('семья легенд 2017')
  ) {
    return {
      defaultBonusPercent: 5,
      variants: [
        { bonusPercent: 10, membersRequired: 2 },
        { bonusPercent: 15, membersRequired: 3 },
      ],
    };
  }

  if (
    normalizedFamily.includes('bard') ||
    normalizedFamily.includes('бард')
  ) {
    return {
      variants: [
        { bonusPercent: 5, membersRequired: 1, conditional: true, customConditionKey: 'bards_solo' },
      ],
    };
  }

  if (normalizedSlug === 'xiaotu' || normalizedSlug === 'xiaotu-c1') {
    return {
      variants: [
        { bonusPercent: 5, membersRequired: 2, conditional: true, customConditionKey: 'lunar_rabbit_pair' },
      ],
    };
  }

  return null;
}

function resolveLimitBreakItemImageUrl(
  originalImageUrl: string,
  elementKey?: LimitBreakElementKey | null,
): string {
  const fileName = originalImageUrl.split('/').pop() ?? originalImageUrl;

  const fileMap: Record<string, string> = {
    'aether_legendary.png': 'aether_legendary.webp',
    'aether_epic_dark.png': 'aether_epic_dark.webp',
    'aether_epic_fire.png': 'aether_epic_fire.webp',
    'aether_epic_holy.png': 'aether_epic_holy.webp',
    'aether_epic_ice.png': 'aether_epic_ice.webp',
    'aether_epic_nature.png': 'aether_epic_nature.webp',
    'aether_legendary_dark.png': 'aether_legendary_dark.webp',
    'aether_legendary_fire.png': 'aether_legendary_fire.webp',
    'aether_legendary_holy.png': 'aether_legendary_holy.webp',
    'aether_legendary_ice.png': 'aether_legendary_ice.webp',
    'aether_legendary_nature.png': 'aether_legendary_nature.webp',
    'aether_rare_dark.png': 'aether_rare_dark.webp',
    'aether_rare_fire.png': 'aether_rare_fire.webp',
    'aether_rare_holy.png': 'aether_rare_holy.webp',
    'aether_rare_ice.png': 'aether_rare_ice.webp',
    'aether_rare_nature.png': 'aether_rare_nature.webp',
    'battle_manual.png':
      elementKey === 'dark' || elementKey === 'holy' || elementKey === 'ice'
        ? 'dark_holy_ice_battle_manual_rare.webp'
        : 'battle_manual_rare.webp',
    'chainmail_shirt.png':
      elementKey === 'nature' || elementKey === 'fire'
        ? 'nature_fire_chainmail_shirt_rare.webp'
        : 'chainmail_shirt_rare.webp',
    'royal_tabard.png': 'dark_royal_tabard_epic.webp',
    'trap_tools.png': 'dark_trap_tools_rare.webp',
    'mystic_rings.png': 'fire_mystic_rings_epic.webp',
    'hidden_blade.png': 'hidden_blade_rare.webp',
    'orb_of_magic.png': 'holy_orb_of_magic_rare.webp',
    'poison_darts.png': 'holy_poison_darts_epic.webp',
    'ascension_elite_farsight_telescope.png': 'ice_farsight_telescope_epic.webp',
    'warm_cape.png': 'ice_warm_cape_rare.webp',
    'mysterious_tonic.png': 'nature_mysterious_tonic_epic.webp',
    'sturdy_shield.png': 'nature_sturdy_shield_rare.webp',
    'scabbard.png':
      elementKey === 'fire' || elementKey === 'ice'
        ? 'fire_ice_scabbard_rare.webp'
        : 'scabbard_rare.webp',
    'tall_boots.png':
      elementKey === 'nature' || elementKey === 'dark' || elementKey === 'holy'
        ? 'nature_dark_holy_tall_boots_rare.webp'
        : 'tall_boots_rare.webp',
  };

  const resolvedFileName = fileMap[fileName] ?? fileName;
  return `${LIMIT_BREAK_ASSET_BASE}/${resolvedFileName}`;
}

function resolveLimitBreakItemStarCount(imageUrl: string): number | null {
  const normalized = imageUrl.toLocaleLowerCase();

  if (normalized.includes('legendary')) return 5;
  if (normalized.includes('epic')) return 4;
  if (normalized.includes('rare')) return 3;

  return null;
}

function resolveLimitBreakItemImageClassName(imageUrl: string): string {
  const normalized = imageUrl.toLocaleLowerCase();

  if (!normalized.includes('aether_')) {
    return 'h-full w-full object-contain';
  }

  if (normalized.includes('legendary')) {
    return 'h-full w-full object-contain';
  }

  if (normalized.includes('epic')) {
    return 'h-[75%] w-[75%] object-contain';
  }

  if (normalized.includes('rare')) {
    return 'h-[50%] w-[50%] object-contain';
  }

  return 'h-full w-full object-contain';
}

function buildTroopSpecialtyTooltip(troop: TroopMeta, locale: 'RU' | 'EN'): string {
  const content = TROOP_SPECIALTY_CONTENT[troop.specialties];
  const title = locale === 'RU' ? content.titleRu : content.titleEn;
  const description = locale === 'RU' ? content.descriptionRu : content.descriptionEn;

  return `${title}\n\n${description}`;
}

function TroopBonusStatCard({
  iconUrl,
  label,
  value,
}: {
  iconUrl: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 text-center sm:rounded-2xl sm:p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconUrl} alt={label} className="mx-auto h-7 w-7 object-contain sm:h-10 sm:w-10" />
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[var(--foreground-muted)] sm:mt-2 sm:text-xs">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-[var(--foreground)] sm:mt-1 sm:text-base">{value}</div>
    </div>
  );
}

function TroopBonusModal({
  troop,
  locale,
  onClose,
}: {
  troop: TroopMeta;
  locale: 'RU' | 'EN';
  onClose: () => void;
}) {
  const summary = TROOP_BONUS_SUMMARIES[troop.key];
  const title = locale === 'RU' ? troop.nameRu : troop.nameEn;
  const troopBonusTitle = locale === 'RU' ? 'Бонусы отряда' : 'Troop bonuses';
  const baseBonusTitle = locale === 'RU' ? 'Базовый бонус' : 'Base bonus';
  const classBonusTitle = locale === 'RU' ? 'Доп. бонус для классов' : 'Extra class bonus';
  const totalBonusTitle = locale === 'RU' ? 'Суммарный бонус' : 'Total bonus';
  const attackLabel = locale === 'RU' ? 'Атака' : 'Attack';
  const defenseLabel = locale === 'RU' ? 'Защита' : 'Defense';
  const healthLabel = locale === 'RU' ? 'Здоровье' : 'Health';
  const manaLabel = locale === 'RU' ? 'Мана' : 'Mana';

  if (!summary) {
    return (
      <DictionaryModal open={true} title={title} closeLabel={locale === 'RU' ? 'Закрыть' : 'Close'} onClose={onClose}>
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
          {locale === 'RU' ? 'Бонусы этого отряда будут добавлены позже.' : 'Troop bonuses will be added later.'}
        </div>
      </DictionaryModal>
    );
  }

  return (
    <DictionaryModal open={true} title={title} closeLabel={locale === 'RU' ? 'Закрыть' : 'Close'} onClose={onClose}>
      <div className="space-y-5">
        <div className="text-sm font-semibold text-[var(--foreground)]">{troopBonusTitle}</div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{baseBonusTitle}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={attackLabel} value={summary.attack} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={defenseLabel} value={summary.defense} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={healthLabel} value={summary.health} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.mana} label={manaLabel} value={summary.mana} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{classBonusTitle}</div>
          <div className="flex items-center justify-center gap-3">
            {troop.classes.map((classKey) => (
              <div
                key={`${troop.key}-bonus-${classKey}`}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={TROOP_CLASS_ICON_BY_KEY[classKey]}
                  alt={locale === 'RU' ? TROOP_CLASS_LABELS[classKey].ru : TROOP_CLASS_LABELS[classKey].en}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={attackLabel} value={summary.classAttackBonus} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={defenseLabel} value={summary.classDefenseBonus} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={healthLabel} value={summary.classHealthBonus} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{totalBonusTitle}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.attack} label={attackLabel} value={summary.totalAttack} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.defense} label={defenseLabel} value={summary.totalDefense} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.health} label={healthLabel} value={summary.totalHealth} />
            <TroopBonusStatCard iconUrl={TROOP_STAT_ICON_BY_KEY.mana} label={manaLabel} value={summary.totalMana} />
          </div>
        </div>
      </div>
    </DictionaryModal>
  );
}

function TroopCard({
  troop,
  elementKey,
  locale,
  onOpenBonus,
}: {
  troop: TroopMeta;
  elementKey: LimitBreakElementKey;
  locale: 'RU' | 'EN';
  onOpenBonus: (troop: TroopMeta) => void;
}) {
  const troopColorPrefix = TROOP_ELEMENT_PREFIX_BY_KEY[elementKey];
  const troopImageUrl = `${TROOPS_ASSET_BASE}/${troopColorPrefix}_legendary_${troop.key}.webp`;
  const troopSpecialtyUrl = `${TROOP_SPECIALTY_ASSET_BASE}/${troop.specialties}.webp`;
  const troopTitle = locale === 'RU' ? troop.nameRu : troop.nameEn;
  const troopSpecialtyTooltip = buildTroopSpecialtyTooltip(troop, locale);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
      <div
        className={`relative overflow-hidden rounded-2xl border bg-[var(--surface)] ${getTroopElementFrameClass(elementKey)}`}
        title={troopTitle}
        aria-label={troopTitle}
      >
        <button
          type="button"
          onClick={() => onOpenBonus(troop)}
          className="block w-full"
          aria-label={locale === 'RU' ? `Открыть бонусы ${troopTitle}` : `Open ${troopTitle} bonuses`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={troopImageUrl} alt={troopTitle} className="aspect-square w-full scale-[0.84] object-contain" />
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-2">
          <div className="flex flex-col gap-1">
            {troop.classes.map((classKey) => (
              <div
                key={`${troop.key}-${classKey}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-950/78 p-1 shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={TROOP_CLASS_ICON_BY_KEY[classKey]} alt={classKey} className="h-full w-full object-contain" />
              </div>
            ))}
          </div>

          <HeroInfoPopover
            label={locale === 'RU' ? `Специальность ${troopTitle}` : `${troopTitle} specialty`}
            content={troopSpecialtyTooltip}
            triggerClassName="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-slate-950/78 p-1.5 shadow-lg transition hover:bg-slate-900/90"
            trigger={
              // eslint-disable-next-line @next/next/no-img-element
              <img src={troopSpecialtyUrl} alt={troop.specialties} className="h-full w-full object-contain" />
            }
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-slate-950/78 px-2 py-1 shadow-lg">
            {Array.from({ length: 5 }).map((_, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${troop.key}-star-${index}`} src={HERO_STAR_ASSET} alt="" className="h-3.5 w-3.5 object-contain" />
            ))}
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/78 p-1 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TROOP_ELEMENT_ICON_BY_KEY[elementKey]} alt={elementKey} className="h-full w-full object-contain" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 text-sm font-semibold leading-tight text-[var(--foreground)]">{troopTitle}</div>
        <button
          type="button"
          onClick={() => onOpenBonus(troop)}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
          aria-label={locale === 'RU' ? `Бонусы ${troopTitle}` : `${troopTitle} bonuses`}
        >
          ?
        </button>
      </div>
    </div>
  );
}

function ManaOptimizationOptionCard({
  option,
  locale,
}: {
  option: ManaOptimizationOption;
  locale: 'RU' | 'EN';
}) {
  const [expandedTroops, setExpandedTroops] = useState(false);
  const shouldCollapseTroops = option.troopItems.length > MANA_OPTIMIZATION_VISIBLE_TROOPS_LIMIT;
  const visibleTroops = shouldCollapseTroops && !expandedTroops
    ? option.troopItems.slice(0, MANA_OPTIMIZATION_VISIBLE_TROOPS_LIMIT)
    : option.troopItems;
  const frameClass = getTroopElementFrameClass(option.elementKey);
  const manaBonusLabel = (bonus: number) =>
    locale === 'RU' ? `+${bonus}% от войска` : `+${bonus}% from troop`;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <div className="space-y-4">
        <div className={`grid gap-3 ${visibleTroops.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {visibleTroops.map((troop) => (
            <div key={troop.key} className={`rounded-2xl border bg-[var(--surface)] p-3 ${frameClass}`}>
              <div className="flex items-start gap-3">
                <div className="flex w-20 shrink-0 flex-col items-center">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border bg-[var(--surface-strong)] p-2 ${frameClass}`}>
                    {troop.imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={troop.imageUrl} alt={troop.name} className="h-full w-full object-contain" />
                      </>
                    ) : (
                      <div className="text-center text-[11px] text-[var(--foreground-soft)]">{troop.name}</div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-0.5">
                    {Array.from({ length: option.stars }).map((_, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${troop.key}-star-${index}`}
                        src={HERO_STAR_ASSET}
                        alt=""
                        className="h-3.5 w-3.5 object-contain"
                      />
                    ))}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {troop.classKeys?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {troop.classKeys.map((classKey) => (
                          <div
                            key={`${troop.key}-${classKey}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-1"
                            title={locale === 'RU' ? TROOP_CLASS_LABELS[classKey].ru : TROOP_CLASS_LABELS[classKey].en}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={TROOP_CLASS_ICON_BY_KEY[classKey]}
                              alt={locale === 'RU' ? TROOP_CLASS_LABELS[classKey].ru : TROOP_CLASS_LABELS[classKey].en}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="min-w-0 text-sm font-semibold text-[var(--foreground)]">{troop.name}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {shouldCollapseTroops ? (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setExpandedTroops((prev) => !prev)}
              className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              {expandedTroops
                ? locale === 'RU'
                  ? 'Скрыть'
                  : 'Hide'
                : locale === 'RU'
                  ? 'Показать ещё'
                  : 'Show more'}
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          {option.lines.map((line) => (
            <div key={line.key} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-cyan-200">
                  {locale === 'RU' ? `Уровень ${line.minLevel}+` : `Level ${line.minLevel}+`}
                </span>
                <span className="text-sm text-[var(--foreground-soft)]">({manaBonusLabel(line.troopManaBonusPercent)})</span>
                {line.supportChips.length > 0 ? (
                  <span className="inline-flex flex-wrap items-center gap-1.5 text-[var(--foreground-soft)]">
                    <span>(</span>
                    {line.supportChips.map((chip, index) => (
                      <span key={`${line.key}-chip-${index}`} className="inline-flex items-center gap-1.5 text-[var(--foreground)]">
                        {chip.iconUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={chip.iconUrl} alt="" className="h-4 w-4 object-contain" />
                          </>
                        ) : null}
                        <span className="text-xs sm:text-sm">{chip.text}</span>
                      </span>
                    ))}
                    <span>)</span>
                  </span>
                ) : line.fallbackText ? (
                  <span className="text-sm text-[var(--foreground-soft)]">({line.fallbackText})</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ManaOptimizationDetailsModal({
  open,
  locale,
  title,
  subtitle,
  options,
  closeLabel,
  onClose,
}: {
  open: boolean;
  locale: 'RU' | 'EN';
  title: string;
  subtitle: string;
  options: ManaOptimizationOption[];
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <DictionaryModal open={open} title={title} closeLabel={closeLabel} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-soft)]">
          {subtitle}
        </div>
        <div className="space-y-3">
          {options.map((option) => (
            <ManaOptimizationOptionCard key={option.key} option={option} locale={locale} />
          ))}
        </div>
      </div>
    </DictionaryModal>
  );
}

function LimitBreakRequirementRowCard({
  row,
  quantityAriaLabel,
  elementKey,
}: {
  row: LimitBreakRequirementRow;
  quantityAriaLabel: (quantity: number) => string;
  elementKey?: LimitBreakElementKey | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.iconUrl} alt={row.title} className="h-14 w-14 rounded-xl object-contain" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--foreground)]">{row.title}</div>
          <div className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">{row.subtitle}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {row.items.map((item) => {
          const resolvedImageUrl = resolveLimitBreakItemImageUrl(item.imageUrl, elementKey);
          const starCount = resolveLimitBreakItemStarCount(resolvedImageUrl);
          const imageClassName = resolveLimitBreakItemImageClassName(resolvedImageUrl);

          return (
            <div
              key={`${row.title}-${row.subtitle}-${item.imageUrl}`}
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2"
              title={item.label}
              aria-label={item.quantity ? `${item.label}, ${quantityAriaLabel(item.quantity)}` : item.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolvedImageUrl} alt={item.label} className={imageClassName} />
              {starCount ? (
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-0.5 rounded-md bg-slate-950/72 px-1 py-0.5">
                  {Array.from({ length: starCount }).map((_, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${resolvedImageUrl}-star-${index}`}
                      src={HERO_STAR_ASSET}
                      alt=""
                      className="h-2.5 w-2.5 object-contain"
                    />
                  ))}
                </div>
              ) : null}
              {item.quantity ? (
                <div className="absolute right-1 top-1 min-w-[1.5rem] rounded-md bg-black px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white shadow-lg">
                  {item.quantity}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PublicHeroDetailsModal({
  open,
  locale,
  heroCard,
  heroDetails,
  heroVariants = null,
  heroExpertOpinions = [],
  heroExpertOpinionsLoading = false,
  heroExpertOpinionsError = null,
  loading,
  error,
  onClose,
  onOpenRelatedHero,
}: PublicHeroDetailsModalProps) {
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [copiedHeroLink, setCopiedHeroLink] = useState(false);
  const [expandedSpecialSkillHeroId, setExpandedSpecialSkillHeroId] = useState<number | null>(null);
  const [limitBreakOpen, setLimitBreakOpen] = useState(false);
  const [troopsOpen, setTroopsOpen] = useState(false);
  const [selectedTroopBonus, setSelectedTroopBonus] = useState<TroopMeta | null>(null);
  const [selectedManaStrategyId, setSelectedManaStrategyId] = useState<string | null>(null);

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            title: 'Просмотр героя',
            close: 'Закрыть',
            loading: 'Загрузка карточки героя...',
            imagePlaceholder: 'Изображение героя добавим позже',
            openImage: 'Открыть изображение полностью',
            closeImage: 'Закрыть просмотр',
            element: 'Элемент',
            rarity: 'Редкость',
            heroClass: 'Класс',
            family: 'Семья',
            manaSpeed: 'Скорость маны',
            alphaTalent: 'Альфа-талант',
            specialSkill: 'Специальный навык',
            passiveSkills: 'Пассивные навыки',
            costumes: 'Костюмы',
            baseHero: 'Базовый герой',
            releaseDate: 'Дата выхода',
            baseStats: 'Базовые статы',
            baseAttack: 'Атака',
            baseArmor: 'Броня',
            baseHp: 'HP',
            manaOptimization: '\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u043C\u0430\u043D\u044B',
            manaOptimizationHint:
              '\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u0434\u043B\u044F \u0441\u043D\u0438\u0436\u0435\u043D\u0438\u044F \u0447\u0438\u0441\u043B\u0430 \u043A\u0430\u043C\u043D\u0435\u0439 \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0433\u0435\u0440\u043E\u044F.',
            manaOptimizationModalHint:
              '\u041D\u0438\u0436\u0435 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u043F\u043E \u0443\u0440\u043E\u0432\u043D\u044E \u0432\u043E\u0439\u0441\u043A, \u0442\u0430\u043B\u0430\u043D\u0442\u0443 \u043A\u043B\u0430\u0441\u0441\u0430 \u0438 \u0431\u043E\u043D\u0443\u0441\u0443 \u043A\u043E\u0441\u0442\u044E\u043C\u0430.',
            manaOptimizationLine: (fromTiles: string, toTiles: string, requiredBonus: number, stageLabel?: string | null) =>
              stageLabel
                ? `${stageLabel}: \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u0441 ${fromTiles} \u043A\u0430\u043C\u043D\u0435\u0439 \u0434\u043E ${toTiles} \u043A\u0430\u043C\u043D\u0435\u0439 (\u043E\u0442 ${requiredBonus}%)`
                : `\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u0441 ${fromTiles} \u043A\u0430\u043C\u043D\u0435\u0439 \u0434\u043E ${toTiles} \u043A\u0430\u043C\u043D\u0435\u0439 (\u043E\u0442 ${requiredBonus}%)`,
            manaOptimizationTitle: (fromTiles: string, toTiles: string, requiredBonus: number, stageLabel?: string | null) =>
              stageLabel
                ? `\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u043C\u0430\u043D\u044B: ${stageLabel}, ${fromTiles} \u043A\u0430\u043C\u043D\u0435\u0439 -> ${toTiles} \u043A\u0430\u043C\u043D\u0435\u0439 (\u043E\u0442 ${requiredBonus}%)`
                : `\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u043C\u0430\u043D\u044B: ${fromTiles} \u043A\u0430\u043C\u043D\u0435\u0439 -> ${toTiles} \u043A\u0430\u043C\u043D\u0435\u0439 (\u043E\u0442 ${requiredBonus}%)`,
            manaOptimizationOpenPath:
              '\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B',
            troopOnly: '\u0422\u043E\u043B\u044C\u043A\u043E \u0431\u043E\u043D\u0443\u0441 \u043E\u0442 \u0432\u043E\u0439\u0441\u043A\u0430',
            classTalentBonus: (bonus: 2 | 4) => `\u0422\u0430\u043B\u0430\u043D\u0442 \u043A\u043B\u0430\u0441\u0441\u0430 +${bonus}% \u043A \u043C\u0430\u043D\u0435`,
            costumeManaBonus: (bonus: number) => `\u041A\u043E\u0441\u0442\u044E\u043C +${bonus}% \u043A \u043C\u0430\u043D\u0435`,
            familyManaBonus: (familyName: string, bonus: number) => `${familyName} +${bonus}% \u043A \u043C\u0430\u043D\u0435`,
            familyConditionMembers: (familyName: string, bonus: number, members: number) =>
              `${familyName} +${bonus}% \u043A \u043C\u0430\u043D\u0435 (${members} \u0433\u0435\u0440. \u0441\u0435\u043C\u044C\u0438)`,
            familyConditionUniqueMembers: (familyName: string, bonus: number, members: number) =>
              `${familyName} +${bonus}% \u043A \u043C\u0430\u043D\u0435 (${members} \u0443\u043D\u0438\u043A. \u0433\u0435\u0440. \u0441\u0435\u043C\u044C\u0438)`,
            bardsSoloCondition: (bonus: number) =>
              `\u0411\u0430\u0440\u0434\u044B +${bonus}% \u043A \u043C\u0430\u043D\u0435 (\u0433\u0435\u0440\u043E\u0439 \u2014 \u0435\u0434\u0438\u043D\u0441\u0442\u0432. \u0432 \u0441\u0432\u043E\u0435\u0439 \u0441\u0435\u043C\u044C\u0435)`,
            lunarRabbitCondition: (bonus: number) =>
              `Lunar Year Rabbit +${bonus}% \u043A \u043C\u0430\u043D\u0435 (\u043D\u0443\u0436\u0435\u043D \u0435\u0449\u0435 1 Lunar Year \u0433\u0435\u0440\u043E\u0439)`,
            legendaryManaTroop: '\u041B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043D\u043E\u0435 \u0432\u043E\u0439\u0441\u043A\u043E',
            epicManaTroop15: '\u042D\u043F\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0432\u043E\u0439\u0441\u043A\u043E (+15% \u043A \u043C\u0430\u043D\u0435)',
            epicManaTroop20: '\u042D\u043F\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0432\u043E\u0439\u0441\u043A\u043E (+20% \u043A \u043C\u0430\u043D\u0435)',
            computedStats: 'Вычисляемые статы',
            limitBreakRequirements: 'Стоимость сломов',
            limitBreakUnavailable: 'Для этой стихии стоимость сломов пока не настроена.',
            firstLimitBreakTitle: 'Первый слом',
            secondLimitBreakTitle: 'АльфаСлом',
            unlockCost: 'Стоимость открытия',
            totalCost: 'Полная стоимость',
            quantityLabel: (quantity: number) => `${quantity} шт`,
            computedStatsHint: 'Здесь позже появится отдельный блок с расчетными статами героя.',
            show: 'Показать',
            hide: 'Скрыть',
            showMore: 'Показать еще',
            showLess: 'Скрыть',
            noValue: 'Не указано',
            noPassiveSkills: 'Пассивные навыки пока не указаны',
            noCostumes: 'Костюмы пока не указаны',
            rarityStars: (stars: number) => `${stars}*`,
            detailsUnavailable: 'Не удалось загрузить детали героя',
          }
        : {
            title: 'Hero details',
            close: 'Close',
            loading: 'Loading hero details...',
            imagePlaceholder: 'Hero image will be added later',
            openImage: 'Open full image',
            closeImage: 'Close preview',
            element: 'Element',
            rarity: 'Rarity',
            heroClass: 'Class',
            family: 'Family',
            manaSpeed: 'Mana speed',
            alphaTalent: 'Alpha talent',
            specialSkill: 'Special skill',
            passiveSkills: 'Passive skills',
            costumes: 'Costumes',
            baseHero: 'Base hero',
            releaseDate: 'Release date',
            baseStats: 'Base stats',
            baseAttack: 'Attack',
            baseArmor: 'Armor',
            baseHp: 'HP',
            manaOptimization: 'Mana Optimization Strategy',
            manaOptimizationHint: 'Available tile breakpoints for this hero.',
            manaOptimizationModalHint:
              'Below are the matching troop level paths for this hero, including class talent and costume mana bonuses.',
            manaOptimizationLine: (fromTiles: string, toTiles: string, requiredBonus: number, stageLabel?: string | null) =>
              stageLabel
                ? `${stageLabel}: optimize from ${fromTiles} tiles to ${toTiles} tiles (from ${requiredBonus}%)`
                : `Optimize from ${fromTiles} tiles to ${toTiles} tiles (from ${requiredBonus}%)`,
            manaOptimizationTitle: (fromTiles: string, toTiles: string, requiredBonus: number, stageLabel?: string | null) =>
              stageLabel
                ? `Mana Optimization Strategy: ${stageLabel}, ${fromTiles} tiles -> ${toTiles} tiles (from ${requiredBonus}%)`
                : `Mana Optimization Strategy: ${fromTiles} tiles -> ${toTiles} tiles (from ${requiredBonus}%)`,
            manaOptimizationOpenPath: 'Open matching paths',
            troopOnly: 'Troop bonus only',
            classTalentBonus: (bonus: 2 | 4) => `Class talent +${bonus}% mana`,
            costumeManaBonus: (bonus: number) => `Costume +${bonus}% mana`,
            familyManaBonus: (familyName: string, bonus: number) => `${familyName} +${bonus}% mana`,
            familyConditionMembers: (familyName: string, bonus: number, members: number) =>
              `${familyName} +${bonus}% mana (${members} family heroes)`,
            familyConditionUniqueMembers: (familyName: string, bonus: number, members: number) =>
              `${familyName} +${bonus}% mana (${members} unique family heroes)`,
            bardsSoloCondition: (bonus: number) =>
              `Bards +${bonus}% mana (only hero of their family on the team)`,
            lunarRabbitCondition: (bonus: number) =>
              `Lunar Year Rabbit +${bonus}% mana (requires 1 more Lunar Year hero)`,
            legendaryManaTroop: 'Legendary troop',
            epicManaTroop15: 'Epic troop (+15% mana)',
            epicManaTroop20: 'Epic troop (+20% mana)',
            computedStats: 'Computed stats',
            limitBreakRequirements: 'Limit Break Requirements',
            limitBreakUnavailable: 'Limit break requirements are not configured for this element yet.',
            firstLimitBreakTitle: 'Limit Break 1',
            secondLimitBreakTitle: 'Alpha Limit Break',
            unlockCost: 'Unlock cost',
            totalCost: 'Total cost',
            quantityLabel: (quantity: number) => `${quantity} pcs`,
            computedStatsHint: 'A separate block with calculated hero stats will appear here later.',
            show: 'Show',
            hide: 'Hide',
            showMore: 'Show more',
            showLess: 'Show less',
            noValue: 'Not set',
            noPassiveSkills: 'No passive skills yet',
            noCostumes: 'No costumes yet',
            rarityStars: (stars: number) => `${stars}*`,
            detailsUnavailable: 'Failed to load hero details',
          },
    [locale],
  );

  const releaseDate = heroDetails?.releaseDate ? formatDate(heroDetails.releaseDate, locale, t.noValue) : null;
  const heroCoachInfoTitle = locale === 'RU' ? 'Тренер героев' : 'Hero Coach Info';
  const visitingOutfitterInfoTitle =
    locale === 'RU' ? 'Приезжий портной' : 'Visiting Outfitter Info';
  const availableSinceLabel = locale === 'RU' ? 'Доступен с' : 'Available since';
  const availableAfterLabel = locale === 'RU' ? 'Доступен после' : 'Available after';
  const availableForBaseHeroPrefix = locale === 'RU' ? 'Доступен для' : 'Available for';
  const baseHeroHighlightLabel = locale === 'RU' ? 'базового героя' : 'base hero';
  const availableForBaseHeroSinceSuffix = locale === 'RU' ? 'с' : 'since';
  const availableForBaseHeroAfterSuffix = locale === 'RU' ? 'после' : 'after';
  const heroCoachTooltip =
    locale === 'RU'
      ? 'Это регулярное событие позволяет игрокам прокачивать легендарных героев до 4/90 в обмен на гемы.\nКостюмы нельзя прокачивать с помощью Тренера героев.\nПосле выбора героя Тренер героев покажет, как будет выглядеть ваш герой на уровне 4/90.\nВы можете выбрать для тренировки только героя, который был выпущен более чем за 730 дней до начала события.\nМожно тренировать только одного героя за событие.\n\nПримеры стоимости в гемах:\nПрокачка с 4/85: 18 гемов\nПрокачка с 4/80: 37 гемов\nПрокачка с 3/70 и 4/1: 334 гема\nПрокачка с 2/60 и 3/1: 593 гема\nПрокачка с 1/50 и 2/1: 815 гемов\nПрокачка с 1/1: 1000 гемов\n\nКаждый уровень уменьшает стоимость на 3-4 гема.\n(~3.7 гема за уровень в среднем.)'
      : "This recurring event allows players to level their Legendary Heroes to 4/90, in exchange for Gems.\nCostumes can't be leveled up with Hero Coach.\nAfter selecting a Hero, the Hero Coach will show you how your hero will look like at 4/90.\nYou can only select a Hero to train, which is released earlier than 2 years before the start of the event.\nIn the live game, players will be able to train one Hero per event.\n\nExample Gem Costs in Beta:\nTraining from 4/85: 18 Gems\nTraining from 4/80: 37 Gems\nTraining from 3/70 and 4/1: 334 Gems\nTraining from 2/60 and 3/1: 593 Gems\nTraining from 1/50 and 2/1: 815 Gems\nTraining from 1/1: 1000 Gems\nEach level is reducing the Gem cost with 3-4 Gems. (~3.7 Gems / level on average.)";
  const visitingOutfitterTooltip =
    locale === 'RU'
      ? 'Это регулярное событие позволяет игрокам получать определённые костюмы для своих героев в обмен на гемы.\n\nПосле выбора героя Портной покажет, какой костюм доступен.\n\nПортной всегда предлагает самый старый отсутствующий костюм для выбранного героя и предлагает только те костюмы, которые были выпущены более чем за 18 месяцев (548 дней) до начала события.\n\nВы можете выбрать только тех героев, у которых есть отсутствующий у вас костюм.\n\nПосле выбора героя вы сможете увидеть, какой именно костюм получите.\n\nИгроки могут получить только один костюм за событие.\n\nСтоимость покупки отсутствующих костюмов по редкости:\nКостюм для Редкого (3*) героя: 100 гемов\nКостюм для Эпического (4*) героя: 200 гемов\nКостюм для Легендарного (5*) героя: 300 гемов'
      : 'This recurring event allows players to get certain Costumes for their Heroes, in exchange for Gems.\nAfter selecting a Hero, the Outfitter will show which Costume is available.\nThe Outfitter will always offer the oldest missing Costume for the selected Hero, and only offers Costumes released earlier than 18 months (548 days) before the start of the event.\nYou can only choose those heroes, which has a costume that you do not have.\nOnce you select a hero, then you can see which costume you will get.\nPlayers can get one Costume per event.\n\nCosts of puchasing the missing costumes per rarity:\nRare costume: 100 Gem\nEpic costune: 200 Gem\nLegendary costume: 300 Gem';
  const heroCoachDateFormatted = heroDetails?.heroCoachDate
    ? formatDate(heroDetails.heroCoachDate, locale, t.noValue)
    : null;
  const visitingOutfitterDateFormatted = heroDetails?.visitingOutfitterDate
    ? formatDate(heroDetails.visitingOutfitterDate, locale, t.noValue)
    : null;
  const resolvedPreviewUrl = heroDetails?.previewUrl ?? heroCard?.previewUrl ?? heroDetails?.imageUrl ?? heroCard?.imageUrl ?? null;
  const resolvedImageUrl = heroDetails?.imageUrl ?? heroCard?.imageUrl ?? null;
  const imagePreviewSource = resolvedImageUrl ?? resolvedPreviewUrl;
  const currentHeroSlug = heroDetails?.slug ?? heroCard?.slug ?? null;
  const copyHeroLinkLabel =
    locale === 'RU' ? '\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443 \u043d\u0430 \u0433\u0435\u0440\u043e\u044f' : 'Copy hero link';
  const copiedHeroLinkLabel =
    locale === 'RU' ? '\u0421\u0441\u044b\u043b\u043a\u0430 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430' : 'Hero link copied';
  const currentHeroIsCostume = heroDetails?.baseHeroId != null;
  const heroCoachStatusText = currentHeroIsCostume ? (
    <>
      {availableForBaseHeroPrefix}{' '}
      <strong className="font-semibold text-[var(--foreground)]">{baseHeroHighlightLabel}</strong>{' '}
      {isDateInPastOrToday(heroDetails?.heroCoachDate) ? availableForBaseHeroSinceSuffix : availableForBaseHeroAfterSuffix}
      {': '}
      {heroCoachDateFormatted ?? t.noValue}
    </>
  ) : heroCoachDateFormatted
    ? `${isDateInPastOrToday(heroDetails?.heroCoachDate) ? availableSinceLabel : availableAfterLabel}: ${heroCoachDateFormatted}`
    : `${availableAfterLabel}: ${t.noValue}`;
  const visitingOutfitterStatusText = visitingOutfitterDateFormatted
    ? `${isDateInPastOrToday(heroDetails?.visitingOutfitterDate) ? availableSinceLabel : availableAfterLabel}: ${visitingOutfitterDateFormatted}`
    : `${availableAfterLabel}: ${t.noValue}`;
  const resolvedRarityStars = heroDetails?.rarity?.stars ?? heroCard?.rarityStars ?? null;
  const resolvedCostumes = heroVariants?.costumes ?? [];
  const specialSkillDescription = heroDetails?.specialSkill?.description?.trim() ?? '';
  const hasLongSpecialSkill = specialSkillDescription.length > 320;
  const resolvedElementName = heroDetails?.element?.name ?? heroCard?.elementName ?? null;
  const previewAccentClass = getPreviewAccentClass(resolvedElementName);
  const heroClassTooltip = [
    heroDetails?.heroClass?.baseName && heroDetails.heroClass.baseDescription
      ? `${heroDetails.heroClass.baseName}: ${heroDetails.heroClass.baseDescription}`
      : null,
    heroDetails?.heroClass?.masterName && heroDetails.heroClass.masterDescription
      ? `${heroDetails.heroClass.masterName}: ${heroDetails.heroClass.masterDescription}`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n');
  const heroLinkTooltip = copiedHeroLink ? copiedHeroLinkLabel : copyHeroLinkLabel;
  const limitBreakElementKey = resolveLimitBreakElementKey(resolvedElementName);
  const troopsTitle = locale === 'RU' ? 'Отряды' : 'Troops';
  const troopsUnavailableText =
    locale === 'RU'
      ? 'Для этого героя подходящие отряды пока не найдены.'
      : 'Matching troops are not configured for this hero yet.';
  const currentHeroIsMimic = currentHeroSlug?.toLocaleLowerCase() === 'mimic';
  const limitBreakSource = currentHeroIsCostume || currentHeroIsMimic
    ? COSTUME_LIMIT_BREAK_REQUIREMENTS
    : LIMIT_BREAK_REQUIREMENTS;
  const limitBreakRows = limitBreakElementKey
    ? limitBreakSource[limitBreakElementKey].map((row, index) => ({
        ...row,
        title: index < 2 ? t.firstLimitBreakTitle : t.secondLimitBreakTitle,
        subtitle: index % 2 === 0 ? t.unlockCost : t.totalCost,
      }))
    : [];
  const resolvedHeroClassKey =
    resolveHeroClassKeyFromImageUrl(heroDetails?.heroClass?.imageUrl) ??
    resolveHeroClassKey(heroDetails?.heroClass?.name ?? heroCard?.heroClassName ?? null);
  const legendaryManaTroops = limitBreakElementKey ? TROOP_CATALOG : [];
  const matchingTroops =
    limitBreakElementKey && resolvedHeroClassKey
      ? TROOP_CATALOG.filter((troop) => troop.classes.includes(resolvedHeroClassKey))
      : [];
  const matchingEpicTroops = limitBreakElementKey
    ? buildEpicTroopEntries().filter((troop) => troop.elementKey === limitBreakElementKey)
    : [];
  const resolvedManaSpeedKey = resolveManaSpeedKey(heroDetails?.manaSpeed?.name ?? heroCard?.manaSpeedName ?? null);
  const manaTalentBonus = getManaTalentBonus(resolvedHeroClassKey);
  const costumeManaBonus = currentHeroIsCostume ? Number(heroDetails?.costumeBonusJson?.mana ?? 0) : 0;
  const costumeManaBonusLabel = t.costumeManaBonus(costumeManaBonus);
  const resolvedFamilyName = heroDetails?.family?.name ?? heroCard?.familyName ?? null;
  const resolvedFamilyImageUrl = heroDetails?.family?.imageUrl ?? null;
  const familyManaConfig = resolveFamilyManaConfig(resolvedFamilyName, currentHeroSlug);
  const defaultFamilyManaBonus = familyManaConfig?.defaultBonusPercent ?? 0;
  const manaOptimizationStrategies: ManaOptimizationScenarioView[] = resolvedManaSpeedKey
    ? MANA_OPTIMIZATION_SCENARIOS.filter((scenario) => scenario.speed === resolvedManaSpeedKey)
        .map((scenario) => {
          const options: ManaOptimizationOption[] = [];
          const legendaryGroups = new Map<string, ManaOptimizationOption>();
          const epicGroups = new Map<string, ManaOptimizationOption>();
          const resolvedTalentBonus = manaTalentBonus === 2 || manaTalentBonus === 4 ? manaTalentBonus : null;
          const buildVariants = () => {
            const baseFamilyChip =
              resolvedFamilyName && defaultFamilyManaBonus > 0
                ? [{ iconUrl: resolvedFamilyImageUrl ?? undefined, text: t.familyManaBonus(resolvedFamilyName, defaultFamilyManaBonus) }] as ManaOptimizationSupportChip[]
                : [] as ManaOptimizationSupportChip[];
            const conditionalFamilyVariants = (familyManaConfig?.variants ?? []).map((variant) => {
              const familyText =
                variant.customConditionKey === 'bards_solo'
                  ? t.bardsSoloCondition(variant.bonusPercent)
                  : variant.customConditionKey === 'lunar_rabbit_pair'
                    ? t.lunarRabbitCondition(variant.bonusPercent)
                    : resolvedFamilyName
                      ? (normalizeFamilyIdentifier(resolvedFamilyName).includes('pirates') || normalizeFamilyIdentifier(resolvedFamilyName).includes('пираты')
                        ? t.familyConditionUniqueMembers(resolvedFamilyName, variant.bonusPercent, variant.membersRequired)
                        : t.familyConditionMembers(resolvedFamilyName, variant.bonusPercent, variant.membersRequired))
                      : `+${variant.bonusPercent}% mana`;

              return {
                key: `family-${variant.bonusPercent}-${variant.membersRequired}-${variant.customConditionKey ?? 'default'}`,
                passiveManaBonus: variant.bonusPercent,
                supportChips: [{ iconUrl: resolvedFamilyImageUrl ?? undefined, text: familyText }] as ManaOptimizationSupportChip[],
                fallbackText: null,
              };
            });

            return [
            ...(currentHeroIsCostume
              ? [
                  {
                    key: 'costume',
                    passiveManaBonus: costumeManaBonus + defaultFamilyManaBonus,
                    supportChips: [...baseFamilyChip, { iconUrl: COSTUME_ICON_URL, text: costumeManaBonusLabel }] as ManaOptimizationSupportChip[],
                    fallbackText: null,
                  },
                  ...(resolvedTalentBonus != null && resolvedHeroClassKey
                    ? [{
                        key: 'costume-talent',
                        passiveManaBonus: costumeManaBonus + resolvedTalentBonus + defaultFamilyManaBonus,
                        supportChips: [
                          ...baseFamilyChip,
                          { iconUrl: COSTUME_ICON_URL, text: costumeManaBonusLabel },
                          { iconUrl: TROOP_CLASS_ICON_BY_KEY[resolvedHeroClassKey], text: t.classTalentBonus(resolvedTalentBonus) },
                        ] as ManaOptimizationSupportChip[],
                        fallbackText: null,
                      }]
                    : []),
                  ...conditionalFamilyVariants.map((variant) => ({
                    ...variant,
                    key: `costume-${variant.key}`,
                    passiveManaBonus: variant.passiveManaBonus + costumeManaBonus,
                    supportChips: [...variant.supportChips, { iconUrl: COSTUME_ICON_URL, text: costumeManaBonusLabel }] as ManaOptimizationSupportChip[],
                  })),
                  ...(resolvedTalentBonus != null && resolvedHeroClassKey
                    ? conditionalFamilyVariants.map((variant) => ({
                        ...variant,
                        key: `costume-talent-${variant.key}`,
                        passiveManaBonus: variant.passiveManaBonus + costumeManaBonus + resolvedTalentBonus,
                        supportChips: [
                          ...variant.supportChips,
                          { iconUrl: COSTUME_ICON_URL, text: costumeManaBonusLabel },
                          { iconUrl: TROOP_CLASS_ICON_BY_KEY[resolvedHeroClassKey], text: t.classTalentBonus(resolvedTalentBonus) },
                        ] as ManaOptimizationSupportChip[],
                      }))
                    : []),
                ]
              : [
                  {
                    key: 'base',
                    passiveManaBonus: defaultFamilyManaBonus,
                    supportChips: baseFamilyChip,
                    fallbackText: t.troopOnly,
                  },
                  ...(resolvedTalentBonus != null && resolvedHeroClassKey
                    ? [{
                        key: 'talent',
                        passiveManaBonus: resolvedTalentBonus + defaultFamilyManaBonus,
                        supportChips: [
                          ...baseFamilyChip,
                          { iconUrl: TROOP_CLASS_ICON_BY_KEY[resolvedHeroClassKey], text: t.classTalentBonus(resolvedTalentBonus) },
                        ] as ManaOptimizationSupportChip[],
                        fallbackText: null,
                      }]
                    : []),
                  ...conditionalFamilyVariants,
                  ...(resolvedTalentBonus != null && resolvedHeroClassKey
                    ? conditionalFamilyVariants.map((variant) => ({
                        ...variant,
                        key: `talent-${variant.key}`,
                        passiveManaBonus: variant.passiveManaBonus + resolvedTalentBonus,
                        supportChips: [
                          ...variant.supportChips,
                          { iconUrl: TROOP_CLASS_ICON_BY_KEY[resolvedHeroClassKey], text: t.classTalentBonus(resolvedTalentBonus) },
                        ] as ManaOptimizationSupportChip[],
                      }))
                    : []),
                ]),
            ];
          };

          for (const troop of legendaryManaTroops) {
            const manaData = LEGENDARY_MANA_LEVELS_BY_TROOP_KEY[troop.key];
            if (!manaData || !limitBreakElementKey) {
              continue;
            }
            const variants = buildVariants();
            const lines: ManaOptimizationLine[] = [];

            for (const variant of variants) {
              const minLevel = findMinimumTroopLevelForManaThreshold(
                manaData.levels,
                scenario.requiredManaBonus,
                variant.passiveManaBonus,
              );

              if (minLevel == null) {
                continue;
              }

              lines.push({
                key: `${troop.key}-${variant.key}`,
                minLevel,
                troopManaBonusPercent: findManaBonusForTroopLevel(manaData.levels, minLevel),
                supportChips: variant.supportChips,
                fallbackText: variant.fallbackText,
              });
            }

            if (lines.length === 0) {
              continue;
            }

            lines.sort((left, right) => left.minLevel - right.minLevel);
            const signature = JSON.stringify(
              lines.map((line) => ({
                minLevel: line.minLevel,
                support: line.supportChips.map((chip) => chip.text),
                fallbackText: line.fallbackText ?? null,
              })),
            );
            const groupKey = `legendary-${signature}`;
            const troopItem: ManaOptimizationTroopCardItem = {
              key: troop.key,
              name: locale === 'RU' ? troop.nameRu : troop.nameEn,
              imageUrl: `${TROOPS_ASSET_BASE}/${TROOP_ELEMENT_PREFIX_BY_KEY[limitBreakElementKey]}_legendary_${troop.key}.webp`,
              classKeys: troop.classes,
            };

            if (legendaryGroups.has(groupKey)) {
              const existing = legendaryGroups.get(groupKey)!;
              existing.troopItems.push(troopItem);
              existing.troopItems.sort((left, right) => {
                const leftProfile = resolvedHeroClassKey != null && left.classKeys?.includes(resolvedHeroClassKey) ? 1 : 0;
                const rightProfile = resolvedHeroClassKey != null && right.classKeys?.includes(resolvedHeroClassKey) ? 1 : 0;
                if (leftProfile !== rightProfile) {
                  return rightProfile - leftProfile;
                }
                return left.name.localeCompare(right.name, locale === 'RU' ? 'ru' : 'en');
              });
            } else {
              legendaryGroups.set(groupKey, {
                key: `${scenario.id}-${groupKey}`,
                troopType: 'legendary_5',
                troopItems: [troopItem],
                stars: 5,
                lines,
                elementKey: limitBreakElementKey,
              });
            }
          }

          const epicCandidates: Array<{
            troopType: 'epic_mana_20' | 'epic_mana_15';
            troopName: string;
            imageUrl: string | null;
            levels: ManaOptimizationLevelBonus[];
            troopKey: string;
          }> = [];

          for (const troop of matchingEpicTroops) {
            if (!troop.enhancements.includes('mana')) {
              continue;
            }

            if (troop.summary.mana === '20%') {
              epicCandidates.push({
                troopType: 'epic_mana_20',
                troopKey: troop.key,
                troopName: locale === 'RU' ? troop.nameRu : troop.nameEn,
                imageUrl: troop.imageUrl,
                levels: troop.key.toLowerCase().includes('cyclopes') ? EPIC_MANA_20_CYCLOPS_LEVELS : EPIC_MANA_20_LEVELS,
              });
            }

            if (troop.summary.mana === '15%') {
              epicCandidates.push({
                troopType: 'epic_mana_15',
                troopKey: troop.key,
                troopName: locale === 'RU' ? troop.nameRu : troop.nameEn,
                imageUrl: troop.imageUrl,
                levels: EPIC_MANA_15_LEVELS,
              });
            }
          }
          const epicVariants = epicCandidates;

          for (const epicTroop of epicVariants) {
            const variants = buildVariants();
            const lines: ManaOptimizationLine[] = [];

            for (const variant of variants) {
              const minLevel = findMinimumTroopLevelForManaThreshold(
                epicTroop.levels,
                scenario.requiredManaBonus,
                variant.passiveManaBonus,
              );

              if (minLevel == null) {
                continue;
              }

              lines.push({
                key: `${epicTroop.troopKey}-${variant.key}`,
                minLevel,
                troopManaBonusPercent: findManaBonusForTroopLevel(epicTroop.levels, minLevel),
                supportChips: variant.supportChips,
                fallbackText: variant.fallbackText,
              });
            }

            if (lines.length === 0) {
              continue;
            }

            lines.sort((left, right) => left.minLevel - right.minLevel);
            epicGroups.set(`${scenario.id}-${epicTroop.troopType}-${epicTroop.troopKey}`, {
              key: `${scenario.id}-${epicTroop.troopType}-${epicTroop.troopKey}`,
              troopType: epicTroop.troopType,
              troopItems: [
                {
                  key: epicTroop.troopKey,
                  name: epicTroop.troopName,
                  imageUrl: epicTroop.imageUrl,
                },
              ],
              stars: 4,
              lines,
              elementKey: limitBreakElementKey,
            });
          }

          options.push(...Array.from(legendaryGroups.values()), ...Array.from(epicGroups.values()));

          options.sort((left, right) => {
            if (left.troopType !== right.troopType) {
              const order: Record<ManaOptimizationTroopType, number> = {
                legendary_5: 0,
                epic_mana_20: 1,
                epic_mana_15: 2,
              };
              return order[left.troopType] - order[right.troopType];
            }

            if (left.troopType === 'legendary_5' && right.troopType === 'legendary_5' && resolvedHeroClassKey) {
              const leftProfile = left.troopItems.some((item) => item.classKeys?.includes(resolvedHeroClassKey)) ? 1 : 0;
              const rightProfile = right.troopItems.some((item) => item.classKeys?.includes(resolvedHeroClassKey)) ? 1 : 0;
              if (leftProfile !== rightProfile) {
                return rightProfile - leftProfile;
              }
            }

            const byTroop = (left.troopItems[0]?.name ?? '').localeCompare(
              right.troopItems[0]?.name ?? '',
              locale === 'RU' ? 'ru' : 'en',
            );
            if (byTroop !== 0) {
              return byTroop;
            }

            return (left.lines[0]?.minLevel ?? 0) - (right.lines[0]?.minLevel ?? 0);
          });

          return {
            ...scenario,
            options,
          };
        })
        .filter((scenario) => scenario.options.length > 0)
    : [];
  const selectedManaStrategy =
    manaOptimizationStrategies.find((scenario) => scenario.id === selectedManaStrategyId) ?? null;
  const legendaryCalculatorTroopOptions = legendaryManaTroops
    .map((troop): HeroStatTroopOption | null => {
      const summary = TROOP_BONUS_SUMMARIES[troop.key];
      if (!summary) {
        return null;
      }
      const isProfileTroop =
        resolvedHeroClassKey != null && troop.classes.includes(resolvedHeroClassKey);

      return {
        key: troop.key,
        name: locale === 'RU' ? troop.nameRu : troop.nameEn,
        imageUrl: `${TROOPS_ASSET_BASE}/${TROOP_ELEMENT_PREFIX_BY_KEY[limitBreakElementKey!]}_legendary_${troop.key}.webp`,
        stars: 5,
        totalAttackBonusPercent: Number.parseFloat(isProfileTroop ? summary.totalAttack : summary.attack),
        totalDefenseBonusPercent: Number.parseFloat(isProfileTroop ? summary.totalDefense : summary.defense),
        totalHealthBonusPercent: Number.parseFloat(isProfileTroop ? summary.totalHealth : summary.health),
        totalManaBonusPercent: Number.parseFloat(isProfileTroop ? summary.totalMana : summary.mana),
        classKeys: troop.classes,
        isProfile: isProfileTroop,
      };
    })
    .filter((item): item is HeroStatTroopOption => item !== null);
  const calculatorTroopOptions: HeroStatTroopOption[] = legendaryCalculatorTroopOptions
    .concat(
      matchingEpicTroops.map((troop) => ({
        key: `epic-${troop.key}`,
        name: locale === 'RU' ? troop.nameRu : troop.nameEn,
        imageUrl: troop.imageUrl,
        stars: 4,
        totalAttackBonusPercent: Number.parseFloat(troop.summary.attack ?? '0'),
        totalDefenseBonusPercent: Number.parseFloat(troop.summary.defense ?? '0'),
        totalHealthBonusPercent: Number.parseFloat(troop.summary.health ?? '0'),
        totalManaBonusPercent: Number.parseFloat(troop.summary.mana ?? '0'),
        classKeys: [],
        isProfile: false,
      })),
    );

  const specialSkillExpanded = heroDetails?.id != null && expandedSpecialSkillHeroId === heroDetails.id;

  const handleCopyHeroLink = async () => {
    if (!currentHeroSlug || typeof window === 'undefined') {
      return;
    }

    const url = new URL('/heroes', window.location.origin);
    url.searchParams.set('hero', currentHeroSlug);

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedHeroLink(true);
      window.setTimeout(() => setCopiedHeroLink(false), 1400);
    } catch {
      setCopiedHeroLink(false);
    }
  };

  const modalTitle = (
    <div className="flex min-w-0 items-center gap-3">
      {resolvedPreviewUrl ? (
        <div className={`overflow-hidden rounded-2xl border p-[2px] transition ${previewAccentClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedPreviewUrl}
            alt={heroDetails?.name ?? heroCard?.name ?? 'Hero preview'}
            className="h-12 w-12 rounded-[14px] object-cover"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex flex-1 items-center gap-2">
        <div className="min-w-0 truncate text-[1.35rem] font-bold text-[var(--foreground)] md:text-[1.5rem]">
          {heroDetails?.name ?? heroCard?.name ?? t.title}
        </div>
        {currentHeroSlug ? (
          <div className="relative inline-flex shrink-0">
            {copiedHeroLink ? (
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-md border border-[var(--border)] bg-slate-700/95 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-lg">
                {copiedHeroLinkLabel}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCopyHeroLink()}
              title={heroLinkTooltip}
              aria-label={heroLinkTooltip}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm leading-none transition ${
                copiedHeroLink
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-[var(--success-text)]'
                  : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:border-cyan-400/40 hover:text-cyan-300'
              }`}
            >
              <CopyHeroLinkIcon copied={copiedHeroLink} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderRelatedHeroChip = (
    slug: string,
    name: string,
    key: string | number,
    costumeIndex?: number | null,
  ) => {
    const isCurrent = currentHeroSlug === slug;
    const label = formatCostumeVariantName(name, costumeIndex);

    if (onOpenRelatedHero) {
      return (
        <button
          key={key}
          type="button"
          onClick={() => onOpenRelatedHero(slug)}
          disabled={isCurrent}
          className={`rounded-2xl border px-3 py-2 text-sm transition ${
            isCurrent
              ? 'cursor-default border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-200'
              : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15'
          }`}
        >
          {label}
        </button>
      );
    }

    return (
      <span
        key={key}
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground-soft)]"
      >
        {label}
      </span>
    );
  };

  return (
    <DictionaryModal open={open} title={modalTitle} closeLabel={t.close} onClose={onClose}>
      {loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error || t.detailsUnavailable}
        </div>
      ) : !heroCard || !heroDetails ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
          {t.detailsUnavailable}
        </div>
      ) : (
        <div className="space-y-6 text-[15px] md:text-base">
          <div className="space-y-4 md:flex md:items-start md:gap-4 md:space-y-0">
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] md:w-[360px] md:flex-none">
              {resolvedImageUrl ? (
                <button
                  type="button"
                  onClick={() => setImagePreviewOpen(true)}
                  className="block aspect-[4/5] w-full bg-[var(--surface-strong)] transition hover:bg-[var(--surface)] sm:aspect-[5/6] md:aspect-auto"
                  aria-label={t.openImage}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedImageUrl}
                    alt={heroDetails.name}
                    className="max-h-[75vh] w-full object-contain object-top"
                  />
                </button>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center px-6 text-center text-sm text-[var(--foreground-muted)] sm:aspect-[5/6] md:min-h-[24rem] md:aspect-auto">
                  {t.imagePlaceholder}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <StackedReferenceRow
                    label={t.element}
                    value={heroDetails.element?.name ?? heroCard.elementName ?? t.noValue}
                    imageUrl={heroDetails.element?.imageUrl}
                    imageSize={42}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
                  <div className="space-y-1.5">
                    <div className="text-base font-bold text-[var(--foreground)]">{t.rarity}:</div>
                    <div className="flex min-h-[25px] items-center">
                      {heroDetails.rarity?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={heroDetails.rarity.imageUrl}
                          alt={resolvedRarityStars != null ? t.rarityStars(resolvedRarityStars) : t.noValue}
                          className="h-[25px] w-[180px] max-w-full object-contain object-left"
                        />
                      ) : (
                        <span className="text-base font-semibold text-[var(--foreground)]">
                          {resolvedRarityStars != null ? t.rarityStars(resolvedRarityStars) : t.noValue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <StackedReferenceRow
                    label={t.heroClass}
                    value={heroDetails.heroClass?.name ?? heroCard.heroClassName ?? t.noValue}
                    imageUrl={heroDetails.heroClass?.imageUrl}
                    tooltipContent={heroClassTooltip || null}
                    imageSize={42}
                  />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <StackedReferenceRow
                    label={t.manaSpeed}
                    value={heroDetails.manaSpeed?.name ?? heroCard.manaSpeedName ?? t.noValue}
                    tooltipContent={heroDetails.manaSpeed?.description ?? null}
                    showImage={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
              <StackedReferenceRow
                label={t.family}
                value={heroDetails.family?.name ?? heroCard.familyName ?? t.noValue}
                imageUrl={heroDetails.family?.imageUrl}
                tooltipContent={heroDetails.family?.description ?? null}
                imageSize={42}
              />
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
              <StackedReferenceRow
                label={t.alphaTalent}
                value={heroDetails.alphaTalent?.name ?? heroCard.alphaTalentName ?? t.noValue}
                imageUrl={heroDetails.alphaTalent?.imageUrl}
                tooltipContent={heroDetails.alphaTalent?.description ?? null}
                imageSize={42}
              />
            </div>
            {heroDetails.costumeBonusJson ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)] md:col-span-2">
                <div className="flex min-w-0 items-center gap-3">
                  <DictionaryMiniIcon
                    imageUrl="/dictionary-icons/costume.png"
                    label={locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}
                    size={34}
                    chromeless
                    fallbackToLetter={false}
                  />
                  <span className="min-w-0 flex-1 text-base font-bold text-[var(--foreground)]">
                    {locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}
                  </span>
                  <HeroInfoPopover
                    label={locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}
                    content={formatCostumeBonusContent(locale, heroDetails.costumeBonusJson)}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.specialSkill}</div>
            <div className="text-base font-medium text-[var(--foreground)]">
              {heroDetails.specialSkill?.name ?? t.noValue}
            </div>
            <div
              className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-soft)] ${
                hasLongSpecialSkill && !specialSkillExpanded ? 'line-clamp-8 overflow-hidden' : ''
              }`}
            >
              {heroDetails.specialSkill?.description ?? t.noValue}
            </div>
            {hasLongSpecialSkill ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedSpecialSkillHeroId((prev) =>
                    heroDetails?.id == null ? null : prev === heroDetails.id ? null : heroDetails.id,
                  )
                }
                className="mt-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
              >
                {specialSkillExpanded ? t.showLess : t.showMore}
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.passiveSkills}</div>
            {heroDetails.passiveSkills.length === 0 ? (
              <div className="text-sm text-[var(--foreground-soft)]">{t.noPassiveSkills}</div>
            ) : (
              <div className="space-y-3">
                {heroDetails.passiveSkills.map((skill) => (
                  <div key={skill.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                    <div className="flex min-w-0 items-start gap-2 text-sm font-semibold text-[var(--foreground)]">
                      <DictionaryInlineValue
                        label={locale === 'RU' ? 'Навык' : 'Skill'}
                        value={skill.name}
                        imageUrl={skill.imageUrl}
                        chromelessIcon
                        iconSize={34}
                        valueClassName="font-semibold text-[var(--foreground)]"
                      />
                      <HeroInfoPopover label={skill.name} content={skill.description} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <HeroExpertOpinionsPublicBlock
            locale={locale}
            items={heroExpertOpinions}
            loading={heroExpertOpinionsLoading}
            error={heroExpertOpinionsError}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <HeroAvailabilityInfoCard
              title={heroCoachInfoTitle}
              imageUrl="/heroes/activity-icons/hero-coach.png"
              tooltipContent={heroCoachTooltip}
              statusText={heroCoachStatusText}
            />
            {currentHeroIsCostume ? (
              <HeroAvailabilityInfoCard
                title={visitingOutfitterInfoTitle}
                imageUrl="/heroes/activity-icons/visiting-outfitter.png"
                tooltipContent={visitingOutfitterTooltip}
                statusText={visitingOutfitterStatusText}
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.costumes}</div>
                {resolvedCostumes.length === 0 ? (
                  <div className="text-sm text-[var(--foreground-soft)]">{t.noCostumes}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {resolvedCostumes.map((costume) =>
                      renderRelatedHeroChip(costume.slug, costume.name, costume.id, costume.costumeIndex),
                    )}
                  </div>
                )}

                {heroVariants?.baseHero && currentHeroIsCostume && (
                  <div className="mt-5 border-t border-[var(--border)] pt-5">
                    <div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.baseHero}</div>
                    {onOpenRelatedHero ? (
                      <button
                        type="button"
                        onClick={() => onOpenRelatedHero(heroVariants.baseHero.slug)}
                        className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-left text-sm text-cyan-200 transition hover:bg-cyan-400/15"
                      >
                        {relationName(heroVariants.baseHero.name, t.noValue)}
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm text-[var(--foreground-soft)]">
                        {relationName(heroVariants.baseHero.name, t.noValue)}
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="space-y-4">
              {manaOptimizationStrategies.length > 0 ? (
                <div className="animate-[pulse_3.2s_ease-in-out_infinite] rounded-2xl border border-amber-300/35 bg-[var(--surface)] p-5 shadow-[0_0_0_1px_rgba(252,211,77,0.14),0_0_28px_rgba(251,191,36,0.12)]">
                  <div className="text-sm font-semibold text-[var(--foreground)]">{t.manaOptimization}</div>
                  <div className="mt-1 text-sm text-[var(--foreground-soft)]">{t.manaOptimizationHint}</div>
                  <div className="mt-4 space-y-3">
                    {manaOptimizationStrategies.map((strategy) => (
                      <button
                        key={strategy.id}
                        type="button"
                        onClick={() => setSelectedManaStrategyId(strategy.id)}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-left transition hover:bg-[var(--surface-hover)]"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[var(--foreground)]">
                            {t.manaOptimizationLine(
                              strategy.fromTiles,
                              strategy.toTiles,
                              strategy.requiredManaBonus,
                              locale === 'RU' ? strategy.stageLabelRu : strategy.stageLabelEn,
                            )}
                          </div>
                          <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                            {t.manaOptimizationOpenPath}
                          </div>
                        </div>
                        <AccordionChevronIcon open={false} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <button
                  type="button"
                  onClick={() => setLimitBreakOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={limitBreakOpen}
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--foreground)]">{t.limitBreakRequirements}</div>
                    <div className="mt-1 text-sm text-[var(--foreground-soft)]">
                      {limitBreakOpen ? t.hide : t.show}
                    </div>
                  </div>
                  <AccordionChevronIcon open={limitBreakOpen} />
                </button>

                {limitBreakOpen ? (
                  <div className="mt-4 space-y-3">
                    {limitBreakRows.length > 0 ? (
                      limitBreakRows.map((row) => (
                        <LimitBreakRequirementRowCard
                          key={`${row.title}-${row.subtitle}`}
                          row={row}
                          quantityAriaLabel={t.quantityLabel}
                          elementKey={limitBreakElementKey}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
                        {t.limitBreakUnavailable}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <button
                  type="button"
                  onClick={() => setTroopsOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={troopsOpen}
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--foreground)]">{troopsTitle}</div>
                    <div className="mt-1 text-sm text-[var(--foreground-soft)]">
                      {locale === 'RU' ? 'Легендарные отряды, подходящие для данного героя.' : 'Legendary troops for this hero.'}
                    </div>
                    <div className="mt-1 text-sm text-[var(--foreground-soft)]">
                      {troopsOpen ? t.hide : t.show}
                    </div>
                  </div>
                  <AccordionChevronIcon open={troopsOpen} />
                </button>

                {troopsOpen ? (
                  <div className="mt-4">
                    <Link
                      href="/troops"
                      className="mb-3 inline-flex text-sm font-semibold text-cyan-300 underline decoration-cyan-400/70 underline-offset-4 transition hover:text-cyan-200"
                    >
                      {locale === 'RU' ? 'Показать все отряды' : 'Show all troops'}
                    </Link>
                    {limitBreakElementKey && matchingTroops.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {matchingTroops.map((troop) => (
                          <TroopCard
                            key={`${limitBreakElementKey}-${troop.key}`}
                            troop={troop}
                            elementKey={limitBreakElementKey}
                            locale={locale}
                            onOpenBonus={setSelectedTroopBonus}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
                        {troopsUnavailableText}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <HeroStatCalculatorPanel
                locale={locale}
                heroId={heroDetails.id}
                heroSlug={heroDetails.slug}
                calculateEndpoint={`/api/v1/public/heroes/${heroDetails.slug}/stats/calculate?language=${locale}`}
                isCostume={heroDetails.baseHeroId != null}
                currentCostumeIndex={
                  heroDetails.baseHeroId != null
                    ? heroVariants?.costumes.find((item) => item.slug === heroDetails.slug)?.costumeIndex ?? null
                    : null
                }
                baseAttack={heroDetails.baseAttack ?? heroCard.baseAttack ?? null}
                baseArmor={heroDetails.baseArmor ?? heroCard.baseArmor ?? null}
                baseHp={heroDetails.baseHp ?? heroCard.baseHp ?? null}
                costumes={heroDetails.costumes}
                troopOptions={calculatorTroopOptions}
              />

              {releaseDate ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--foreground)]">
                  {t.releaseDate}: {releaseDate}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {imagePreviewOpen && imagePreviewSource && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImagePreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setImagePreviewOpen(false)}
            className="absolute right-4 top-4 rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-sm text-white transition hover:bg-black/50"
          >
            {t.closeImage}
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreviewSource}
            alt={heroDetails?.name ?? heroCard?.name ?? 'Hero image'}
            className="max-h-[92vh] max-w-[92vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {selectedTroopBonus ? (
        <TroopBonusModal troop={selectedTroopBonus} locale={locale} onClose={() => setSelectedTroopBonus(null)} />
      ) : null}

      {selectedManaStrategy ? (
        <ManaOptimizationDetailsModal
          open={true}
          locale={locale}
          title={t.manaOptimizationTitle(
            selectedManaStrategy.fromTiles,
            selectedManaStrategy.toTiles,
            selectedManaStrategy.requiredManaBonus,
            locale === 'RU' ? selectedManaStrategy.stageLabelRu : selectedManaStrategy.stageLabelEn,
          )}
          subtitle={t.manaOptimizationModalHint}
          options={selectedManaStrategy.options}
          closeLabel={t.close}
          onClose={() => setSelectedManaStrategyId(null)}
        />
      ) : null}
    </DictionaryModal>
  );
}

