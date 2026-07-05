export type HeroLocale = 'RU' | 'EN';

export type LocalizedText = {
  ru: string;
  en: string;
};

export type HeroDictionaryKey =
  | 'heroes'
  | 'elements'
  | 'rarities'
  | 'heroClasses'
  | 'manaSpeeds'
  | 'families'
  | 'alphaTalents'
  | 'heroRoleGroups'
  | 'heroTags'
  | 'passiveSkills'
  | 'emblemProfiles'
  | 'evolutionMultipliers';

export interface HeroDictionaryOption {
  key: HeroDictionaryKey;
  label: string;
  description: string;
}

export const EMPTY_LOCALIZED_TEXT: LocalizedText = {
  ru: '',
  en: '',
};

export type CostumeBonus = {
  attack?: number | null;
  armor?: number | null;
  hp?: number | null;
  mana?: number | null;
};

export interface DictionaryImageFields {
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
}

export type EmblemPathType = 'DAMAGE' | 'DEFENSE';

export type EvolutionStageCode =
  | 'ASCENSION_4_80'
  | 'ASCENSION_4_85'
  | 'ASCENSION_4_90';

export function getLocalizedText(
  value: LocalizedText | null | undefined,
  locale: HeroLocale,
): string {
  if (!value) return '';
  return locale === 'RU' ? value.ru : value.en;
}

export function isCyrillicText(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return /^[А-Яа-яЁё0-9\s"'.,:;!?()\-/%+№]+$/.test(normalized);
}

export function isLatinText(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return /^[A-Za-z0-9\s"'.,:;!?()\-/%+&]+$/.test(normalized);
}

export function isFlexibleCyrillicText(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return /^[\p{Script=Cyrillic}0-9\s"'.,:;!?()\-/%+№&•]+$/u.test(normalized);
}

export function isFlexibleLatinText(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return /^[A-Za-z0-9\s"'.,:;!?()\-/%+&•]+$/.test(normalized);
}

export function validateLocalizedTextPair(
  value: LocalizedText,
  ruRequiredLabel: string,
  enRequiredLabel: string,
): string | null {
  if (!value.ru.trim()) {
    return `${ruRequiredLabel} \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e`;
  }

  if (!value.en.trim()) {
    return `${enRequiredLabel} is required`;
  }

  return null;
}

/* =========================
 * Elements
 * ========================= */

export interface ElementResponseDto extends DictionaryImageFields {
  id: number;
  nameJson: LocalizedText;
}

export interface ElementItem extends DictionaryImageFields {
  id: number;
  name: LocalizedText;
}

export interface CreateElementRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
}

export interface UpdateElementRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
}

export function mapElementDto(dto: ElementResponseDto): ElementItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    imageBucket: dto.imageBucket ?? null,
    imageObjectKey: dto.imageObjectKey ?? null,
    imageUrl: dto.imageUrl ?? null,
  };
}

/* =========================
 * Rarities
 * ========================= */

export interface RarityResponseDto extends DictionaryImageFields {
  id: number;
  nameJson: LocalizedText;
  stars: number;
}

export interface RarityItem extends DictionaryImageFields {
  id: number;
  name: LocalizedText;
  stars: number;
}

export interface CreateRarityRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  stars: number;
}

export interface UpdateRarityRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  stars: number;
}

export function mapRarityDto(dto: RarityResponseDto): RarityItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    stars: dto.stars,
    imageBucket: dto.imageBucket ?? null,
    imageObjectKey: dto.imageObjectKey ?? null,
    imageUrl: dto.imageUrl ?? null,
  };
}

/* =========================
 * Families
 * ========================= */

export interface FamilyResponseDto extends DictionaryImageFields {
  id: number;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface FamilyItem extends DictionaryImageFields {
  id: number;
  name: LocalizedText;
  description?: LocalizedText | null;
}

export interface CreateFamilyRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface UpdateFamilyRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export function mapFamilyDto(dto: FamilyResponseDto): FamilyItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    description: dto.descriptionJson ?? null,
    imageBucket: dto.imageBucket ?? null,
    imageObjectKey: dto.imageObjectKey ?? null,
    imageUrl: dto.imageUrl ?? null,
  };
}

/* =========================
 * Mana Speeds
 * ========================= */

export interface ManaSpeedResponseDto {
  id: number;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface ManaSpeedItem {
  id: number;
  name: LocalizedText;
  description?: LocalizedText | null;
}

export interface CreateManaSpeedRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface UpdateManaSpeedRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export function mapManaSpeedDto(dto: ManaSpeedResponseDto): ManaSpeedItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    description: dto.descriptionJson ?? null,
  };
}

/* =========================
 * Alpha Talents
 * ========================= */

