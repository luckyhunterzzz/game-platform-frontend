import type { LocalizedText } from './hero';

export type SummonContentStatus = 'DRAFT' | 'READY' | 'HIDDEN' | 'ARCHIVED';
export type SummonProbabilityKind = 'MAIN' | 'BONUS';
export type SummonBonusKind = 'INDEPENDENT' | 'CONDITIONAL';
export type BonusResultConditionType = 'ANY_RESULT' | 'RARITY' | 'PROBABILITY';
export type BonusRewardMode = 'MAIN_ROLL' | 'CUSTOM_DISTRIBUTION' | 'SPECIFIC_HERO_POOL';

export interface SummonAdminSummary {
  id: string;
  slug: string;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  status: SummonContentStatus;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  updatedAt?: string | null;
}

export interface SummonProbabilityDefinition {
  id: string;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface SummonProbability {
  id: string;
  definition: SummonProbabilityDefinition;
  kind: SummonProbabilityKind;
  valuePercent: number;
  position: number;
  heroIds: number[];
  userSelectionEnabled: boolean;
  defaultSelectedHeroCount?: number | null;
}

export interface SummonBonusCondition {
  type: BonusResultConditionType;
  rarityId?: number | null;
  probabilityId?: string | null;
}

export interface SummonBonusStep {
  id: string;
  position: number;
  activationChancePercent: number;
  rewardMode: BonusRewardMode;
  rewardProbabilities: SummonBonusStepProbability[];
  userHeroSelectionEnabled: boolean;
  rewardHeroIds: number[];
}

export interface SummonBonusStepProbability {
  probabilityId: string;
  valuePercent: number;
  position: number;
}

export interface SummonBonusRule {
  id: string;
  definition: SummonProbabilityDefinition;
  kind: SummonBonusKind;
  userSelectable: boolean;
  triggerCondition?: SummonBonusCondition | null;
  continuationCondition?: SummonBonusCondition | null;
  steps: SummonBonusStep[];
}

export interface SummonVariant {
  id: string;
  version: number;
  variantType: 'DEFAULT' | 'SCHEDULED';
  startsAt?: string | null;
  endsAt?: string | null;
  status: SummonContentStatus;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  probabilities: SummonProbability[];
  bonusRules: SummonBonusRule[];
}

export interface SummonAdminDetails extends SummonAdminSummary {
  version: number;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  backgroundImageBucket?: string | null;
  backgroundImageObjectKey?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  defaultVariant: SummonVariant;
  scheduledVariants: SummonVariant[];
}

export interface SummonHeroOption {
  id: number;
  slug: string;
  nameJson: LocalizedText;
  status: SummonContentStatus;
  familyId?: number | null;
  rarityId?: number | null;
}

export interface SummonFamilyOption {
  id: number;
  nameJson: LocalizedText;
}

export interface SummonRarityOption {
  id: number;
  nameJson: LocalizedText;
  stars: number;
}

export interface SummonProbabilityCreateRequest {
  definitionId: string;
  kind: SummonProbabilityKind;
  valuePercent: number;
  position: number;
  heroIds: number[];
  userSelectionEnabled: boolean;
  defaultSelectedHeroCount?: number | null;
}

export interface SummonBonusConditionRequest {
  type: BonusResultConditionType;
  rarityId?: number | null;
  probabilityDefinitionId?: string | null;
}

export interface SummonBonusStepCreateRequest {
  position: number;
  activationChancePercent: number;
  rewardMode: BonusRewardMode;
  rewardProbabilities: SummonBonusStepProbabilityCreateRequest[];
  userHeroSelectionEnabled: boolean;
  rewardHeroIds: number[];
}

export interface SummonBonusStepProbabilityCreateRequest {
  probabilityDefinitionId: string;
  valuePercent: number;
  position: number;
}

export interface SummonBonusRuleCreateRequest {
  definitionId: string;
  kind: SummonBonusKind;
  userSelectable: boolean;
  triggerCondition?: SummonBonusConditionRequest | null;
  continuationCondition?: SummonBonusConditionRequest | null;
  steps: SummonBonusStepCreateRequest[];
}

export interface SummonCreateRequest {
  slug: string;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  status: Exclude<SummonContentStatus, 'HIDDEN'>;
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  backgroundImageBucket?: string | null;
  backgroundImageObjectKey?: string | null;
  probabilities: SummonProbabilityCreateRequest[];
  bonusRules: SummonBonusRuleCreateRequest[];
}

export interface SummonProbabilityDefinitionCreateRequest {
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
}

export interface SummonVariantCloneRequest {
  sourceVariantId: string;
  startsAt: string;
  endsAt: string;
  status: Exclude<SummonContentStatus, 'HIDDEN'>;
}

export interface SummonVariantUpdateRequest {
  startsAt: string;
  endsAt: string;
  status: Exclude<SummonContentStatus, 'HIDDEN'>;
  probabilities: SummonProbabilityCreateRequest[];
  bonusRules: SummonBonusRuleCreateRequest[];
}

export interface SummonHeroPreview {
  id: number;
  slug: string;
  nameJson: LocalizedText;
  previewUrl?: string | null;
  rarityStars?: number | null;
}

export interface SummonPublicProbability {
  id: string;
  definition: SummonProbabilityDefinition;
  kind: SummonProbabilityKind;
  valuePercent: number;
  position: number;
  userSelectionEnabled: boolean;
  defaultSelectedHeroCount?: number | null;
  heroes: SummonHeroPreview[];
}

export interface SummonPublicVariant {
  id: string;
  variantType: 'DEFAULT' | 'SCHEDULED';
  startsAt?: string | null;
  endsAt?: string | null;
  probabilities: SummonPublicProbability[];
}

export interface SummonPublicItem {
  id: string;
  slug: string;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  variant: SummonPublicVariant;
}

export interface SummonCalendarFeed {
  current: SummonPublicItem[];
  upcoming: SummonPublicItem[];
}

export interface SummonPageResponse {
  items: SummonPublicItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface SummonVariantPageResponse {
  items: SummonVariant[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface SummonSimulationHero {
  id: number;
  slug: string;
  nameJson: LocalizedText;
  previewUrl?: string | null;
  imageUrlJson?: LocalizedText | null;
  rarityStars?: number | null;
}

export interface SummonSimulationProbability {
  id: string;
  definition: SummonProbabilityDefinition;
  valuePercent: number;
  position: number;
  userSelectionEnabled: boolean;
  defaultSelectedHeroCount?: number | null;
  configuredHeroes: SummonSimulationHero[];
}

export interface SummonSimulationBonusStep {
  id: string;
  position: number;
  activationChancePercent: number;
  rewardMode: BonusRewardMode;
  userHeroSelectionEnabled: boolean;
  fixedHero?: SummonSimulationHero | null;
}

export interface SummonSimulationBonusRule {
  id: string;
  definition: SummonProbabilityDefinition;
  kind: SummonBonusKind;
  userSelectable: boolean;
  steps: SummonSimulationBonusStep[];
}

export interface SummonSimulationConfig {
  summonId: string;
  slug: string;
  nameJson: LocalizedText;
  descriptionJson?: LocalizedText | null;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  variantId: string;
  variantVersion: number;
  variantType: 'DEFAULT' | 'SCHEDULED';
  startsAt?: string | null;
  endsAt?: string | null;
  probabilities: SummonSimulationProbability[];
  bonusRules: SummonSimulationBonusRule[];
  selectableFiveStarHeroes: SummonSimulationHero[];
}

export interface SummonSimulationRequest {
  variantVersion: number;
  pullCount: 1 | 10 | 30;
  probabilityHeroSelections: Array<{
    probabilityId: string;
    heroIds: number[];
  }>;
  bonusStepHeroSelections: Array<{
    bonusStepId: string;
    heroId: number;
  }>;
  enabledBonusRuleIds: string[];
}

export type SummonSimulationResultSource = 'BASE' | 'CONDITIONAL_BONUS' | 'INDEPENDENT_BONUS';

export interface SummonSimulationResultItem {
  sequence: number;
  rootPullNumber: number;
  parentResultSequence?: number | null;
  source: SummonSimulationResultSource;
  probabilityId?: string | null;
  bonusRuleId?: string | null;
  bonusStepId?: string | null;
  hero: SummonSimulationHero;
}

export interface SummonSimulationResponse {
  summonId: string;
  variantId: string;
  variantVersion: number;
  requestedPullCount: number;
  totalResultCount: number;
  results: SummonSimulationResultItem[];
}