export interface AlphaTalentResponseDto extends DictionaryImageFields {
  id: number;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface AlphaTalentItem extends DictionaryImageFields {
  id: number;
  name: LocalizedText;
  description?: LocalizedText | null;
}

export interface CreateAlphaTalentRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface UpdateAlphaTalentRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export function mapAlphaTalentDto(dto: AlphaTalentResponseDto): AlphaTalentItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    description: dto.descriptionJson ?? null,
    imageBucket: dto.imageBucket ?? null,
    imageObjectKey: dto.imageObjectKey ?? null,
    imageUrl: dto.imageUrl ?? null,
  };
}

/* =========================
 * Hero role groups
 * ========================= */

export interface HeroTagReferenceDto {
  id: number;
  nameJson: LocalizedText;
}

export interface HeroRoleGroupResponseDto {
  id: number;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  tags: HeroTagReferenceDto[];
}

export interface HeroRoleGroupItem {
  id: number;
  name: LocalizedText;
  description?: LocalizedText | null;
  tags: HeroTagReferenceDto[];
}

export interface CreateHeroRoleGroupRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  tagIds?: number[];
}

export interface UpdateHeroRoleGroupRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  tagIds?: number[];
}

export function mapHeroRoleGroupDto(dto: HeroRoleGroupResponseDto): HeroRoleGroupItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    description: dto.descriptionJson ?? null,
    tags: dto.tags ?? [],
  };
}

/* =========================
 * Hero tags
 * ========================= */

export interface HeroTagResponseDto {
  id: number;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  groupId: number;
  groupNameJson?: LocalizedText | null;
}

export interface HeroTagItem {
  id: number;
  name: LocalizedText;
  description?: LocalizedText | null;
  groupId: number;
  groupName?: LocalizedText | null;
}

export interface CreateHeroTagRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  groupId: number;
}

export interface UpdateHeroTagRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  groupId: number;
}

export function mapHeroTagDto(dto: HeroTagResponseDto): HeroTagItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    description: dto.descriptionJson ?? null,
    groupId: dto.groupId,
    groupName: dto.groupNameJson ?? null,
  };
}

/* =========================
 * Passive Skills
 * ========================= */

export interface PassiveSkillResponseDto extends DictionaryImageFields {
  id: number;
  nameJson: LocalizedText;
  descriptionJson: LocalizedText;
}

export interface PassiveSkillItem extends DictionaryImageFields {
  id: number;
  name: LocalizedText;
  description: LocalizedText;
}

export interface CreatePassiveSkillRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  descriptionJson: LocalizedText;
}

export interface UpdatePassiveSkillRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  descriptionJson: LocalizedText;
}

export function mapPassiveSkillDto(dto: PassiveSkillResponseDto): PassiveSkillItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    description: dto.descriptionJson,
    imageBucket: dto.imageBucket ?? null,
    imageObjectKey: dto.imageObjectKey ?? null,
    imageUrl: dto.imageUrl ?? null,
  };
}

/* =========================
 * Hero Classes
 * ========================= */

export interface HeroClassResponseDto extends DictionaryImageFields {
  id: number;
  nameJson: LocalizedText;
  baseNameJson: LocalizedText;
  baseDescriptionJson: LocalizedText;
  masterNameJson: LocalizedText;
  masterDescriptionJson: LocalizedText;
}

export interface HeroClassItem extends DictionaryImageFields {
  id: number;
  name: LocalizedText;
  baseName: LocalizedText;
  baseDescription: LocalizedText;
  masterName: LocalizedText;
  masterDescription: LocalizedText;
}

export interface CreateHeroClassRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  baseNameJson: LocalizedText;
  baseDescriptionJson: LocalizedText;
  masterNameJson: LocalizedText;
  masterDescriptionJson: LocalizedText;
}

export interface UpdateHeroClassRequest extends DictionaryImageFields {
  nameJson: LocalizedText;
  baseNameJson: LocalizedText;
  baseDescriptionJson: LocalizedText;
  masterNameJson: LocalizedText;
  masterDescriptionJson: LocalizedText;
}

export function mapHeroClassDto(dto: HeroClassResponseDto): HeroClassItem {
  return {
    id: dto.id,
    name: dto.nameJson,
    baseName: dto.baseNameJson,
    baseDescription: dto.baseDescriptionJson,
    masterName: dto.masterNameJson,
    masterDescription: dto.masterDescriptionJson,
    imageBucket: dto.imageBucket ?? null,
    imageObjectKey: dto.imageObjectKey ?? null,
    imageUrl: dto.imageUrl ?? null,
  };
}

/* =========================
 * Emblem Profiles
 * ========================= */

export interface HeroClassEmblemBonusProfileResponseDto {
  id: number;
  heroClassId: number;
  pathType: EmblemPathType;
  attackFlatBonus: number;
  armorFlatBonus: number;
  hpFlatBonus: number;
  attackPercentBonus: number;
  armorPercentBonus: number;
  hpPercentBonus: number;
  masterAttackBonus: number;
  masterArmorBonus: number;
  masterHpBonus: number;
}

export interface HeroClassEmblemBonusProfileItem {
  id: number;
  heroClassId: number;
  pathType: EmblemPathType;
  attackFlatBonus: number;
  armorFlatBonus: number;
  hpFlatBonus: number;
  attackPercentBonus: number;
  armorPercentBonus: number;
  hpPercentBonus: number;
  masterAttackBonus: number;
  masterArmorBonus: number;
  masterHpBonus: number;
}

export interface CreateHeroClassEmblemBonusProfileRequest {
  heroClassId: number;
  pathType: EmblemPathType;
  attackFlatBonus: number;
  armorFlatBonus: number;
  hpFlatBonus: number;
  attackPercentBonus: number;
  armorPercentBonus: number;
  hpPercentBonus: number;
  masterAttackBonus: number;
  masterArmorBonus: number;
  masterHpBonus: number;
}

export interface UpdateHeroClassEmblemBonusProfileRequest {
  heroClassId: number;
  pathType: EmblemPathType;
  attackFlatBonus: number;
  armorFlatBonus: number;
  hpFlatBonus: number;
  attackPercentBonus: number;
  armorPercentBonus: number;
  hpPercentBonus: number;
  masterAttackBonus: number;
  masterArmorBonus: number;
  masterHpBonus: number;
}

export function mapHeroClassEmblemBonusProfileDto(
  dto: HeroClassEmblemBonusProfileResponseDto,
): HeroClassEmblemBonusProfileItem {
  return {
    id: dto.id,
    heroClassId: dto.heroClassId,
    pathType: dto.pathType,
    attackFlatBonus: dto.attackFlatBonus,
    armorFlatBonus: dto.armorFlatBonus,
    hpFlatBonus: dto.hpFlatBonus,
    attackPercentBonus: dto.attackPercentBonus,
    armorPercentBonus: dto.armorPercentBonus,
    hpPercentBonus: dto.hpPercentBonus,
    masterAttackBonus: dto.masterAttackBonus,
    masterArmorBonus: dto.masterArmorBonus,
    masterHpBonus: dto.masterHpBonus,
  };
}

/* =========================
 * Evolution Multipliers
 * ========================= */

export interface RarityEvolutionMultiplierResponseDto {
  id: number;
  rarityId: number;
  stageCode: EvolutionStageCode;
  attackMultiplier: number;
  armorMultiplier: number;
  hpMultiplier: number;
}

export interface RarityEvolutionMultiplierItem {
  id: number;
  rarityId: number;
  stageCode: EvolutionStageCode;
  attackMultiplier: number;
  armorMultiplier: number;
  hpMultiplier: number;
}

export interface CreateRarityEvolutionMultiplierRequest {
  rarityId: number;
  stageCode: EvolutionStageCode;
  attackMultiplier: number;
  armorMultiplier: number;
  hpMultiplier: number;
}

export interface UpdateRarityEvolutionMultiplierRequest {
  rarityId: number;
  stageCode: EvolutionStageCode;
  attackMultiplier: number;
  armorMultiplier: number;
  hpMultiplier: number;
}

export function mapRarityEvolutionMultiplierDto(
  dto: RarityEvolutionMultiplierResponseDto,
): RarityEvolutionMultiplierItem {
  return {
    id: dto.id,
    rarityId: dto.rarityId,
    stageCode: dto.stageCode,
    attackMultiplier: dto.attackMultiplier,
    armorMultiplier: dto.armorMultiplier,
    hpMultiplier: dto.hpMultiplier,
  };
}

/* =========================
 * Heroes
 * ========================= */

export interface HeroResponseDto {
  id: number;
  slug: string;
  nameJson: LocalizedText;

  elementId: number;
  rarityId: number;
  heroClassId: number;
  manaSpeedId: number;

  familyId?: number | null;
  alphaTalentId?: number | null;

  baseAttack: number;
  baseArmor: number;
  baseHp: number;
}

export interface HeroItem {
  id: number;
  slug: string;
  name: LocalizedText;

  elementId: number;
  rarityId: number;
  heroClassId: number;
  manaSpeedId: number;

  familyId?: number | null;
  alphaTalentId?: number | null;

  baseAttack: number;
  baseArmor: number;
  baseHp: number;
}

export interface CreateHeroRequest {
  slug: string;
  nameJson: LocalizedText;

  elementId: number;
  rarityId: number;
  heroClassId: number;
  manaSpeedId: number;

  familyId?: number | null;
  alphaTalentId?: number | null;

  baseAttack: number;
  baseArmor: number;
  baseHp: number;
}

export function mapHeroDto(dto: HeroResponseDto): HeroItem {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.nameJson,
    elementId: dto.elementId,
    rarityId: dto.rarityId,
    heroClassId: dto.heroClassId,
    manaSpeedId: dto.manaSpeedId,
    familyId: dto.familyId ?? null,
    alphaTalentId: dto.alphaTalentId ?? null,
    baseAttack: dto.baseAttack,
    baseArmor: dto.baseArmor,
    baseHp: dto.baseHp,
  };
}
