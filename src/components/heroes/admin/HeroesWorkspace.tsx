'use client';

import { format as formatDateValue, isValid as isValidDateValue, parse as parseDateValue, type Locale } from 'date-fns';
import { enGB, enUS, ru } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  buildHeroExpertOpinionPayload,
  mapAdminHeroExpertOpinionDto,
  sortHeroExpertOpinions,
  validateHeroExpertOpinionDraft,
  type HeroExpertOpinionAdminResponseDto,
  type HeroExpertOpinionDraft,
  type HeroExpertOpinionPublicResponseDto,
} from '@/lib/types/hero-expert-opinion';
import type { ImageUploadResponse } from '@/lib/types/publication';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  mapAlphaTalentDto,
  mapElementDto,
  mapFamilyDto,
  mapHeroClassDto,
  mapManaSpeedDto,
  mapPassiveSkillDto,
  mapRarityDto,
  type AlphaTalentItem,
  type AlphaTalentResponseDto,
  type ElementItem,
  type ElementResponseDto,
  type FamilyItem,
  type FamilyResponseDto,
  type HeroClassItem,
  type HeroClassResponseDto,
  type CostumeBonus,
  type HeroLocale,
  type LocalizedText,
  type ManaSpeedItem,
  type ManaSpeedResponseDto,
  type PassiveSkillItem,
  type PassiveSkillResponseDto,
  type RarityItem,
  type RarityResponseDto,
  validateLocalizedTextPair,
} from '@/lib/types/hero';

import DictionaryModal from './DictionaryModal';
import DictionaryInlineValue from '../DictionaryInlineValue';
import DictionaryMiniIcon from '../DictionaryMiniIcon';
import HeroInfoPopover from './HeroInfoPopover';
import HeroImageUploadField from './HeroImageUploadField';
import HeroPreviewUploadField from './HeroPreviewUploadField';
import HeroExpertOpinionsEditor from './HeroExpertOpinionsEditor';
import HeroStatCalculatorPanel from './HeroStatCalculatorPanel';
import LocalizedTextFields from './LocalizedTextFields';
import LocalizedTextareaFields from './LocalizedTextareaFields';
import SearchField from './SearchField';
import SearchableSelectField from './SearchableSelectField';
import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantSummaryItem,
  type PublicHeroVariantsItem,
} from './PublicHeroDetailsModal';

const PUBLIC_API = '/api/v1/public/heroes';
const ADMIN_API = '/api/v1/admin/heroes';
const ADMIN_CATALOG_API = '/api/v1/admin/heroes/catalog';
const ADMIN_SLUG_AVAILABILITY_API = '/api/v1/admin/heroes/slug-availability';
const ADMIN_NEXT_COSTUME_INDEX_API = '/api/v1/admin/heroes/next-costume-index';
const PUBLIC_FILTERS_API = '/api/v1/public/heroes/filters';
const PUBLIC_NAMES_API = '/api/v1/public/heroes/names';
const buildAdminExpertOpinionsApi = (heroId: number) => `/api/v1/admin/heroes/${heroId}/expert-opinions`;
const buildPublicExpertOpinionsApi = (slug: string, locale: 'RU' | 'EN') =>
  `/api/v1/public/heroes/${slug}/expert-opinions?language=${locale}`;
const ELEMENTS_API = '/api/v1/admin/heroes/elements';
const RARITIES_API = '/api/v1/admin/heroes/rarities';
const HERO_CLASSES_API = '/api/v1/admin/heroes/hero-classes';
const MANA_SPEEDS_API = '/api/v1/admin/heroes/mana-speeds';
const FAMILIES_API = '/api/v1/admin/heroes/families';
const ALPHA_TALENTS_API = '/api/v1/admin/heroes/alpha-talents';
const PASSIVE_SKILLS_API = '/api/v1/admin/heroes/passive-skills';
const HERO_IMAGE_UPLOAD_API = '/api/v1/admin/media/images/heroes';
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const SLUG_PATTERN = /^[a-z0-9-]+$/;

type HeroStatus = 'DRAFT' | 'READY' | 'HIDDEN' | 'ARCHIVED';

type HeroPageResponse = {
  items: PublicHeroCardItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type AdminHeroPageResponse = {
  items: AdminHeroResponseDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type HeroFilterOption = {
  id: number;
  name: string;
  imageUrl?: string | null;
};

type HeroRarityFilterOption = HeroFilterOption & {
  stars: number;
};

type HeroCatalogFiltersResponse = {
  elements: HeroFilterOption[];
  rarities: HeroRarityFilterOption[];
  heroClasses: HeroFilterOption[];
  families: HeroFilterOption[];
  manaSpeeds: HeroFilterOption[];
  alphaTalents: HeroFilterOption[];
};

type HeroLookupItem = {
  id: number;
  slug: string;
  name: string;
};

type PublicCatalogFiltersState = {
  elementIds: number[];
  rarityIds: number[];
  heroClassIds: number[];
  familyIds: number[];
  manaSpeedIds: number[];
  alphaTalentIds: number[];
};

type PublicCatalogFilterSearchState = {
  elementIds: string;
  rarityIds: string;
  heroClassIds: string;
  familyIds: string;
  manaSpeedIds: string;
  alphaTalentIds: string;
};

type PublicHeroVariantsResponse = {
  currentHero: PublicHeroDetailsItem;
  baseHero: PublicHeroVariantSummaryItem;
  costumes: PublicHeroVariantSummaryItem[];
};

type AdminHeroVariantsResponse = {
  currentHero: PublicHeroVariantSummaryItem;
  baseHero: PublicHeroVariantSummaryItem;
  costumes: PublicHeroVariantSummaryItem[];
};

type HeroSlugAvailabilityResponse = {
  available: boolean;
};

type HeroNextCostumeIndexResponse = {
  nextCostumeIndex: number;
};

type AdminHeroResponseDto = {
  id: number;
  slug: string;
  nameJson: LocalizedText;
  specialSkillNameJson: LocalizedText;
  specialSkillDescriptionJson: LocalizedText;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  elementId: number;
  rarityId: number;
  heroClassId: number;
  familyId?: number | null;
  manaSpeedId: number;
  alphaTalentId?: number | null;
  imageBucketJson?: LocalizedText | null;
  imageObjectKeyJson?: LocalizedText | null;
  imageUrlJson?: LocalizedText | null;
  previewBucket?: string | null;
  previewObjectKey?: string | null;
  previewUrl?: string | null;
  isCostume: boolean;
  baseHeroId?: number | null;
  costumeIndex?: number | null;
  costumeBonusJson?: CostumeBonus | null;
  releaseDate?: string | null;
  status: HeroStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  updatedByEmail?: string | null;
  passiveSkillIds: number[];
};

type HeroItem = {
  id: number;
  slug: string;
  name: LocalizedText;
  specialSkillName: LocalizedText;
  specialSkillDescription: LocalizedText;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  elementId: number;
  rarityId: number;
  heroClassId: number;
  familyId?: number | null;
  manaSpeedId: number;
  alphaTalentId?: number | null;
  imageBucketJson: LocalizedText;
  imageObjectKeyJson: LocalizedText;
  imageUrlJson: LocalizedText;
  previewBucket?: string | null;
  previewObjectKey?: string | null;
  previewUrl?: string | null;
  isCostume: boolean;
  baseHeroId?: number | null;
  costumeIndex?: number | null;
  costumeBonus?: CostumeBonus | null;
  releaseDate?: string | null;
  status: HeroStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  updatedByEmail?: string | null;
  passiveSkillIds: number[];
};

type HeroFormState = {
  slug: string;
  name: LocalizedText;
  specialSkillName: LocalizedText;
  specialSkillDescription: LocalizedText;
  elementId: string;
  rarityId: string;
  heroClassId: string;
  manaSpeedId: string;
  familyId: string;
  alphaTalentId: string;
  passiveSkillIds: number[];
  imageBucketJson: LocalizedText;
  imageObjectKeyJson: LocalizedText;
  previewBucket: string;
  previewObjectKey: string;
  baseAttack: string;
  baseArmor: string;
  baseHp: string;
  status: HeroStatus;
  releaseDate: string;
  isCostume: boolean;
  baseHeroId: string;
  costumeIndex: string;
  costumeBonusAttack: string;
  costumeBonusArmor: string;
  costumeBonusHp: string;
  costumeBonusMana: string;
};

type HeroMutationRequest = {
  slug: string;
  nameJson: LocalizedText;
  specialSkillNameJson: LocalizedText;
  specialSkillDescriptionJson: LocalizedText;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  elementId: number;
  rarityId: number;
  heroClassId: number;
  familyId?: number | null;
  manaSpeedId: number;
  alphaTalentId?: number | null;
  imageBucketJson?: LocalizedText | null;
  imageObjectKeyJson?: LocalizedText | null;
  previewBucket?: string | null;
  previewObjectKey?: string | null;
  isCostume: boolean;
  baseHeroId?: number | null;
  costumeIndex?: number | null;
  costumeBonusJson?: CostumeBonus | null;
  releaseDate?: string | null;
  status: HeroStatus;
  updatedBy: string;
  updatedByEmail?: string | null;
  passiveSkillIds: number[];
};

const EMPTY_FORM: HeroFormState = {
  slug: '',
  name: { ...EMPTY_LOCALIZED_TEXT },
  specialSkillName: { ...EMPTY_LOCALIZED_TEXT },
  specialSkillDescription: { ...EMPTY_LOCALIZED_TEXT },
  elementId: '',
  rarityId: '',
  heroClassId: '',
  manaSpeedId: '',
  familyId: '',
  alphaTalentId: '',
  passiveSkillIds: [],
  imageBucketJson: { ...EMPTY_LOCALIZED_TEXT },
  imageObjectKeyJson: { ...EMPTY_LOCALIZED_TEXT },
  previewBucket: '',
  previewObjectKey: '',
  baseAttack: '',
  baseArmor: '',
  baseHp: '',
  status: 'READY',
  costumeBonusAttack: '',
  costumeBonusArmor: '',
  costumeBonusHp: '',
  costumeBonusMana: '',
  releaseDate: '',
  isCostume: false,
  baseHeroId: '',
  costumeIndex: '',
};

const EMPTY_PUBLIC_FILTERS: PublicCatalogFiltersState = {
  elementIds: [],
  rarityIds: [],
  heroClassIds: [],
  familyIds: [],
  manaSpeedIds: [],
  alphaTalentIds: [],
};

const EMPTY_PUBLIC_FILTER_SEARCH: PublicCatalogFilterSearchState = {
  elementIds: '',
  rarityIds: '',
  heroClassIds: '',
  familyIds: '',
  manaSpeedIds: '',
  alphaTalentIds: '',
};

function getDefaultCreateRarityId(items: RarityItem[]): string {
  const fiveStarRarity = items.find((item) => item.stars === 5);
  return fiveStarRarity ? String(fiveStarRarity.id) : '';
}

function sortFilterOptions<T extends HeroFilterOption | HeroRarityFilterOption>(
  options: T[],
  locale: 'RU' | 'EN',
): T[] {
  const language = locale === 'RU' ? 'ru' : 'en';

  return [...options].sort((left, right) => {
    const byName = left.name.localeCompare(right.name, language, { sensitivity: 'base' });
    if (byName !== 0) {
      return byName;
    }

    if ('stars' in left && 'stars' in right) {
      const byStars = left.stars - right.stars;
      if (byStars !== 0) {
        return byStars;
      }
    }

    return left.id - right.id;
  });
}

function sortPublicFilterOptions(
  response: HeroCatalogFiltersResponse,
  locale: 'RU' | 'EN',
): HeroCatalogFiltersResponse {
  return {
    elements: sortFilterOptions(response.elements, locale),
    rarities: sortFilterOptions(response.rarities, locale),
    heroClasses: sortFilterOptions(response.heroClasses, locale),
    families: sortFilterOptions(response.families, locale),
    manaSpeeds: sortFilterOptions(response.manaSpeeds, locale),
    alphaTalents: sortFilterOptions(response.alphaTalents, locale),
  };
}

function mapHero(dto: AdminHeroResponseDto): HeroItem {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.nameJson,
    specialSkillName: dto.specialSkillNameJson,
    specialSkillDescription: dto.specialSkillDescriptionJson,
    baseAttack: dto.baseAttack ?? null,
    baseArmor: dto.baseArmor ?? null,
    baseHp: dto.baseHp ?? null,
    elementId: dto.elementId,
    rarityId: dto.rarityId,
    heroClassId: dto.heroClassId,
    familyId: dto.familyId ?? null,
    manaSpeedId: dto.manaSpeedId,
    alphaTalentId: dto.alphaTalentId ?? null,
    imageBucketJson: dto.imageBucketJson ?? { ...EMPTY_LOCALIZED_TEXT },
    imageObjectKeyJson: dto.imageObjectKeyJson ?? { ...EMPTY_LOCALIZED_TEXT },
    imageUrlJson: dto.imageUrlJson ?? { ...EMPTY_LOCALIZED_TEXT },
    previewBucket: dto.previewBucket ?? null,
    previewObjectKey: dto.previewObjectKey ?? null,
    previewUrl: dto.previewUrl ?? null,
    isCostume: dto.isCostume,
    baseHeroId: dto.baseHeroId ?? null,
    costumeIndex: dto.costumeIndex ?? null,
    costumeBonus: dto.costumeBonusJson ?? null,
    releaseDate: dto.releaseDate ?? null,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    updatedBy: dto.updatedBy,
    updatedByEmail: dto.updatedByEmail ?? null,
    passiveSkillIds: dto.passiveSkillIds ?? [],
  };
}

function toForm(hero: HeroItem): HeroFormState {
  return {
    slug: hero.slug,
    name: { ...hero.name },
    specialSkillName: { ...hero.specialSkillName },
    specialSkillDescription: { ...hero.specialSkillDescription },
    elementId: String(hero.elementId),
    rarityId: String(hero.rarityId),
    heroClassId: String(hero.heroClassId),
    manaSpeedId: String(hero.manaSpeedId),
    familyId: hero.familyId ? String(hero.familyId) : '',
    alphaTalentId: hero.alphaTalentId ? String(hero.alphaTalentId) : '',
    passiveSkillIds: [...hero.passiveSkillIds],
    imageBucketJson: { ...hero.imageBucketJson },
    imageObjectKeyJson: { ...hero.imageObjectKeyJson },
    previewBucket: hero.previewBucket ?? '',
    previewObjectKey: hero.previewObjectKey ?? '',
    baseAttack: hero.baseAttack == null ? '' : String(hero.baseAttack),
    baseArmor: hero.baseArmor == null ? '' : String(hero.baseArmor),
    baseHp: hero.baseHp == null ? '' : String(hero.baseHp),
    status: hero.status,
    releaseDate: hero.releaseDate ?? '',
    isCostume: hero.isCostume,
    baseHeroId: hero.baseHeroId ? String(hero.baseHeroId) : '',
    costumeIndex: hero.costumeIndex == null ? '' : String(hero.costumeIndex),
    costumeBonusAttack: hero.costumeBonus?.attack == null ? '' : String(hero.costumeBonus.attack),
    costumeBonusArmor: hero.costumeBonus?.armor == null ? '' : String(hero.costumeBonus.armor),
    costumeBonusHp: hero.costumeBonus?.hp == null ? '' : String(hero.costumeBonus.hp),
    costumeBonusMana: hero.costumeBonus?.mana == null ? '' : String(hero.costumeBonus.mana),
  };
}

function optionalNumber(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

function optionalNonNegativeInteger(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

function slugifyHeroName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function applyCostumeSlugSuffix(baseSlug: string, isCostume: boolean, costumeIndex: string): string {
  const normalizedBaseSlug = baseSlug.replace(/-c\d+$/i, '');
  if (!isCostume || !costumeIndex.trim()) {
    return normalizedBaseSlug;
  }

  return `${normalizedBaseSlug}-c${costumeIndex.trim()}`;
}

function formatCostumeVariantName(name: string, costumeIndex?: number | null) {
  return costumeIndex != null ? `${name} C${costumeIndex}` : name;
}

function formatCostumeBonusContent(locale: HeroLocale, bonus: CostumeBonus | null | undefined): string {
  if (!bonus) {
    return '';
  }

  const lines = [
    locale === 'RU'
      ? `Бонус к атаке: +${bonus.attack ?? 0}%`
      : `Attack Bonus: +${bonus.attack ?? 0}%`,
    locale === 'RU'
      ? `Бонус к защите: +${bonus.armor ?? 0}%`
      : `Defence Bonus: +${bonus.armor ?? 0}%`,
    locale === 'RU'
      ? `Бонус к здоровью: +${bonus.hp ?? 0}%`
      : `Health Bonus: +${bonus.hp ?? 0}%`,
    locale === 'RU'
      ? `Бонус к мане: +${bonus.mana ?? 0}%`
      : `Mana Bonus: +${bonus.mana ?? 0}%`,
  ];

  return lines.join('\n');
}

function extractStoredImageName(objectKey: string | null | undefined): string | null {
  if (!objectKey) return null;
  const segments = objectKey.split('/');
  return segments[segments.length - 1] || objectKey;
}

function getLocalizedImageValue(value: LocalizedText | null | undefined, locale: HeroLocale): string | null {
  if (!value) return null;
  const direct = locale === 'RU' ? value.ru : value.en;
  const fallback = locale === 'RU' ? value.en : value.ru;
  return direct || fallback || null;
}

function hasLocalizedImage(form: HeroFormState, locale: HeroLocale): boolean {
  const bucket = getLocalizedImageValue(form.imageBucketJson, locale);
  const objectKey = getLocalizedImageValue(form.imageObjectKeyJson, locale);
  return Boolean(bucket && objectKey);
}

function hasPreviewImage(form: HeroFormState): boolean {
  return Boolean(form.previewBucket && form.previewObjectKey);
}

function formatAdminDate(value: string | null | undefined, locale: HeroLocale, fallback: string): string {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'RU' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeReleaseDateInput(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const directDate = new Date(trimmedValue);
  if (!Number.isNaN(directDate.getTime())) {
    return formatDateValue(directDate, 'yyyy-MM-dd');
  }

  const sanitizedValue = trimmedValue.replace(/\s*г\.?$/i, '').replace(/,/g, '').trim();
  const referenceDate = new Date();
  const formats: Array<{ pattern: string; locale?: Locale }> = [
    { pattern: 'yyyy-MM-dd' },
    { pattern: 'd.M.yyyy' },
    { pattern: 'd.MM.yyyy' },
    { pattern: 'dd.MM.yyyy' },
    { pattern: 'd/M/yyyy' },
    { pattern: 'dd/MM/yyyy' },
    { pattern: 'd MMM yyyy', locale: ru },
    { pattern: 'd MMMM yyyy', locale: ru },
    { pattern: 'd MMM yyyy', locale: enGB },
    { pattern: 'd MMMM yyyy', locale: enGB },
    { pattern: 'MMM d yyyy', locale: enUS },
    { pattern: 'MMMM d yyyy', locale: enUS },
  ];

  for (const candidate of formats) {
    const parsedDate = parseDateValue(sanitizedValue, candidate.pattern, referenceDate, {
      locale: candidate.locale,
    });

    if (isValidDateValue(parsedDate)) {
      return formatDateValue(parsedDate, 'yyyy-MM-dd');
    }
  }

  return null;
}

export default function HeroesWorkspace({ adminMode = false }: { adminMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid, apiPostFormData } = useApi();
  const { locale: appLocale } = useI18n();
  const { userId, userEmail, displayName } = useAuth();
  const locale: HeroLocale = appLocale === 'ru' ? 'RU' : 'EN';
  const createRuImageInputRef = useRef<HTMLInputElement | null>(null);
  const createEnImageInputRef = useRef<HTMLInputElement | null>(null);
  const editRuImageInputRef = useRef<HTMLInputElement | null>(null);
  const editEnImageInputRef = useRef<HTMLInputElement | null>(null);
  const createPreviewImageInputRef = useRef<HTMLInputElement | null>(null);
  const editPreviewImageInputRef = useRef<HTMLInputElement | null>(null);
  const publicFiltersPanelRef = useRef<HTMLDivElement | null>(null);
  const publicHeroSlugRef = useRef<string | null>(null);

  const [publicPage, setPublicPage] = useState<HeroPageResponse | null>(null);
  const [publicItems, setPublicItems] = useState<PublicHeroCardItem[]>([]);
  const [publicSearch, setPublicSearch] = useState('');
  const [publicFilters, setPublicFilters] = useState<PublicCatalogFiltersState>(EMPTY_PUBLIC_FILTERS);
  const [publicFilterOptions, setPublicFilterOptions] = useState<HeroCatalogFiltersResponse | null>(null);
  const [publicFilterSearch, setPublicFilterSearch] =
    useState<PublicCatalogFilterSearchState>(EMPTY_PUBLIC_FILTER_SEARCH);
  const [openPublicFilterKey, setOpenPublicFilterKey] = useState<keyof PublicCatalogFiltersState | null>(null);
  const [publicFiltersExpanded, setPublicFiltersExpanded] = useState(false);
  const [loadingMorePublic, setLoadingMorePublic] = useState(false);
  const [selectedPublicHero, setSelectedPublicHero] = useState<PublicHeroCardItem | null>(null);
  const [selectedPublicHeroDetails, setSelectedPublicHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedPublicHeroVariants, setSelectedPublicHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [selectedPublicHeroExpertOpinions, setSelectedPublicHeroExpertOpinions] = useState<HeroExpertOpinionPublicResponseDto[]>([]);
  const [items, setItems] = useState<HeroItem[]>([]);
  const [baseHeroOptions, setBaseHeroOptions] = useState<HeroLookupItem[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCatalogPage, setAdminCatalogPage] = useState<AdminHeroPageResponse | null>(null);
  const [loadingMoreAdmin, setLoadingMoreAdmin] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<HeroItem | null>(null);
  const [selectedAdminVariants, setSelectedAdminVariants] = useState<AdminHeroVariantsResponse | null>(null);
  const [selectedAdminHeroExpertOpinions, setSelectedAdminHeroExpertOpinions] = useState<HeroExpertOpinionDraft[]>([]);
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [rarities, setRarities] = useState<RarityItem[]>([]);
  const [heroClasses, setHeroClasses] = useState<HeroClassItem[]>([]);
  const [manaSpeeds, setManaSpeeds] = useState<ManaSpeedItem[]>([]);
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [alphaTalents, setAlphaTalents] = useState<AlphaTalentItem[]>([]);
  const [passiveSkills, setPassiveSkills] = useState<PassiveSkillItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingPublicDetails, setLoadingPublicDetails] = useState(false);
  const [loadingAdminHeroExpertOpinions, setLoadingAdminHeroExpertOpinions] = useState(false);
  const [loadingPublicHeroExpertOpinions, setLoadingPublicHeroExpertOpinions] = useState(false);
  const [createUploadingImage, setCreateUploadingImage] = useState<Record<HeroLocale, boolean>>({
    RU: false,
    EN: false,
  });
  const [editUploadingImage, setEditUploadingImage] = useState<Record<HeroLocale, boolean>>({
    RU: false,
    EN: false,
  });
  const [createUploadingPreview, setCreateUploadingPreview] = useState(false);
  const [editUploadingPreview, setEditUploadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [publicDetailsError, setPublicDetailsError] = useState<string | null>(null);
  const [adminHeroExpertOpinionsError, setAdminHeroExpertOpinionsError] = useState<string | null>(null);
  const [publicHeroExpertOpinionsError, setPublicHeroExpertOpinionsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createImageUploadError, setCreateImageUploadError] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [editImageUploadError, setEditImageUploadError] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [createPreviewUploadError, setCreatePreviewUploadError] = useState<string | null>(null);
  const [editPreviewUploadError, setEditPreviewUploadError] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isCreatePassiveSkillsOpen, setCreatePassiveSkillsOpen] = useState(false);
  const [isEditPassiveSkillsOpen, setEditPassiveSkillsOpen] = useState(false);
  const [createPassiveSkillQuery, setCreatePassiveSkillQuery] = useState('');
  const [editPassiveSkillQuery, setEditPassiveSkillQuery] = useState('');
  const [isPublicDetailsOpen, setPublicDetailsOpen] = useState(false);
  const [createForm, setCreateForm] = useState<HeroFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<HeroFormState>(EMPTY_FORM);
  const [createExpertOpinions, setCreateExpertOpinions] = useState<HeroExpertOpinionDraft[]>([]);
  const [editExpertOpinions, setEditExpertOpinions] = useState<HeroExpertOpinionDraft[]>([]);
  const [initialEditExpertOpinions, setInitialEditExpertOpinions] = useState<HeroExpertOpinionDraft[]>([]);
  const [createBaseHeroSearch, setCreateBaseHeroSearch] = useState('');
  const [createBaseHeroSelectOpen, setCreateBaseHeroSelectOpen] = useState(false);
  const [createSlugAvailable, setCreateSlugAvailable] = useState<boolean | null>(null);
  const [createSlugCheckLoading, setCreateSlugCheckLoading] = useState(false);
  const [createImagePreviewUrl, setCreateImagePreviewUrl] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [createPreviewImageUrl, setCreatePreviewImageUrl] = useState<string | null>(null);
  const [editPreviewImageUrl, setEditPreviewImageUrl] = useState<string | null>(null);
  const [createImageFileName, setCreateImageFileName] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [editImageFileName, setEditImageFileName] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [createPreviewFileName, setCreatePreviewFileName] = useState<string | null>(null);
  const [editPreviewFileName, setEditPreviewFileName] = useState<string | null>(null);
  const defaultCreateRarityId = useMemo(() => getDefaultCreateRarityId(rarities), [rarities]);

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            title: '\u0413\u0435\u0440\u043e\u0438',
            publicSubtitle: '\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0442\u0430\u043b\u043e\u0433 \u0433\u0435\u0440\u043e\u0435\u0432',
            adminSubtitle: 'CRUD \u043f\u043e \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430\u043c \u0433\u0435\u0440\u043e\u0435\u0432',
            create: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0433\u0435\u0440\u043e\u044f',
            createTitle: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0433\u0435\u0440\u043e\u044f',
            editTitle: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0433\u0435\u0440\u043e\u044f',
            detailsTitle: '\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0433\u0435\u0440\u043e\u044f',
            detailsSubtitle: '\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0438 \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e \u0433\u0435\u0440\u043e\u044f',
            edit: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c',
            delete: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c',
            close: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
            cancel: '\u041e\u0442\u043c\u0435\u043d\u0430',
            save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c',
            creating: '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435...',
            saving: '\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435...',
            loading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0433\u0435\u0440\u043e\u0435\u0432...',
            loadingDetails: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438...',
            empty: '\u0413\u0435\u0440\u043e\u0435\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442',
            selectHero: '\u0412\u044b\u0431\u0435\u0440\u0438 \u0433\u0435\u0440\u043e\u044f \u0438\u0437 \u0441\u043f\u0438\u0441\u043a\u0430',
            slug: 'Slug',
            slugHint: '\u0421\u0442\u0440\u043e\u0447\u043d\u044b\u0435 \u043b\u0430\u0442\u0438\u043d\u0441\u043a\u0438\u0435 \u0431\u0443\u043a\u0432\u044b, \u0446\u0438\u0444\u0440\u044b \u0438 \u0434\u0435\u0444\u0438\u0441',
            nameRu: '\u0418\u043c\u044f RU',
            nameEn: 'Name EN',
            skillNameRu: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043d\u0430\u0432\u044b\u043a\u0430 RU',
            skillNameEn: 'Skill name EN',
            skillDescriptionRu: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043d\u0430\u0432\u044b\u043a\u0430 RU',
            skillDescriptionEn: 'Skill description EN',
            element: '\u042d\u043b\u0435\u043c\u0435\u043d\u0442',
            rarity: '\u0420\u0435\u0434\u043a\u043e\u0441\u0442\u044c',
            heroClass: '\u041a\u043b\u0430\u0441\u0441 \u0433\u0435\u0440\u043e\u044f',
            manaSpeed: '\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u044c \u043c\u0430\u043d\u044b',
            family: '\u0421\u0435\u043c\u044c\u044f',
            alphaTalent: '\u0410\u043b\u044c\u0444\u0430-\u0442\u0430\u043b\u0430\u043d\u0442',
            noFamily: '\u0411\u0435\u0437 \u0441\u0435\u043c\u044c\u0438',
            noAlphaTalent: '\u0411\u0435\u0437 \u0430\u043b\u044c\u0444\u0430-\u0442\u0430\u043b\u0430\u043d\u0442\u0430',
            selectElement: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044d\u043b\u0435\u043c\u0435\u043d\u0442',
            selectRarity: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0435\u0434\u043a\u043e\u0441\u0442\u044c',
            selectHeroClass: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u043b\u0430\u0441\u0441 \u0433\u0435\u0440\u043e\u044f',
            selectManaSpeed: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043a\u043e\u0440\u043e\u0441\u0442\u044c \u043c\u0430\u043d\u044b',
            stats: '\u0411\u0430\u0437\u043e\u0432\u044b\u0435 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f',
            baseAttack: '\u0411\u0430\u0437\u043e\u0432\u0430\u044f \u0430\u0442\u0430\u043a\u0430',
            baseArmor: '\u0411\u0430\u0437\u043e\u0432\u0430\u044f \u0431\u0440\u043e\u043d\u044f',
            baseHp: '\u0411\u0430\u0437\u043e\u0432\u043e\u0435 HP',
            statsHint: '\u041c\u043e\u0436\u043d\u043e \u043e\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u043f\u0443\u0441\u0442\u044b\u043c',
            status: '\u0421\u0442\u0430\u0442\u0443\u0441',
            releaseDate: '\u0414\u0430\u0442\u0430 \u0432\u044b\u0445\u043e\u0434\u0430',
            releaseDatePlaceholder: '6 \u043c\u0430\u044f 2024 \u0433. / 2024-05-06',
            releaseDateHint:
              '\u041c\u043e\u0436\u043d\u043e \u0432\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u0434\u0430\u0442\u0443 \u0442\u0435\u043a\u0441\u0442\u043e\u043c. \u041c\u044b \u0441\u0430\u043c\u0438 \u043f\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043c \u0435\u0451 \u0432 \u043d\u0443\u0436\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442.',
            isCostume: '\u042d\u0442\u043e \u043a\u043e\u0441\u0442\u044e\u043c',
            baseHero: '\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u0433\u0435\u0440\u043e\u0439',
            selectBaseHero: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0431\u0430\u0437\u043e\u0432\u043e\u0433\u043e \u0433\u0435\u0440\u043e\u044f',
            metadata: '\u0421\u043b\u0443\u0436\u0435\u0431\u043d\u044b\u0435 \u043f\u043e\u043b\u044f',
            createdBy: '\u0421\u043e\u0437\u0434\u0430\u043b',
            createdAt: '\u0421\u043e\u0437\u0434\u0430\u043d\u043e',
            updatedBy: '\u041e\u0431\u043d\u043e\u0432\u0438\u043b',
            updatedAt: '\u041e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u043e',
            noValue: '\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u043e',
            invalidSlug: 'Slug \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0441\u0442\u0440\u043e\u0447\u043d\u044b\u0435 \u043b\u0430\u0442\u0438\u043d\u0441\u043a\u0438\u0435 \u0431\u0443\u043a\u0432\u044b, \u0446\u0438\u0444\u0440\u044b \u0438 \u0434\u0435\u0444\u0438\u0441',
            slugChecking: '\u041f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u043c slug...',
            slugExists: '\u0413\u0435\u0440\u043e\u0439 \u0441 \u0442\u0430\u043a\u0438\u043c slug \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442',
            slugAvailable: 'Slug \u0441\u0432\u043e\u0431\u043e\u0434\u0435\u043d',
            required: '\u041f\u043e\u043b\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e',
            nonNegative: '\u0417\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0434\u043e\u043b\u0436\u043d\u043e \u0431\u044b\u0442\u044c 0 \u0438\u043b\u0438 \u0431\u043e\u043b\u044c\u0448\u0435',
            invalidReleaseDate:
              '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u0442\u044c \u0434\u0430\u0442\u0443. \u041f\u0440\u0438\u043c\u0435\u0440: 6 \u043c\u0430\u044f 2024 \u0433. \u0438\u043b\u0438 2024-05-06',
            costumeBaseHeroRequired: '\u0414\u043b\u044f \u043a\u043e\u0441\u0442\u044e\u043c\u0430 \u043d\u0443\u0436\u043d\u043e \u0432\u044b\u0431\u0440\u0430\u0442\u044c \u0431\u0430\u0437\u043e\u0432\u043e\u0433\u043e \u0433\u0435\u0440\u043e\u044f',
            costumeIndexLabel: '\u041d\u043e\u043c\u0435\u0440 \u043a\u043e\u0441\u0442\u044e\u043c\u0430',
            relatedCostumes: '\u041a\u043e\u0441\u0442\u044e\u043c\u044b',
            noRelatedCostumes: '\u041a\u043e\u0441\u0442\u044e\u043c\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442',
            search: '\u041f\u043e\u0438\u0441\u043a',
            searchHeroes: '\u041f\u043e\u0438\u0441\u043a \u0433\u0435\u0440\u043e\u0435\u0432',
            searchHeroesPlaceholder: '\u0418\u043c\u044f \u0433\u0435\u0440\u043e\u044f',
            filters: '\u0424\u0438\u043b\u044c\u0442\u0440\u044b',
            resetFilters: '\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440\u044b',
            loadMore: '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0435\u0449\u0435',
            noResults: '\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e',
            adminSearchPlaceholder: '\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0433\u0435\u0440\u043e\u044f\u043c',
            deleteConfirm: (name: string) => `\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0433\u0435\u0440\u043e\u044f "${name}"?`,
          }
        : {
            title: 'Heroes',
            publicSubtitle: 'Public hero catalog',
            adminSubtitle: 'Full CRUD for hero cards',
            create: 'Create hero',
            createTitle: 'Create hero',
            editTitle: 'Edit hero',
            detailsTitle: 'Hero card',
            detailsSubtitle: 'View and edit selected hero',
            edit: 'Edit',
            delete: 'Delete',
            close: 'Close',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loading: 'Loading heroes...',
            loadingDetails: 'Loading hero card...',
            empty: 'No heroes yet',
            selectHero: 'Select a hero from the list',
            slug: 'Slug',
            slugHint: 'Lowercase Latin letters, digits and hyphen',
            nameRu: 'Name RU',
            nameEn: 'Name EN',
            skillNameRu: 'Special skill name RU',
            skillNameEn: 'Special skill name EN',
            skillDescriptionRu: 'Special skill description RU',
            skillDescriptionEn: 'Special skill description EN',
            element: 'Element',
            rarity: 'Rarity',
            heroClass: 'Hero class',
            manaSpeed: 'Mana speed',
            family: 'Family',
            alphaTalent: 'Alpha talent',
            noFamily: 'No family',
            noAlphaTalent: 'No alpha talent',
            selectElement: 'Select element',
            selectRarity: 'Select rarity',
            selectHeroClass: 'Select hero class',
            selectManaSpeed: 'Select mana speed',
            stats: 'Base stats',
            baseAttack: 'Base attack',
            baseArmor: 'Base armor',
            baseHp: 'Base HP',
            statsHint: 'Can be left empty',
            status: 'Status',
            releaseDate: 'Release date',
            releaseDatePlaceholder: '6 May 2024 / 2024-05-06',
            releaseDateHint: 'You can paste the date as text. We will convert it to the correct format.',
            isCostume: 'Is costume',
            baseHero: 'Base hero',
            selectBaseHero: 'Select base hero',
            metadata: 'System fields',
            createdBy: 'Created by',
            createdAt: 'Created at',
            updatedBy: 'Updated by',
            updatedAt: 'Updated at',
            noValue: 'Not set',
            invalidSlug: 'Slug must contain lowercase Latin letters, digits and hyphen',
            slugChecking: 'Checking slug...',
            slugExists: 'Hero with this slug already exists',
            slugAvailable: 'Slug is available',
            required: 'Field is required',
            nonNegative: 'Value must be 0 or greater',
            invalidReleaseDate: 'Could not parse release date. Example: 6 May 2024 or 2024-05-06',
            costumeBaseHeroRequired: 'Costume hero requires a base hero',
            costumeIndexLabel: 'Costume index',
            relatedCostumes: 'Costumes',
            noRelatedCostumes: 'No costumes yet',
            search: 'Search',
            searchHeroes: 'Search heroes',
            searchHeroesPlaceholder: 'Hero name',
            filters: 'Filters',
            showFilters: 'Show filters',
            hideFilters: 'Hide filters',
            resetFilters: 'Reset filters',
            loadMore: 'Load more',
            noResults: 'Nothing found',
            adminSearchPlaceholder: 'Search heroes',
            clearSearch: 'Clear search',
            deleteConfirm: (name: string) => `Delete hero "${name}"?`,
          },
    [locale],
  );

  const loadDictionaries = useCallback(async () => {
    if (!adminMode) return;
    const [
      elementsResponse,
      raritiesResponse,
      heroClassesResponse,
      manaSpeedsResponse,
      familiesResponse,
      alphaTalentsResponse,
      passiveSkillsResponse,
    ] =
      await Promise.all([
        apiJson<ElementResponseDto[]>(ELEMENTS_API),
        apiJson<RarityResponseDto[]>(RARITIES_API),
        apiJson<HeroClassResponseDto[]>(HERO_CLASSES_API),
        apiJson<ManaSpeedResponseDto[]>(MANA_SPEEDS_API),
        apiJson<FamilyResponseDto[]>(FAMILIES_API),
        apiJson<AlphaTalentResponseDto[]>(ALPHA_TALENTS_API),
        apiJson<PassiveSkillResponseDto[]>(PASSIVE_SKILLS_API),
      ]);
    setElements(elementsResponse.map(mapElementDto));
    setRarities(raritiesResponse.map(mapRarityDto));
    setHeroClasses(heroClassesResponse.map(mapHeroClassDto));
    setManaSpeeds(manaSpeedsResponse.map(mapManaSpeedDto));
    setFamilies(familiesResponse.map(mapFamilyDto));
    setAlphaTalents(alphaTalentsResponse.map(mapAlphaTalentDto));
    setPassiveSkills(passiveSkillsResponse.map(mapPassiveSkillDto));
  }, [adminMode, apiJson]);

  const loadBaseHeroOptions = useCallback(async () => {
    if (!adminMode) {
      return;
    }

    const response = await apiJson<HeroLookupItem[]>(`${PUBLIC_NAMES_API}?language=${locale}`);
    setBaseHeroOptions(response);
  }, [adminMode, apiJson, locale]);

  const loadPublicFilterOptions = useCallback(async () => {
    if (adminMode) {
      return;
    }

    const response = await apiJson<HeroCatalogFiltersResponse>(`${PUBLIC_FILTERS_API}?language=${locale}`);
    setPublicFilterOptions(sortPublicFilterOptions(response, locale));
  }, [adminMode, apiJson, locale]);

  const buildPublicCatalogQuery = useCallback(
    (page: number) => {
      const params = new URLSearchParams({
        page: String(page),
        size: '12',
        language: locale,
      });

      if (publicSearch.trim()) {
        params.set('search', publicSearch.trim());
      }

      const appendIds = (key: keyof PublicCatalogFiltersState) => {
        publicFilters[key].forEach((id) => params.append(key, String(id)));
      };

      appendIds('elementIds');
      appendIds('rarityIds');
      appendIds('heroClassIds');
      appendIds('familyIds');
      appendIds('manaSpeedIds');
      appendIds('alphaTalentIds');

      return `${PUBLIC_API}?${params.toString()}`;
    },
    [locale, publicFilters, publicSearch],
  );

  const fetchPublicCatalogPage = useCallback(
    async (page: number, append: boolean) => {
      const response = await apiJson<HeroPageResponse>(buildPublicCatalogQuery(page));
      setPublicPage(response);
      setPublicItems((prev) => (append ? [...prev, ...response.items] : response.items));
    },
    [apiJson, buildPublicCatalogQuery],
  );

  const fetchAdminCatalogPage = useCallback(
    async (page: number, append: boolean) => {
      const params = new URLSearchParams({
        page: String(page),
        size: '5',
      });

      if (adminSearch.trim()) {
        params.set('search', adminSearch.trim());
      }

      const response = await apiJson<AdminHeroPageResponse>(`${ADMIN_CATALOG_API}?${params.toString()}`);
      const mapped = response.items.map(mapHero);

      setAdminCatalogPage(response);
      setItems((prev) => (append ? [...prev, ...mapped] : mapped));
      setSelectedId((prev) => {
        if (append) {
          return prev ?? mapped[0]?.id ?? null;
        }

        if (prev && mapped.some((item) => item.id === prev)) {
          return prev;
        }

        return mapped[0]?.id ?? null;
      });
    },
    [adminSearch, apiJson],
  );

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      if (adminMode) {
        await fetchAdminCatalogPage(0, false);
      } else {
        await fetchPublicCatalogPage(0, false);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load heroes');
    } finally {
      setLoadingList(false);
    }
  }, [adminMode, fetchAdminCatalogPage, fetchPublicCatalogPage]);

  const handleLoadMorePublic = useCallback(async () => {
    if (!publicPage?.hasNext || loadingMorePublic) {
      return;
    }

    setLoadingMorePublic(true);
    setListError(null);
    try {
      await fetchPublicCatalogPage(publicPage.page + 1, true);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load heroes');
    } finally {
      setLoadingMorePublic(false);
    }
  }, [fetchPublicCatalogPage, loadingMorePublic, publicPage]);

  const handleLoadMoreAdmin = useCallback(async () => {
    if (!adminCatalogPage?.hasNext || loadingMoreAdmin) {
      return;
    }

    setLoadingMoreAdmin(true);
    setListError(null);
    try {
      await fetchAdminCatalogPage(adminCatalogPage.page + 1, true);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load heroes');
    } finally {
      setLoadingMoreAdmin(false);
    }
  }, [adminCatalogPage, fetchAdminCatalogPage, loadingMoreAdmin]);

  const loadDetails = useCallback(async (id: number) => {
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const response = await apiJson<AdminHeroResponseDto>(`${ADMIN_API}/${id}`);
      setSelectedItem(mapHero(response));
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Failed to load hero');
    } finally {
      setLoadingDetails(false);
    }
  }, [apiJson]);

  const loadAdminVariants = useCallback(async (id: number) => {
    try {
      const response = await apiJson<AdminHeroVariantsResponse>(`${ADMIN_API}/${id}/variants?language=${locale}`);
      setSelectedAdminVariants(response);
    } catch {
      setSelectedAdminVariants(null);
    }
  }, [apiJson, locale]);

  const findBaseHeroCardBySlug = useCallback((slug: string) => {
    return publicItems.find((item) => item.slug === slug) ?? null;
  }, [publicItems]);

  const toSyntheticPublicHeroCard = useCallback(
    (details: PublicHeroDetailsItem, variants: PublicHeroVariantsResponse): PublicHeroCardItem => ({
      id: details.id,
      slug: details.slug,
      name: details.name,
      imageUrl: details.imageUrl ?? variants.baseHero.imageUrl ?? null,
      elementName:
        details.element?.name ??
        variants.costumes.find((item) => item.slug === details.slug)?.elementName ??
        variants.baseHero.elementName ??
        '',
      rarityName:
        variants.costumes.find((item) => item.slug === details.slug)?.rarityName ??
        variants.baseHero.rarityName ??
        '',
      rarityStars:
        details.rarity?.stars ??
        variants.costumes.find((item) => item.slug === details.slug)?.rarityStars ??
        variants.baseHero.rarityStars ??
        0,
      heroClassName: details.heroClass?.name ?? '',
      manaSpeedName: details.manaSpeed?.name ?? '',
      familyName: details.family?.name ?? null,
      alphaTalentName: details.alphaTalent?.name ?? null,
      baseAttack: null,
      baseArmor: null,
      baseHp: null,
    }),
    [],
  );

  const loadPublicVariants = useCallback(async (slug: string) => {
    setLoadingPublicDetails(true);
    setPublicDetailsError(null);
    setLoadingPublicHeroExpertOpinions(true);
    setPublicHeroExpertOpinionsError(null);
    try {
      const [response, opinionsResponse] = await Promise.all([
        apiJson<PublicHeroVariantsResponse>(`${PUBLIC_API}/${slug}/variants?language=${locale}`),
        apiJson<HeroExpertOpinionPublicResponseDto[]>(buildPublicExpertOpinionsApi(slug, locale)).catch((error) => {
          setPublicHeroExpertOpinionsError(
            error instanceof Error ? error.message : 'Failed to load expert opinions',
          );
          return [];
        }),
      ]);
      setSelectedPublicHeroDetails(response.currentHero);
      setSelectedPublicHeroVariants(response);
      setSelectedPublicHeroExpertOpinions(sortHeroExpertOpinions(opinionsResponse));
      setSelectedPublicHero(
        findBaseHeroCardBySlug(response.currentHero.slug) ?? toSyntheticPublicHeroCard(response.currentHero, response),
      );
    } catch (error) {
      publicHeroSlugRef.current = null;
      setPublicDetailsError(error instanceof Error ? error.message : 'Failed to load hero');
      setSelectedPublicHeroDetails(null);
      setSelectedPublicHeroVariants(null);
      setSelectedPublicHeroExpertOpinions([]);
    } finally {
      setLoadingPublicDetails(false);
      setLoadingPublicHeroExpertOpinions(false);
    }
  }, [apiJson, findBaseHeroCardBySlug, locale, toSyntheticPublicHeroCard]);

  const syncPublicHeroQuery = useCallback((slug: string | null, mode: 'push' | 'replace' = 'push') => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (slug) {
      nextParams.set('hero', slug);
    } else {
      nextParams.delete('hero');
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    if (mode === 'replace') {
      router.replace(nextUrl, { scroll: false });
      return;
    }

    router.push(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const closePublicHeroState = useCallback(() => {
    publicHeroSlugRef.current = null;
    setPublicDetailsOpen(false);
    setSelectedPublicHero(null);
    setSelectedPublicHeroDetails(null);
    setSelectedPublicHeroVariants(null);
    setSelectedPublicHeroExpertOpinions([]);
    setPublicDetailsError(null);
    setPublicHeroExpertOpinionsError(null);
  }, []);

  const openPublicHeroBySlug = useCallback(async (slug: string, heroCard?: PublicHeroCardItem | null) => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      return;
    }

    const alreadyLoadingSameHero =
      publicHeroSlugRef.current === normalizedSlug &&
      (loadingPublicDetails || selectedPublicHeroDetails?.slug === normalizedSlug);

    if (alreadyLoadingSameHero && isPublicDetailsOpen) {
      return;
    }

    publicHeroSlugRef.current = normalizedSlug;

    if (heroCard) {
      setSelectedPublicHero(heroCard);
    }

    setSelectedPublicHeroDetails(null);
    setSelectedPublicHeroVariants(null);
    setPublicDetailsError(null);
    setPublicDetailsOpen(true);
    await loadPublicVariants(normalizedSlug);
  }, [isPublicDetailsOpen, loadPublicVariants, loadingPublicDetails, selectedPublicHeroDetails?.slug]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (adminMode) {
      void loadDictionaries().catch(() => setListError('Failed to load dictionaries'));
    }
  }, [adminMode, loadDictionaries]);

  useEffect(() => {
    if (adminMode) {
      void loadBaseHeroOptions().catch(() => undefined);
      return;
    }

    void loadPublicFilterOptions().catch(() => setListError('Failed to load filters'));
  }, [adminMode, loadBaseHeroOptions, loadPublicFilterOptions]);

  useEffect(() => {
    if (adminMode) {
      return;
    }

    const heroSlugFromQuery = searchParams.get('hero')?.trim().toLowerCase() ?? '';

    if (!heroSlugFromQuery) {
      if (isPublicDetailsOpen || publicHeroSlugRef.current !== null) {
        closePublicHeroState();
      }
      return;
    }

    const currentOpenSlug = selectedPublicHeroDetails?.slug ?? publicHeroSlugRef.current;
    if (currentOpenSlug === heroSlugFromQuery && isPublicDetailsOpen) {
      return;
    }

    void openPublicHeroBySlug(heroSlugFromQuery, findBaseHeroCardBySlug(heroSlugFromQuery) ?? null);
  }, [
    adminMode,
    closePublicHeroState,
    findBaseHeroCardBySlug,
    isPublicDetailsOpen,
    openPublicHeroBySlug,
    searchParams,
    selectedPublicHeroDetails?.slug,
  ]);

  useEffect(() => {
    if (!createForm.isCostume) {
      setCreateBaseHeroSearch('');
      setCreateBaseHeroSelectOpen(false);
      return;
    }

    const nextSearchValue = (locale === 'RU' ? createForm.name.ru : createForm.name.en).trim();
    setCreateBaseHeroSearch(nextSearchValue);
    setCreateBaseHeroSelectOpen(nextSearchValue.length > 0 && !createForm.baseHeroId);
  }, [createForm.isCostume, createForm.name.en, createForm.name.ru, createForm.baseHeroId, locale]);

  useEffect(() => {
    if (!createForm.isCostume || !createForm.baseHeroId) {
      return;
    }

    let cancelled = false;

    const loadNextCostumeIndex = async () => {
      try {
        const response = await apiJson<HeroNextCostumeIndexResponse>(
          `${ADMIN_NEXT_COSTUME_INDEX_API}?baseHeroId=${createForm.baseHeroId}`,
        );

        if (!cancelled) {
          setCreateForm((prev) => {
            if (!prev.isCostume || prev.baseHeroId !== createForm.baseHeroId) {
              return prev;
            }

            const nextCostumeIndex = String(response.nextCostumeIndex);
            if (prev.costumeIndex === nextCostumeIndex) {
              return prev;
            }

            return {
              ...prev,
              costumeIndex: nextCostumeIndex,
              slug: applyCostumeSlugSuffix(slugifyHeroName(prev.name.en), prev.isCostume, nextCostumeIndex),
            };
          });
        }
      } catch {
        // Keep manual input if helper endpoint is unavailable.
      }
    };

    void loadNextCostumeIndex();

    return () => {
      cancelled = true;
    };
  }, [apiJson, createForm.baseHeroId, createForm.isCostume]);

  useEffect(() => {
    const normalizedSlug = createForm.slug.trim().toLowerCase();
    if (!isCreateOpen || normalizedSlug.length === 0 || !SLUG_PATTERN.test(normalizedSlug)) {
      setCreateSlugAvailable(null);
      setCreateSlugCheckLoading(false);
      return;
    }

    let cancelled = false;
    setCreateSlugCheckLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await apiJson<HeroSlugAvailabilityResponse>(
          `${ADMIN_SLUG_AVAILABILITY_API}?slug=${encodeURIComponent(normalizedSlug)}`,
        );

        if (!cancelled) {
          setCreateSlugAvailable(response.available);
        }
      } catch {
        if (!cancelled) {
          setCreateSlugAvailable(null);
        }
      } finally {
        if (!cancelled) {
          setCreateSlugCheckLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [apiJson, createForm.slug, isCreateOpen]);

  useEffect(() => {
    if (!isCreateOpen || !defaultCreateRarityId) {
      return;
    }

    setCreateForm((prev) => {
      if (prev.rarityId) {
        return prev;
      }

      return {
        ...prev,
        rarityId: defaultCreateRarityId,
      };
    });
  }, [defaultCreateRarityId, isCreateOpen]);

  useEffect(() => {
    setCreateForm((prev) => {
      const nextSlug = applyCostumeSlugSuffix(slugifyHeroName(prev.name.en), prev.isCostume, prev.costumeIndex);
      if (prev.slug === nextSlug) {
        return prev;
      }

      return {
        ...prev,
        slug: nextSlug,
      };
    });
  }, [createForm.name.en, createForm.isCostume, createForm.costumeIndex]);

  useEffect(() => {
    if (openPublicFilterKey === null) {
      return;
    }

    let closeTimeoutId: number | null = null;

    const handlePointerDown = (event: MouseEvent) => {
      if (!publicFiltersPanelRef.current) {
        return;
      }

      if (!publicFiltersPanelRef.current.contains(event.target as Node)) {
        closeTimeoutId = window.setTimeout(() => {
          setOpenPublicFilterKey(null);
        }, 0);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPublicFilterKey(null);
      }
    };

    document.addEventListener('click', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (closeTimeoutId !== null) {
        window.clearTimeout(closeTimeoutId);
      }
      document.removeEventListener('click', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openPublicFilterKey]);

  const resetImageInput = (mode: 'create' | 'edit', imageLocale: HeroLocale) => {
    const ref =
      mode === 'create'
        ? imageLocale === 'RU'
          ? createRuImageInputRef
          : createEnImageInputRef
        : imageLocale === 'RU'
          ? editRuImageInputRef
          : editEnImageInputRef;
    if (ref.current) {
      ref.current.value = '';
    }
  };

  const resetPreviewImageInput = (mode: 'create' | 'edit') => {
    const ref = mode === 'create' ? createPreviewImageInputRef : editPreviewImageInputRef;
    if (ref.current) {
      ref.current.value = '';
    }
  };

  const clearUploadedImageState = (mode: 'create' | 'edit', imageLocale: HeroLocale) => {
    if (mode === 'create') {
      setCreateImagePreviewUrl((prev) => ({ ...prev, [imageLocale]: null }));
      setCreateImageFileName((prev) => ({ ...prev, [imageLocale]: null }));
      setCreateImageUploadError((prev) => ({ ...prev, [imageLocale]: null }));
      setCreateForm((prev) => ({
        ...prev,
        imageBucketJson: {
          ...prev.imageBucketJson,
          [imageLocale === 'RU' ? 'ru' : 'en']: '',
        },
        imageObjectKeyJson: {
          ...prev.imageObjectKeyJson,
          [imageLocale === 'RU' ? 'ru' : 'en']: '',
        },
      }));
    } else {
      setEditImagePreviewUrl((prev) => ({ ...prev, [imageLocale]: null }));
      setEditImageFileName((prev) => ({ ...prev, [imageLocale]: null }));
      setEditImageUploadError((prev) => ({ ...prev, [imageLocale]: null }));
      setEditForm((prev) => ({
        ...prev,
        imageBucketJson: {
          ...prev.imageBucketJson,
          [imageLocale === 'RU' ? 'ru' : 'en']: '',
        },
        imageObjectKeyJson: {
          ...prev.imageObjectKeyJson,
          [imageLocale === 'RU' ? 'ru' : 'en']: '',
        },
      }));
    }

    resetImageInput(mode, imageLocale);
  };

  const clearUploadedPreviewState = (mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setCreatePreviewImageUrl(null);
      setCreatePreviewFileName(null);
      setCreatePreviewUploadError(null);
      setCreateForm((prev) => ({
        ...prev,
        previewBucket: '',
        previewObjectKey: '',
      }));
    } else {
      setEditPreviewImageUrl(null);
      setEditPreviewFileName(null);
      setEditPreviewUploadError(null);
      setEditForm((prev) => ({
        ...prev,
        previewBucket: '',
        previewObjectKey: '',
      }));
    }

    resetPreviewImageInput(mode);
  };

  const handleHeroImageSelected = async (
    mode: 'create' | 'edit',
    imageLocale: HeroLocale,
    file: File | null,
  ) => {
    if (!file) {
      clearUploadedImageState(mode, imageLocale);
      return;
    }

    const invalidTypeMessage =
      locale === 'RU'
              ? '\u041c\u043e\u0436\u043d\u043e \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e PNG, JPEG \u0438\u043b\u0438 WEBP.'
        : 'Only PNG, JPEG or WEBP images are allowed.';

    const uploadErrorMessage =
      locale === 'RU'
              ? '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435 \u0433\u0435\u0440\u043e\u044f.'
        : 'Failed to upload hero image.';

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      clearUploadedImageState(mode, imageLocale);
      if (mode === 'create') {
        setCreateImageUploadError((prev) => ({ ...prev, [imageLocale]: invalidTypeMessage }));
      } else {
        setEditImageUploadError((prev) => ({ ...prev, [imageLocale]: invalidTypeMessage }));
      }
      return;
    }

    if (mode === 'create') {
      setCreateUploadingImage((prev) => ({ ...prev, [imageLocale]: true }));
      setCreateImageUploadError((prev) => ({ ...prev, [imageLocale]: null }));
    } else {
      setEditUploadingImage((prev) => ({ ...prev, [imageLocale]: true }));
      setEditImageUploadError((prev) => ({ ...prev, [imageLocale]: null }));
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiPostFormData<ImageUploadResponse>(HERO_IMAGE_UPLOAD_API, formData);

      if (mode === 'create') {
        setCreateImagePreviewUrl((prev) => ({ ...prev, [imageLocale]: response.url }));
        setCreateImageFileName((prev) => ({ ...prev, [imageLocale]: file.name }));
        setCreateForm((prev) => ({
          ...prev,
          imageBucketJson: {
            ...prev.imageBucketJson,
            [imageLocale === 'RU' ? 'ru' : 'en']: response.bucket,
          },
          imageObjectKeyJson: {
            ...prev.imageObjectKeyJson,
            [imageLocale === 'RU' ? 'ru' : 'en']: response.objectKey,
          },
        }));
      } else {
        setEditImagePreviewUrl((prev) => ({ ...prev, [imageLocale]: response.url }));
        setEditImageFileName((prev) => ({ ...prev, [imageLocale]: file.name }));
        setEditForm((prev) => ({
          ...prev,
          imageBucketJson: {
            ...prev.imageBucketJson,
            [imageLocale === 'RU' ? 'ru' : 'en']: response.bucket,
          },
          imageObjectKeyJson: {
            ...prev.imageObjectKeyJson,
            [imageLocale === 'RU' ? 'ru' : 'en']: response.objectKey,
          },
        }));
      }
    } catch (error) {
      clearUploadedImageState(mode, imageLocale);
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : uploadErrorMessage;

      if (mode === 'create') {
        setCreateImageFileName((prev) => ({ ...prev, [imageLocale]: file.name }));
        setCreateImageUploadError((prev) => ({ ...prev, [imageLocale]: message }));
      } else {
        setEditImageFileName((prev) => ({ ...prev, [imageLocale]: file.name }));
        setEditImageUploadError((prev) => ({ ...prev, [imageLocale]: message }));
      }
    } finally {
      if (mode === 'create') {
        setCreateUploadingImage((prev) => ({ ...prev, [imageLocale]: false }));
      } else {
        setEditUploadingImage((prev) => ({ ...prev, [imageLocale]: false }));
      }
    }
  };

  const handlePreviewImageSelected = async (mode: 'create' | 'edit', file: File | null) => {
    if (!file) {
      clearUploadedPreviewState(mode);
      return;
    }

    const invalidTypeMessage =
      locale === 'RU'
        ? 'Можно загружать только PNG, JPEG или WEBP.'
        : 'Only PNG, JPEG or WEBP images are allowed.';

    const uploadErrorMessage =
      locale === 'RU' ? 'Не удалось загрузить превью героя.' : 'Failed to upload hero preview.';

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      clearUploadedPreviewState(mode);
      if (mode === 'create') {
        setCreatePreviewUploadError(invalidTypeMessage);
      } else {
        setEditPreviewUploadError(invalidTypeMessage);
      }
      return;
    }

    if (mode === 'create') {
      setCreateUploadingPreview(true);
      setCreatePreviewUploadError(null);
    } else {
      setEditUploadingPreview(true);
      setEditPreviewUploadError(null);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiPostFormData<ImageUploadResponse>(HERO_IMAGE_UPLOAD_API, formData);

      if (mode === 'create') {
        setCreatePreviewImageUrl(response.url);
        setCreatePreviewFileName(file.name);
        setCreateForm((prev) => ({
          ...prev,
          previewBucket: response.bucket,
          previewObjectKey: response.objectKey,
        }));
      } else {
        setEditPreviewImageUrl(response.url);
        setEditPreviewFileName(file.name);
        setEditForm((prev) => ({
          ...prev,
          previewBucket: response.bucket,
          previewObjectKey: response.objectKey,
        }));
      }
    } catch (error) {
      clearUploadedPreviewState(mode);
      const message =
        error instanceof ApiError || error instanceof Error ? error.message : uploadErrorMessage;

      if (mode === 'create') {
        setCreatePreviewFileName(file.name);
        setCreatePreviewUploadError(message);
      } else {
        setEditPreviewFileName(file.name);
        setEditPreviewUploadError(message);
      }
    } finally {
      if (mode === 'create') {
        setCreateUploadingPreview(false);
      } else {
        setEditUploadingPreview(false);
      }
    }
  };

  const resetCreateModalState = () => {
    setCreateForm(EMPTY_FORM);
    setCreateBaseHeroSearch('');
    setCreateBaseHeroSelectOpen(false);
    setCreateSlugAvailable(null);
    setCreateSlugCheckLoading(false);
    setSubmitError(null);
    setCreateImagePreviewUrl({ RU: null, EN: null });
    setCreateImageFileName({ RU: null, EN: null });
    setCreateImageUploadError({ RU: null, EN: null });
    setCreateUploadingImage({ RU: false, EN: false });
    setCreatePreviewImageUrl(null);
    setCreatePreviewFileName(null);
    setCreatePreviewUploadError(null);
    setCreateUploadingPreview(false);
    resetImageInput('create', 'RU');
    resetImageInput('create', 'EN');
    resetPreviewImageInput('create');
  };

  const openCreateModal = () => {
    resetCreateModalState();
    setCreatePassiveSkillsOpen(false);
    setCreatePassiveSkillQuery('');
    setCreateExpertOpinions([]);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (submitting || createUploadingImage.RU || createUploadingImage.EN || createUploadingPreview) return;
    resetCreateModalState();
    setCreatePassiveSkillsOpen(false);
    setCreatePassiveSkillQuery('');
    setCreateExpertOpinions([]);
    setCreateOpen(false);
  };

  const openEditModal = () => {
    if (!selectedItem) return;
    setEditForm(toForm(selectedItem));
    setEditExpertOpinions(sortHeroExpertOpinions(selectedAdminHeroExpertOpinions));
    setInitialEditExpertOpinions(sortHeroExpertOpinions(selectedAdminHeroExpertOpinions));
    setSubmitError(null);
    setEditPassiveSkillsOpen(false);
    setEditPassiveSkillQuery('');
    setEditImagePreviewUrl({ RU: null, EN: null });
    setEditImageUploadError({ RU: null, EN: null });
    setEditUploadingImage({ RU: false, EN: false });
    setEditImageFileName({
      RU: extractStoredImageName(selectedItem.imageObjectKeyJson.ru),
      EN: extractStoredImageName(selectedItem.imageObjectKeyJson.en),
    });
    setEditPreviewImageUrl(null);
    setEditPreviewUploadError(null);
    setEditUploadingPreview(false);
    setEditPreviewFileName(extractStoredImageName(selectedItem.previewObjectKey));
    resetImageInput('edit', 'RU');
    resetImageInput('edit', 'EN');
    resetPreviewImageInput('edit');
    setEditOpen(true);
  };

  const closeEditModal = () => {
    if (submitting || editUploadingImage.RU || editUploadingImage.EN || editUploadingPreview) return;
    setEditPassiveSkillsOpen(false);
    setEditPassiveSkillQuery('');
    setEditOpen(false);
    setEditImagePreviewUrl({ RU: null, EN: null });
    setEditImageFileName({ RU: null, EN: null });
    setEditImageUploadError({ RU: null, EN: null });
    setEditUploadingImage({ RU: false, EN: false });
    setEditPreviewImageUrl(null);
    setEditPreviewFileName(null);
    setEditPreviewUploadError(null);
    setEditUploadingPreview(false);
    setEditExpertOpinions([]);
    setInitialEditExpertOpinions([]);
    resetImageInput('edit', 'RU');
    resetImageInput('edit', 'EN');
    resetPreviewImageInput('edit');
  };

  const baseHeroes = useMemo(
    () => [...baseHeroOptions].sort((a, b) => a.name.localeCompare(b.name, locale === 'RU' ? 'ru' : 'en')),
    [baseHeroOptions, locale],
  );

  useEffect(() => {
    if (!createForm.isCostume || createForm.baseHeroId || !createBaseHeroSearch.trim()) {
      return;
    }

    const normalizedSearch = createBaseHeroSearch.trim().toLocaleLowerCase(locale === 'RU' ? 'ru' : 'en');
    const matchedBaseHero = baseHeroes.find(
      (item) => item.name.toLocaleLowerCase(locale === 'RU' ? 'ru' : 'en') === normalizedSearch,
    );

    if (matchedBaseHero) {
      setCreateForm((prev) => ({
        ...prev,
        baseHeroId: String(matchedBaseHero.id),
      }));
      setCreateBaseHeroSelectOpen(false);
    }
  }, [baseHeroes, createBaseHeroSearch, createForm.baseHeroId, createForm.isCostume, locale]);

  const hasActivePublicFilters = useMemo(
    () =>
      Boolean(publicSearch.trim()) ||
      Object.values(publicFilters).some((value) => value.length > 0),
    [publicFilters, publicSearch],
  );

  const currentAuditLabel = userEmail ?? displayName ?? userId ?? null;

  const resolveName = (list: Array<{ id: number; name: LocalizedText }>, id?: number | null) => {
    if (id == null) return t.noValue;
    const item = list.find((entry) => entry.id === id);
    return item ? getLocalizedText(item.name, locale) : `#${id}`;
  };

  const resolveItem = <T extends { id: number }>(list: T[], id?: number | null) => {
    if (id == null) return null;
    return list.find((entry) => entry.id === id) ?? null;
  };

  const resolveBaseHeroName = (id?: number | null) => {
    if (id == null) return t.noValue;
    const item = baseHeroes.find((entry) => entry.id === id);
    return item ? item.name : `#${id}`;
  };

  const sortLocalizedDictionary = useCallback(
    <T extends { id: number; name: LocalizedText }>(list: T[]) =>
      [...list].sort((a, b) =>
        getLocalizedText(a.name, locale).localeCompare(
          getLocalizedText(b.name, locale),
          locale === 'RU' ? 'ru' : 'en',
          { sensitivity: 'base' },
        ),
      ),
    [locale],
  );

  const togglePublicFilter = (key: keyof PublicCatalogFiltersState, id: number) => {
    setPublicFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((value) => value !== id)
        : [...prev[key], id],
    }));
  };

  const getPublicFilterSummary = (
    key: keyof PublicCatalogFiltersState,
    options: Array<HeroFilterOption | HeroRarityFilterOption>,
  ) => {
    const selected = options.filter((option) => publicFilters[key].includes(option.id));

    if (selected.length === 0) {
      return null;
    }

    if (selected.length === 1) {
      const option = selected[0];
      return 'stars' in option ? `${option.name} (${option.stars}*)` : option.name;
    }

    return locale === 'RU' ? `\u0412\u044b\u0431\u0440\u0430\u043d\u043e: ${selected.length}` : `${selected.length} selected`;
  };

  const getFilteredPublicOptions = (
    key: keyof PublicCatalogFiltersState,
    options: Array<HeroFilterOption | HeroRarityFilterOption>,
  ) => {
    const query = publicFilterSearch[key].trim().toLocaleLowerCase(locale === 'RU' ? 'ru' : 'en');

    if (!query) {
      return options;
    }

    return options.filter((option) => {
      const label = 'stars' in option ? `${option.name} ${option.stars}` : option.name;
      return label.toLocaleLowerCase(locale === 'RU' ? 'ru' : 'en').includes(query);
    });
  };

  const resetPublicFilters = () => {
    setPublicSearch('');
    setPublicFilters(EMPTY_PUBLIC_FILTERS);
    setPublicFilterSearch(EMPTY_PUBLIC_FILTER_SEARCH);
    setOpenPublicFilterKey(null);
    setPublicFiltersExpanded(false);
  };

  const validateForm = (form: HeroFormState): string | null => {
    if (!form.slug.trim()) return `${t.slug}: ${t.required}`;
    if (!SLUG_PATTERN.test(form.slug.trim())) return t.invalidSlug;
    if (!form.elementId) return `${t.element}: ${t.required}`;
    if (!form.rarityId) return `${t.rarity}: ${t.required}`;
    if (!form.heroClassId) return `${t.heroClass}: ${t.required}`;
    if (!form.familyId) return `${t.family}: ${t.required}`;
    if (!form.manaSpeedId) return `${t.manaSpeed}: ${t.required}`;
    if (form.isCostume && !form.baseHeroId) return t.costumeBaseHeroRequired;
    if (form.isCostume && !form.costumeIndex.trim()) {
    return locale === 'RU' ? '\u041d\u043e\u043c\u0435\u0440 \u043a\u043e\u0441\u0442\u044e\u043c\u0430 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d' : 'Costume index is required';
    }
    const localizedError =
      validateLocalizedTextPair(form.name, t.nameRu, t.nameEn) ??
      validateLocalizedTextPair(form.specialSkillName, t.skillNameRu, t.skillNameEn) ??
      validateLocalizedTextPair(form.specialSkillDescription, t.skillDescriptionRu, t.skillDescriptionEn);
    if (localizedError) return localizedError;
    for (const value of [form.baseAttack, form.baseArmor, form.baseHp]) {
      if (value.trim() && (Number.isNaN(Number(value)) || Number(value) < 0)) return t.nonNegative;
    }
    for (const value of [
      form.costumeBonusAttack,
      form.costumeBonusArmor,
      form.costumeBonusHp,
      form.costumeBonusMana,
    ]) {
      if (form.isCostume && value.trim() && (Number.isNaN(Number(value)) || Number(value) < 0)) {
        return t.nonNegative;
      }
    }
    if (form.releaseDate.trim() && !normalizeReleaseDateInput(form.releaseDate)) {
      return t.invalidReleaseDate;
    }
    return null;
  };

  const buildPayload = (form: HeroFormState): HeroMutationRequest => ({
    slug: form.slug.trim().toLowerCase(),
    nameJson: { ru: form.name.ru.trim(), en: form.name.en.trim() },
    specialSkillNameJson: {
      ru: form.specialSkillName.ru.trim(),
      en: form.specialSkillName.en.trim(),
    },
    specialSkillDescriptionJson: {
      ru: form.specialSkillDescription.ru.trim(),
      en: form.specialSkillDescription.en.trim(),
    },
    baseAttack: optionalNumber(form.baseAttack),
    baseArmor: optionalNumber(form.baseArmor),
    baseHp: optionalNumber(form.baseHp),
    elementId: Number(form.elementId),
    rarityId: Number(form.rarityId),
    heroClassId: Number(form.heroClassId),
    familyId: form.familyId ? Number(form.familyId) : null,
    manaSpeedId: Number(form.manaSpeedId),
    alphaTalentId: form.alphaTalentId ? Number(form.alphaTalentId) : null,
    imageBucketJson: form.imageBucketJson,
    imageObjectKeyJson: form.imageObjectKeyJson,
    previewBucket: form.previewBucket.trim() || null,
    previewObjectKey: form.previewObjectKey.trim() || null,
    isCostume: form.isCostume,
    baseHeroId: form.isCostume && form.baseHeroId ? Number(form.baseHeroId) : null,
    costumeIndex: form.isCostume && form.costumeIndex ? Number(form.costumeIndex) : null,
    costumeBonusJson: form.isCostume
      ? {
          attack: optionalNonNegativeInteger(form.costumeBonusAttack) ?? 0,
          armor: optionalNonNegativeInteger(form.costumeBonusArmor) ?? 0,
          hp: optionalNonNegativeInteger(form.costumeBonusHp) ?? 0,
          mana: optionalNonNegativeInteger(form.costumeBonusMana) ?? 0,
        }
      : null,
    releaseDate: normalizeReleaseDateInput(form.releaseDate) ?? null,
    status: form.status,
    updatedBy: userId ?? '',
    updatedByEmail: userEmail ?? null,
    passiveSkillIds: form.passiveSkillIds,
  });

  const validateExpertOpinions = useCallback(
    (opinions: HeroExpertOpinionDraft[]): string | null => {
      for (const opinion of opinions) {
        const validationError = validateHeroExpertOpinionDraft(opinion, locale);
        if (validationError) {
          return validationError;
        }
      }

      return null;
    },
    [locale],
  );

  const loadAdminHeroExpertOpinions = useCallback(
    async (heroId: number) => {
      setLoadingAdminHeroExpertOpinions(true);
      setAdminHeroExpertOpinionsError(null);

      try {
        const response = await apiJson<HeroExpertOpinionAdminResponseDto[]>(
          buildAdminExpertOpinionsApi(heroId),
        );
        setSelectedAdminHeroExpertOpinions(
          sortHeroExpertOpinions(response.map(mapAdminHeroExpertOpinionDto)),
        );
      } catch (error) {
        setSelectedAdminHeroExpertOpinions([]);
        setAdminHeroExpertOpinionsError(
          error instanceof Error ? error.message : 'Failed to load expert opinions',
        );
      } finally {
        setLoadingAdminHeroExpertOpinions(false);
      }
    },
    [apiJson],
  );

  const syncHeroExpertOpinions = useCallback(
    async (
      heroId: number,
      nextOpinions: HeroExpertOpinionDraft[],
      previousOpinions: HeroExpertOpinionDraft[],
    ) => {
      const previousById = new Map<number, HeroExpertOpinionDraft>();
      previousOpinions.forEach((item) => {
        if (item.id != null) {
          previousById.set(item.id, item);
        }
      });

      const nextById = new Map<number, HeroExpertOpinionDraft>();
      nextOpinions.forEach((item) => {
        if (item.id != null) {
          nextById.set(item.id, item);
        }
      });

      for (const [previousId] of previousById) {
        if (!nextById.has(previousId)) {
          await apiDeleteVoid(`${buildAdminExpertOpinionsApi(heroId)}/${previousId}`);
        }
      }

      const savedOpinions: HeroExpertOpinionDraft[] = [];
      for (const item of nextOpinions) {
        const payload = buildHeroExpertOpinionPayload(item);

        if (item.id == null) {
          const created = await apiPostJson<
            ReturnType<typeof buildHeroExpertOpinionPayload>,
            HeroExpertOpinionAdminResponseDto
          >(buildAdminExpertOpinionsApi(heroId), payload);
          savedOpinions.push(mapAdminHeroExpertOpinionDto(created));
          continue;
        }

        const updated = await apiPutJson<
          ReturnType<typeof buildHeroExpertOpinionPayload>,
          HeroExpertOpinionAdminResponseDto
        >(`${buildAdminExpertOpinionsApi(heroId)}/${item.id}`, payload);
        savedOpinions.push(mapAdminHeroExpertOpinionDto(updated));
      }

      return sortHeroExpertOpinions(savedOpinions);
    },
    [apiDeleteVoid, apiPostJson, apiPutJson],
  );

  useEffect(() => {
    if (adminMode && selectedId !== null) {
      void loadDetails(selectedId);
      void loadAdminVariants(selectedId);
      void loadAdminHeroExpertOpinions(selectedId);
    } else if (adminMode) {
      setSelectedAdminVariants(null);
      setSelectedAdminHeroExpertOpinions([]);
      setAdminHeroExpertOpinionsError(null);
    }
  }, [adminMode, selectedId, loadAdminHeroExpertOpinions, loadAdminVariants, loadDetails]);

  const upsertHero = (dto: AdminHeroResponseDto) => {
    const hero = mapHero(dto);
    setItems((prev) => {
      const next = prev.some((item) => item.id === hero.id)
        ? prev.map((item) => (item.id === hero.id ? hero : item))
        : [...prev, hero];
      return next.sort((a, b) => a.id - b.id);
    });
    setSelectedId(hero.id);
    setSelectedItem(hero);
    void loadAdminVariants(hero.id);
  };

  const handleCreate = async () => {
    if (!userId) {
      setSubmitError('Missing user id for update audit');
      return;
    }

    if (createImageUploadError.RU || createImageUploadError.EN || createPreviewUploadError) {
      setSubmitError(createImageUploadError.RU ?? createImageUploadError.EN ?? createPreviewUploadError);
      return;
    }

    const error = validateForm(createForm);
    if (error) return setSubmitError(error);
    const expertOpinionsError = validateExpertOpinions(createExpertOpinions);
    if (expertOpinionsError) return setSubmitError(expertOpinionsError);
    if (createSlugAvailable === false) {
      return setSubmitError(t.slugExists);
    }
    if (createSlugCheckLoading) {
      return setSubmitError(t.slugChecking);
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await apiPostJson<HeroMutationRequest, AdminHeroResponseDto>(ADMIN_API, buildPayload(createForm));
      let savedExpertOpinions: HeroExpertOpinionDraft[] = [];

      try {
        savedExpertOpinions = await syncHeroExpertOpinions(created.id, createExpertOpinions, []);
      } catch (opinionError) {
        upsertHero(created);
        await loadAdminHeroExpertOpinions(created.id);
        resetCreateModalState();
        setCreatePassiveSkillsOpen(false);
        setCreatePassiveSkillQuery('');
        setCreateExpertOpinions([]);
        setCreateOpen(false);
        setSubmitError(
          opinionError instanceof Error
            ? `Hero created, but expert opinions sync failed: ${opinionError.message}`
            : 'Hero created, but expert opinions sync failed',
        );
        return;
      }

      upsertHero(created);
      setSelectedAdminHeroExpertOpinions(savedExpertOpinions);
      resetCreateModalState();
      setCreatePassiveSkillsOpen(false);
      setCreatePassiveSkillQuery('');
      setCreateExpertOpinions([]);
      setCreateOpen(false);
    } catch (error) {
      setSubmitError(error instanceof ApiError || error instanceof Error ? error.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    if (!userId) {
      setSubmitError('Missing user id for update audit');
      return;
    }

    if (editImageUploadError.RU || editImageUploadError.EN || editPreviewUploadError) {
      setSubmitError(editImageUploadError.RU ?? editImageUploadError.EN ?? editPreviewUploadError);
      return;
    }

    const error = validateForm(editForm);
    if (error) return setSubmitError(error);
    const expertOpinionsError = validateExpertOpinions(editExpertOpinions);
    if (expertOpinionsError) return setSubmitError(expertOpinionsError);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await apiPutJson<HeroMutationRequest, AdminHeroResponseDto>(`${ADMIN_API}/${selectedItem.id}`, buildPayload(editForm));
      let savedExpertOpinions: HeroExpertOpinionDraft[] = [];

      try {
        savedExpertOpinions = await syncHeroExpertOpinions(
          selectedItem.id,
          editExpertOpinions,
          initialEditExpertOpinions,
        );
      } catch (opinionError) {
        upsertHero(updated);
        await loadAdminHeroExpertOpinions(selectedItem.id);
        setSubmitError(
          opinionError instanceof Error
            ? `Hero updated, but expert opinions sync failed: ${opinionError.message}`
            : 'Hero updated, but expert opinions sync failed',
        );
        setEditOpen(false);
        return;
      }

      upsertHero(updated);
      setSelectedAdminHeroExpertOpinions(savedExpertOpinions);
      setInitialEditExpertOpinions(savedExpertOpinions);
      setEditPassiveSkillsOpen(false);
      setEditPassiveSkillQuery('');
      setEditOpen(false);
      setEditImagePreviewUrl({ RU: null, EN: null });
      setEditImageFileName({ RU: null, EN: null });
      setEditImageUploadError({ RU: null, EN: null });
      setEditUploadingImage({ RU: false, EN: false });
      setEditPreviewImageUrl(null);
      setEditPreviewFileName(null);
      setEditPreviewUploadError(null);
      setEditUploadingPreview(false);
      setEditExpertOpinions([]);
      setInitialEditExpertOpinions([]);
      resetImageInput('edit', 'RU');
      resetImageInput('edit', 'EN');
      resetPreviewImageInput('edit');
    } catch (error) {
      setSubmitError(error instanceof ApiError || error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm(t.deleteConfirm(getLocalizedText(selectedItem.name, locale) || selectedItem.slug))) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiDeleteVoid(`${ADMIN_API}/${selectedItem.id}`);
      const next = items.filter((item) => item.id !== selectedItem.id);
      setItems(next);
      setSelectedItem(null);
      setSelectedAdminHeroExpertOpinions([]);
      setAdminHeroExpertOpinionsError(null);
      setSelectedId(next[0]?.id ?? null);
    } catch (error) {
      setSubmitError(error instanceof ApiError || error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = (
    form: HeroFormState,
    setForm: Dispatch<SetStateAction<HeroFormState>>,
    isEdit: boolean,
  ) => {
    const imagePreviewUrl = isEdit ? editImagePreviewUrl : createImagePreviewUrl;
    const imageFileName = isEdit ? editImageFileName : createImageFileName;
    const imageUploadError = isEdit ? editImageUploadError : createImageUploadError;
    const uploadingImage = isEdit ? editUploadingImage : createUploadingImage;
    const previewImageUrl = isEdit ? editPreviewImageUrl : createPreviewImageUrl;
    const previewFileName = isEdit ? editPreviewFileName : createPreviewFileName;
    const previewUploadError = isEdit ? editPreviewUploadError : createPreviewUploadError;
    const uploadingPreview = isEdit ? editUploadingPreview : createUploadingPreview;
    const heroImageSectionTitle = locale === 'RU' ? '\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0438 \u0433\u0435\u0440\u043e\u044f' : 'Hero images';
    const previewImageSectionTitle = locale === 'RU' ? '\u041f\u0440\u0435\u0432\u044c\u044e \u0433\u0435\u0440\u043e\u044f' : 'Hero preview';
    const ruImageLabel = locale === 'RU' ? '\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0430 RU' : 'RU image';
    const enImageLabel = locale === 'RU' ? '\u041a\u0430\u0440\u0442\u0438\u043d\u043a\u0430 EN' : 'EN image';
    const passiveSkillsTitle = locale === 'RU' ? '\u041f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438' : 'Passive skills';
    const noPassiveSkillsLabel = locale === 'RU' ? '\u041f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438 \u043d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u044b' : 'No passive skills selected';
    const addPassiveSkillLabel = locale === 'RU' ? '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0439 \u043d\u0430\u0432\u044b\u043a' : 'Add passive skill';
    const availablePassiveSkillsLabel = locale === 'RU' ? '\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0435 \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438' : 'Available passive skills';
    const hidePassiveSkillsLabel = locale === 'RU' ? '\u0421\u043a\u0440\u044b\u0442\u044c \u0441\u043f\u0438\u0441\u043e\u043a' : 'Hide list';
    const noAvailablePassiveSkillsLabel = locale === 'RU' ? '\u0412\u0441\u0435 \u043f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438 \u0443\u0436\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u044b' : 'All passive skills are already selected';
    const noPassiveSkillSearchResultsLabel = locale === 'RU' ? '\u041f\u043e \u0432\u0430\u0448\u0435\u043c\u0443 \u0437\u0430\u043f\u0440\u043e\u0441\u0443 \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e' : 'No skills found for your search';
    const addPassiveSkillActionLabel = locale === 'RU' ? '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c' : 'Add';
    const removePassiveSkillActionLabel = locale === 'RU' ? '\u0423\u0434\u0430\u043b\u0438\u0442\u044c' : 'Remove';
    const searchPassiveSkillsLabel = locale === 'RU' ? '\u041f\u043e\u0438\u0441\u043a \u043d\u0430\u0432\u044b\u043a\u0430' : 'Search skill';
    const localizedUploadFields: Array<{ imageLocale: HeroLocale; label: string }> = [
      { imageLocale: 'RU', label: ruImageLabel },
      { imageLocale: 'EN', label: enImageLabel },
    ];
    const passiveSkillQuery = isEdit ? editPassiveSkillQuery : createPassiveSkillQuery;
    const setPassiveSkillQuery = isEdit ? setEditPassiveSkillQuery : setCreatePassiveSkillQuery;
    const normalizedPassiveSkillQuery = passiveSkillQuery.trim().toLocaleLowerCase(locale === 'RU' ? 'ru-RU' : 'en-US');
    const unselectedPassiveSkills = passiveSkills
      .filter((skill) => !form.passiveSkillIds.includes(skill.id))
      .sort((a, b) =>
        getLocalizedText(a.name, locale).localeCompare(getLocalizedText(b.name, locale), locale === 'RU' ? 'ru' : 'en'),
      );
    const availablePassiveSkills = unselectedPassiveSkills
      .filter((skill) =>
        normalizedPassiveSkillQuery.length === 0
          ? true
          : getLocalizedText(skill.name, locale).toLocaleLowerCase(locale === 'RU' ? 'ru-RU' : 'en-US').includes(normalizedPassiveSkillQuery),
      );
    const passiveSkillsPickerOpen = isEdit ? isEditPassiveSkillsOpen : isCreatePassiveSkillsOpen;
    const setPassiveSkillsPickerOpen = isEdit ? setEditPassiveSkillsOpen : setCreatePassiveSkillsOpen;
    const getFileInputRef = (imageLocale: HeroLocale) => {
      if (isEdit) {
        return imageLocale === 'RU' ? editRuImageInputRef : editEnImageInputRef;
      }

      return imageLocale === 'RU' ? createRuImageInputRef : createEnImageInputRef;
    };
    const sortedElements = sortLocalizedDictionary(elements);
    const sortedRarities = sortLocalizedDictionary(rarities);
    const sortedHeroClasses = sortLocalizedDictionary(heroClasses);
    const sortedManaSpeeds = sortLocalizedDictionary(manaSpeeds);
    const sortedFamilies = sortLocalizedDictionary(families);
    const sortedAlphaTalents = sortLocalizedDictionary(alphaTalents);
    const elementOptions = sortedElements.map((item) => ({
      value: String(item.id),
      label: getLocalizedText(item.name, locale),
      imageUrl: item.imageUrl,
    }));
    const rarityOptions = sortedRarities.map((item) => ({
      value: String(item.id),
      label: getLocalizedText(item.name, locale),
      imageUrl: item.imageUrl,
      badge: `${item.stars}★`,
    }));
    const heroClassOptions = sortedHeroClasses.map((item) => ({
      value: String(item.id),
      label: getLocalizedText(item.name, locale),
      imageUrl: item.imageUrl,
    }));
    const familyOptions = sortedFamilies.map((item) => ({
      value: String(item.id),
      label: getLocalizedText(item.name, locale),
      imageUrl: item.imageUrl,
    }));
    const alphaTalentOptions = sortedAlphaTalents.map((item) => ({
      value: String(item.id),
      label: getLocalizedText(item.name, locale),
      imageUrl: item.imageUrl,
    }));
    const baseHeroSelectOptions = baseHeroes
      .filter((item) => !isEdit || item.id !== selectedItem?.id)
      .map((item) => ({
        value: String(item.id),
        label: item.name,
      }));

    return (
    <div className="space-y-6">
      {submitError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{submitError}</div>}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.slug}</span>
        <input
          type="text"
          value={form.slug}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              slug: applyCostumeSlugSuffix(slugifyHeroName(e.target.value), prev.isCostume, prev.costumeIndex),
            }))
          }
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
        />
        <span className="text-xs text-[var(--foreground-muted)]">{t.slugHint}</span>
        {!isEdit && createForm.slug.trim() ? (
          <span
            className={`text-xs ${
              createSlugAvailable === false
                ? 'text-red-300'
                : createSlugAvailable === true
                  ? 'text-emerald-300'
                  : 'text-[var(--foreground-muted)]'
            }`}
          >
            {createSlugCheckLoading
              ? t.slugChecking
              : createSlugAvailable === false
                ? t.slugExists
                : createSlugAvailable === true
                  ? t.slugAvailable
                  : null}
          </span>
        ) : null}
      </label>
      <LocalizedTextFields value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} ruLabel={t.nameRu} enLabel={t.nameEn} />
      <LocalizedTextFields value={form.specialSkillName} onChange={(value) => setForm((prev) => ({ ...prev, specialSkillName: value }))} ruLabel={t.skillNameRu} enLabel={t.skillNameEn} />
      <LocalizedTextareaFields value={form.specialSkillDescription} onChange={(value) => setForm((prev) => ({ ...prev, specialSkillDescription: value }))} ruLabel={t.skillDescriptionRu} enLabel={t.skillDescriptionEn} rows={5} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SearchableSelectField
          label={t.element}
          value={form.elementId}
          onChange={(value) => setForm((prev) => ({ ...prev, elementId: value }))}
          options={elementOptions}
          placeholder={t.selectElement}
          searchPlaceholder={locale === 'RU' ? 'Поиск элемента' : 'Search element'}
          searchAriaLabel={locale === 'RU' ? 'Поиск элемента' : 'Search element'}
          clearSearchLabel={locale === 'RU' ? 'Очистить поиск элемента' : 'Clear element search'}
          noResultsLabel={locale === 'RU' ? 'Элемент не найден' : 'No element found'}
        />
        <SearchableSelectField
          label={t.rarity}
          value={form.rarityId}
          onChange={(value) => setForm((prev) => ({ ...prev, rarityId: value }))}
          options={rarityOptions}
          placeholder={t.selectRarity}
          searchPlaceholder={locale === 'RU' ? 'Поиск редкости' : 'Search rarity'}
          searchAriaLabel={locale === 'RU' ? 'Поиск редкости' : 'Search rarity'}
          clearSearchLabel={locale === 'RU' ? 'Очистить поиск редкости' : 'Clear rarity search'}
          noResultsLabel={locale === 'RU' ? 'Редкость не найдена' : 'No rarity found'}
        />
        <SearchableSelectField
          label={t.heroClass}
          value={form.heroClassId}
          onChange={(value) => setForm((prev) => ({ ...prev, heroClassId: value }))}
          options={heroClassOptions}
          placeholder={t.selectHeroClass}
          searchPlaceholder={locale === 'RU' ? 'Поиск класса героя' : 'Search hero class'}
          searchAriaLabel={locale === 'RU' ? 'Поиск класса героя' : 'Search hero class'}
          clearSearchLabel={locale === 'RU' ? 'Очистить поиск класса' : 'Clear hero class search'}
          noResultsLabel={locale === 'RU' ? 'Класс героя не найден' : 'No hero class found'}
        />
        <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.manaSpeed}</span><select value={form.manaSpeedId} onChange={(e) => setForm((prev) => ({ ...prev, manaSpeedId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.selectManaSpeed}</option>{sortedManaSpeeds.map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)}</option>)}</select></label>
        <SearchableSelectField
          label={t.family}
          value={form.familyId}
          onChange={(value) => setForm((prev) => ({ ...prev, familyId: value }))}
          options={familyOptions}
          placeholder={t.noFamily}
          searchPlaceholder={locale === 'RU' ? 'Поиск семьи' : 'Search family'}
          searchAriaLabel={locale === 'RU' ? 'Поиск семьи' : 'Search family'}
          clearSearchLabel={locale === 'RU' ? 'Очистить поиск семьи' : 'Clear family search'}
          emptyOptionLabel={t.noFamily}
          noResultsLabel={locale === 'RU' ? 'Семья не найдена' : 'No family found'}
        />
        <SearchableSelectField
          label={t.alphaTalent}
          value={form.alphaTalentId}
          onChange={(value) => setForm((prev) => ({ ...prev, alphaTalentId: value }))}
          options={alphaTalentOptions}
          placeholder={t.noAlphaTalent}
          searchPlaceholder={locale === 'RU' ? 'Поиск альфа-таланта' : 'Search alpha talent'}
          searchAriaLabel={locale === 'RU' ? 'Поиск альфа-таланта' : 'Search alpha talent'}
          clearSearchLabel={locale === 'RU' ? 'Очистить поиск альфа-таланта' : 'Clear alpha talent search'}
          emptyOptionLabel={t.noAlphaTalent}
          noResultsLabel={locale === 'RU' ? 'Альфа-талант не найден' : 'No alpha talent found'}
        />
      </div>
      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold text-[var(--foreground)]">{heroImageSectionTitle}</div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {localizedUploadFields.map(({ imageLocale, label }) => (
            <div key={imageLocale} className="space-y-3">
              <div className="text-sm font-medium text-[var(--foreground-soft)]">{label}</div>
              <HeroImageUploadField
                locale={locale}
                fileInputRef={getFileInputRef(imageLocale)}
                uploading={uploadingImage[imageLocale]}
                uploadedImageUrl={imagePreviewUrl[imageLocale]}
                storedImageUrl={isEdit ? getLocalizedImageValue(selectedItem?.imageUrlJson, imageLocale) : null}
                uploadedFileName={imageFileName[imageLocale]}
                imageUploadError={imageUploadError[imageLocale]}
                hasStoredImage={hasLocalizedImage(form, imageLocale)}
                storedImageLabel={extractStoredImageName(
                  getLocalizedImageValue(form.imageObjectKeyJson, imageLocale),
                )}
                disabled={submitting}
                onSelect={(file) => handleHeroImageSelected(isEdit ? 'edit' : 'create', imageLocale, file)}
                onClear={() => clearUploadedImageState(isEdit ? 'edit' : 'create', imageLocale)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold text-[var(--foreground)]">{previewImageSectionTitle}</div>
        <HeroPreviewUploadField
          locale={locale}
          fileInputRef={isEdit ? editPreviewImageInputRef : createPreviewImageInputRef}
          uploading={uploadingPreview}
          uploadedImageUrl={previewImageUrl}
          storedImageUrl={isEdit ? selectedItem?.previewUrl ?? null : null}
          uploadedFileName={previewFileName}
          imageUploadError={previewUploadError}
          hasStoredImage={hasPreviewImage(form)}
          storedImageLabel={extractStoredImageName(form.previewObjectKey)}
          disabled={submitting}
          onSelect={(file) => handlePreviewImageSelected(isEdit ? 'edit' : 'create', file)}
          onClear={() => clearUploadedPreviewState(isEdit ? 'edit' : 'create')}
        />
      </div>
      <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold text-[var(--foreground)]">{passiveSkillsTitle}</div>
        {passiveSkills.length === 0 ? (
          <div className="text-sm text-[var(--foreground-soft)]">{noPassiveSkillsLabel}</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--foreground-soft)]">{availablePassiveSkillsLabel}</span>
                <button
                  type="button"
                  onClick={() => setPassiveSkillsPickerOpen((prev) => !prev)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                >
                  {passiveSkillsPickerOpen ? hidePassiveSkillsLabel : addPassiveSkillLabel}
                </button>
              </div>

              {passiveSkillsPickerOpen ? (
                <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
                  <SearchField
                    value={passiveSkillQuery}
                    onChange={setPassiveSkillQuery}
                    placeholder={searchPassiveSkillsLabel}
                    ariaLabel={searchPassiveSkillsLabel}
                    clearLabel={locale === 'RU' ? '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a' : 'Clear search'}
                  />
                  {unselectedPassiveSkills.length === 0 ? (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
                      {noAvailablePassiveSkillsLabel}
                    </div>
                  ) : availablePassiveSkills.length === 0 ? (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
                      {noPassiveSkillSearchResultsLabel}
                    </div>
                  ) : (
                    availablePassiveSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/10 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                          <DictionaryMiniIcon
                            imageUrl={skill.imageUrl}
                            label={getLocalizedText(skill.name, locale)}
                            size={20}
                            className="border-white/10 bg-white/5"
                          />
                          <span>{getLocalizedText(skill.name, locale)}</span>
                          <HeroInfoPopover
                            label={getLocalizedText(skill.name, locale)}
                            content={getLocalizedText(skill.description, locale)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              passiveSkillIds: [...prev.passiveSkillIds, skill.id],
                            }));
                            setPassiveSkillQuery('');
                          }}
                          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/15"
                        >
                          {addPassiveSkillActionLabel}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            {form.passiveSkillIds.length === 0 ? (
              <div className="text-sm text-[var(--foreground-soft)]">{noPassiveSkillsLabel}</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.passiveSkillIds.map((skillId) => {
                  const skill = passiveSkills.find((item) => item.id === skillId);
                  if (!skill) return null;

                  return (
                    <div
                      key={skill.id}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200"
                    >
                      <DictionaryMiniIcon
                        imageUrl={skill.imageUrl}
                        label={getLocalizedText(skill.name, locale)}
                        size={18}
                        className="border-cyan-300/20 bg-cyan-950/40"
                      />
                      <span>{getLocalizedText(skill.name, locale)}</span>
                      <HeroInfoPopover
                        label={getLocalizedText(skill.name, locale)}
                        content={getLocalizedText(skill.description, locale)}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            passiveSkillIds: prev.passiveSkillIds.filter((id) => id !== skill.id),
                          }))
                        }
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/80 transition hover:bg-white/10"
                        aria-label={`${removePassiveSkillActionLabel} ${getLocalizedText(skill.name, locale)}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <HeroExpertOpinionsEditor
        locale={locale}
        value={isEdit ? editExpertOpinions : createExpertOpinions}
        onChange={isEdit ? setEditExpertOpinions : setCreateExpertOpinions}
        disabled={submitting}
        createMode={!isEdit}
      />
      <div><div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.stats}</div><div className="mb-3 text-xs text-[var(--foreground-muted)]">{t.statsHint}</div><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><input type="number" min="0" value={form.baseAttack} onChange={(e) => setForm((prev) => ({ ...prev, baseAttack: e.target.value }))} placeholder={t.baseAttack} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /><input type="number" min="0" value={form.baseArmor} onChange={(e) => setForm((prev) => ({ ...prev, baseArmor: e.target.value }))} placeholder={t.baseArmor} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /><input type="number" min="0" value={form.baseHp} onChange={(e) => setForm((prev) => ({ ...prev, baseHp: e.target.value }))} placeholder={t.baseHp} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></div></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.status}</span><select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as HeroStatus }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none">{(['DRAFT', 'READY', 'HIDDEN', 'ARCHIVED'] as HeroStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.releaseDate}</span><input type="text" inputMode="text" value={form.releaseDate} onChange={(e) => setForm((prev) => ({ ...prev, releaseDate: e.target.value }))} onBlur={(e) => { const normalizedValue = normalizeReleaseDateInput(e.target.value); if (!e.target.value.trim()) { setForm((prev) => ({ ...prev, releaseDate: '' })); return; } if (normalizedValue) { setForm((prev) => ({ ...prev, releaseDate: normalizedValue })); } }} placeholder={t.releaseDatePlaceholder} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /><span className="text-xs text-[var(--foreground-muted)]">{t.releaseDateHint}</span></label></div>
      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"><input type="checkbox" checked={form.isCostume} onChange={(e) => setForm((prev) => ({ ...prev, isCostume: e.target.checked, baseHeroId: e.target.checked ? prev.baseHeroId : '', costumeIndex: e.target.checked ? prev.costumeIndex : '', costumeBonusAttack: e.target.checked ? prev.costumeBonusAttack : '', costumeBonusArmor: e.target.checked ? prev.costumeBonusArmor : '', costumeBonusHp: e.target.checked ? prev.costumeBonusHp : '', costumeBonusMana: e.target.checked ? prev.costumeBonusMana : '', slug: applyCostumeSlugSuffix(slugifyHeroName(prev.name.en), e.target.checked, prev.costumeIndex) }))} /><span className="text-sm text-[var(--foreground-soft)]">{t.isCostume}</span></label>
{form.isCostume && <div className="space-y-4"><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><SearchableSelectField label={t.baseHero} value={form.baseHeroId} onChange={(value) => { setForm((prev) => ({ ...prev, baseHeroId: value })); if (!isEdit) { setCreateBaseHeroSelectOpen(false); } }} options={baseHeroSelectOptions} placeholder={t.selectBaseHero} searchPlaceholder={locale === 'RU' ? 'Поиск базового героя' : 'Search base hero'} searchAriaLabel={locale === 'RU' ? 'Поиск базового героя' : 'Search base hero'} clearSearchLabel={locale === 'RU' ? 'Очистить поиск героя' : 'Clear hero search'} noResultsLabel={locale === 'RU' ? 'Базовый герой не найден' : 'No base hero found'} searchQuery={!isEdit ? createBaseHeroSearch : undefined} onSearchQueryChange={!isEdit ? setCreateBaseHeroSearch : undefined} open={!isEdit ? createBaseHeroSelectOpen : undefined} onOpenChange={!isEdit ? setCreateBaseHeroSelectOpen : undefined} /><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.costumeIndexLabel}</span><input type="number" min="1" value={form.costumeIndex} onChange={(e) => setForm((prev) => ({ ...prev, costumeIndex: e.target.value, slug: applyCostumeSlugSuffix(slugifyHeroName(prev.name.en), prev.isCostume, e.target.value) }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><div className="mb-3 flex items-center gap-3"><DictionaryMiniIcon imageUrl="/dictionary-icons/costume.png" label={locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'} size={34} chromeless fallbackToLetter={false} /><span className="text-base font-bold text-[var(--foreground)]">{locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}</span></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{locale === 'RU' ? '\u0411\u043e\u043d\u0443\u0441 \u043a \u0430\u0442\u0430\u043a\u0435, %' : 'Attack bonus, %'}</span><input type="number" min="0" value={form.costumeBonusAttack} onChange={(e) => setForm((prev) => ({ ...prev, costumeBonusAttack: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{locale === 'RU' ? '\u0411\u043e\u043d\u0443\u0441 \u043a \u0437\u0430\u0449\u0438\u0442\u0435, %' : 'Defence bonus, %'}</span><input type="number" min="0" value={form.costumeBonusArmor} onChange={(e) => setForm((prev) => ({ ...prev, costumeBonusArmor: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{locale === 'RU' ? '\u0411\u043e\u043d\u0443\u0441 \u043a \u0437\u0434\u043e\u0440\u043e\u0432\u044c\u044e, %' : 'Health bonus, %'}</span><input type="number" min="0" value={form.costumeBonusHp} onChange={(e) => setForm((prev) => ({ ...prev, costumeBonusHp: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{locale === 'RU' ? '\u0411\u043e\u043d\u0443\u0441 \u043a \u043c\u0430\u043d\u0435, %' : 'Mana bonus, %'}</span><input type="number" min="0" value={form.costumeBonusMana} onChange={(e) => setForm((prev) => ({ ...prev, costumeBonusMana: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label></div></div></div>}
      {currentAuditLabel && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-xs text-[var(--foreground-muted)]">{t.updatedBy}: {currentAuditLabel}</div>}
    </div>
  );
  };

  const handleOpenPublicHero = async (hero: PublicHeroCardItem) => {
    syncPublicHeroQuery(hero.slug);
    await openPublicHeroBySlug(hero.slug, hero);
  };

  const handleOpenPublicHeroBySlug = async (slug: string) => {
    syncPublicHeroQuery(slug);
    await openPublicHeroBySlug(slug, findBaseHeroCardBySlug(slug) ?? null);
  };

  const handleClosePublicHero = () => {
    syncPublicHeroQuery(null, 'replace');
    closePublicHeroState();
  };

  if (!adminMode) {
    return (
      <>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{t.title}</h3>
          </div>
          <div className="mb-6 space-y-4">
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.searchHeroes}</span>
                <SearchField
                  value={publicSearch}
                  onChange={setPublicSearch}
                  placeholder={locale === 'RU' ? '\u0418\u043c\u044f \u0433\u0435\u0440\u043e\u044f' : 'Hero name'}
                  ariaLabel={t.searchHeroes}
                  clearLabel={locale === 'RU' ? '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a' : 'Clear search'}
                />
              </div>
            </div>

            {publicFilterOptions ? (
              <div ref={publicFiltersPanelRef} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--foreground)]">{t.filters}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPublicFiltersExpanded((prev) => !prev);
                        if (publicFiltersExpanded) {
                          setOpenPublicFilterKey(null);
                        }
                      }}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                    >
                      {publicFiltersExpanded
                        ? `${locale === 'RU' ? '\u0421\u043a\u0440\u044b\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440\u044b' : 'Hide filters'} \u25b4`
                        : `${locale === 'RU' ? '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440\u044b' : 'Show filters'} \u25be`}
                    </button>
                    <button
                      type="button"
                      onClick={resetPublicFilters}
                      disabled={!hasActivePublicFilters}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t.resetFilters}
                    </button>
                  </div>
                </div>
                {publicFiltersExpanded ? (
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'elementIds', label: t.element, options: publicFilterOptions.elements },
                    { key: 'rarityIds', label: t.rarity, options: publicFilterOptions.rarities },
                    { key: 'heroClassIds', label: t.heroClass, options: publicFilterOptions.heroClasses },
                    { key: 'familyIds', label: t.family, options: publicFilterOptions.families },
                    { key: 'manaSpeedIds', label: t.manaSpeed, options: publicFilterOptions.manaSpeeds },
                    { key: 'alphaTalentIds', label: t.alphaTalent, options: publicFilterOptions.alphaTalents },
                  ] as Array<{
                    key: keyof PublicCatalogFiltersState;
                    label: string;
                    options: Array<HeroFilterOption | HeroRarityFilterOption>;
                  }>).map((group) => {
                    const selectedCount = publicFilters[group.key].length;
                    const summary = getPublicFilterSummary(group.key, group.options);
                    const isOpen = openPublicFilterKey === group.key;
                    const filteredOptions = getFilteredPublicOptions(group.key, group.options);

                    return (
                      <div key={group.key} className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenPublicFilterKey((prev) => (prev === group.key ? null : group.key))
                          }
                          className={`min-w-[160px] rounded-xl border px-3 py-2 text-left text-xs transition ${
                            selectedCount > 0
                              ? 'border-[var(--accent-text-strong)]/35 bg-[color-mix(in_srgb,var(--accent-text)_14%,transparent)] text-[var(--foreground)]'
                              : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{group.label}</span>
                            <span className="text-[10px] text-[var(--foreground-muted)]">
                              {isOpen ? '\u25b4' : '\u25be'}
                            </span>
                          </div>
                          <div className="mt-1 truncate text-[11px] text-[var(--foreground-muted)]">
                            {summary ?? (locale === 'RU' ? '\u041d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u043e' : 'Not selected')}
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="absolute left-0 top-full z-20 mt-2 w-[260px] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                              {group.label}
                            </div>
                            <SearchField
                              value={publicFilterSearch[group.key]}
                              onChange={(value) =>
                                setPublicFilterSearch((prev) => ({
                                  ...prev,
                                  [group.key]: value,
                                }))
                              }
                              placeholder={
                                locale === 'RU'
                                  ? `Поиск: ${group.label.toLowerCase()}`
                                  : `Search ${group.label.toLowerCase()}`
                              }
                              ariaLabel={
                                locale === 'RU'
                                  ? `Поиск по фильтру ${group.label.toLowerCase()}`
                                  : `Search ${group.label.toLowerCase()} filter`
                              }
                              clearLabel={locale === 'RU' ? 'Очистить поиск фильтра' : 'Clear filter search'}
                              className="mb-3"
                            />
                            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                              {filteredOptions.map((option) => {
                                const isSelected = publicFilters[group.key].includes(option.id);
                                const label =
                                  'stars' in option ? `${option.name} (${option.stars}*)` : option.name;

                                return (
                                  <label
                                    key={option.id}
                                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent bg-black/10 px-3 py-2 text-xs text-[var(--foreground)] transition hover:border-cyan-400/20 hover:bg-black/20"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => togglePublicFilter(group.key, option.id)}
                                      className="mt-0.5 h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-cyan-400"
                                    />
                                    <span className="flex min-w-0 items-center gap-2 leading-5">
                                      {'imageUrl' in option ? (
                                        <DictionaryMiniIcon
                                          imageUrl={option.imageUrl}
                                          label={label}
                                          size={18}
                                          className="border-white/10 bg-white/5"
                                        />
                                      ) : null}
                                      <span className="truncate">{label}</span>
                                    </span>
                                  </label>
                                );
                              })}
                              {filteredOptions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[var(--border)] px-3 py-3 text-xs text-[var(--foreground-soft)]">
                                  {t.noResults}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {listError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{listError}</div>}
          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{t.loading}</div>
          ) : publicItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{hasActivePublicFilters ? t.noResults : t.empty}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {publicItems.map((hero) => (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => void handleOpenPublicHero(hero)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-cyan-400/40 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(59,130,246,0.18),rgba(15,23,42,0.06))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      {hero.imageUrl ? (
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_58%)]" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={hero.imageUrl}
                            alt={hero.name}
                            className="relative z-10 h-full w-full scale-[0.94] object-contain object-top"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/18 to-transparent" />
                        </div>
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center px-4 text-center text-sm text-[var(--foreground-muted)]">
                          Hero image
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-semibold text-[var(--foreground)] md:text-2xl">{hero.name}</div>
                    <div className="mt-3 space-y-1 text-xs text-[var(--foreground-soft)]">
                      <div>{t.element}: {hero.elementName}</div>
                      <div>{t.rarity}: {hero.rarityName} ({hero.rarityStars}*)</div>
                      <div>{t.heroClass}: {hero.heroClassName}</div>
                      <div>{t.manaSpeed}: {hero.manaSpeedName}</div>
                    </div>
                  </button>
                ))}
              </div>
              {publicPage?.hasNext ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => void handleLoadMorePublic()}
                    disabled={loadingMorePublic}
                    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMorePublic ? t.loading : t.loadMore}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <PublicHeroDetailsModal
          open={isPublicDetailsOpen}
          locale={locale}
          heroCard={selectedPublicHero}
          heroDetails={selectedPublicHeroDetails}
          heroVariants={selectedPublicHeroVariants}
          heroExpertOpinions={selectedPublicHeroExpertOpinions}
          heroExpertOpinionsLoading={loadingPublicHeroExpertOpinions}
          heroExpertOpinionsError={publicHeroExpertOpinionsError}
          loading={loadingPublicDetails}
          error={publicDetailsError}
          onClose={handleClosePublicHero}
          onOpenRelatedHero={(slug) => void handleOpenPublicHeroBySlug(slug)}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h3 className="text-lg font-semibold text-[var(--foreground)]">{t.title}</h3><p className="text-sm text-[var(--foreground-soft)]">{t.adminSubtitle}</p></div>
            <button type="button" onClick={openCreateModal} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15">{t.create}</button>
          </div>
          <SearchField
            className="mb-4 block"
            value={adminSearch}
            onChange={setAdminSearch}
            placeholder={t.adminSearchPlaceholder}
            ariaLabel={t.search}
            clearLabel={locale === 'RU' ? '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a' : 'Clear search'}
          />
          {listError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{listError}</div>}
          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{t.loading}</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{adminSearch.trim() ? t.noResults : t.empty}</div>
          ) : (
            <div className="space-y-3">
              {items.map((hero) => <button key={hero.id} type="button" onClick={() => setSelectedId(hero.id)} className={`w-full rounded-2xl border p-4 text-left transition ${hero.id === selectedId ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'}`}><div className="text-sm font-semibold text-[var(--foreground)]">{getLocalizedText(hero.name, locale)}</div><div className="mt-2 text-xs text-[var(--foreground-soft)]">{t.slug}: {hero.slug}</div><div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--foreground-muted)]">{hero.status}</div></button>)}
              {adminCatalogPage?.hasNext ? (
                <button
                  type="button"
                  onClick={() => void handleLoadMoreAdmin()}
                  disabled={loadingMoreAdmin}
                  className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMoreAdmin ? t.loading : t.loadMore}
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-semibold text-[var(--foreground)]">{t.detailsTitle}</h3><p className="text-sm text-[var(--foreground-soft)]">{t.detailsSubtitle}</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" disabled={!selectedItem || loadingDetails} onClick={openEditModal} className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300">{t.edit}</button><button type="button" disabled={!selectedItem || submitting || loadingDetails} onClick={handleDelete} className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50">{t.delete}</button></div>
          </div>
          {submitError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{submitError}</div>}
          {detailsError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{detailsError}</div>}
          {loadingDetails ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">{t.loadingDetails}</div>
          ) : !selectedItem ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">{t.selectHero}</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center gap-4">
                  {selectedItem.previewUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.previewUrl}
                        alt={getLocalizedText(selectedItem.name, locale)}
                        className="h-20 w-20 object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold text-[var(--foreground)]">{getLocalizedText(selectedItem.name, locale)}</div>
                    <div className="mt-1 text-sm text-[var(--foreground-soft)]">{selectedItem.slug}</div>
                  </div>
                </div>
              </div>
              {(getLocalizedImageValue(selectedItem.imageObjectKeyJson, 'RU') || getLocalizedImageValue(selectedItem.imageObjectKeyJson, 'EN')) && (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                    {(['RU', 'EN'] as HeroLocale[]).map((imageLocale) => {
                      const imageUrl = getLocalizedImageValue(selectedItem.imageUrlJson, imageLocale);
                      const imageName = extractStoredImageName(getLocalizedImageValue(selectedItem.imageObjectKeyJson, imageLocale));

                      if (!imageUrl && !imageName) {
                        return null;
                      }

                      return (
                        <div key={imageLocale} className="space-y-3">
                          <div className="text-sm font-semibold text-[var(--foreground)]">{imageLocale}</div>
                          {imageUrl ? (
                            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt={`${getLocalizedText(selectedItem.name, locale)} ${imageLocale}`}
                                className="max-h-72 w-full object-contain bg-black/20"
                              />
                            </div>
                          ) : null}
                          {imageName ? (
                            <div className="text-xs text-[var(--foreground-soft)]">{imageName}</div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="mb-2 text-sm font-semibold text-[var(--foreground)]">
                  {locale === 'RU' ? '\u041e\u0441\u043e\u0431\u044b\u0439 \u043d\u0430\u0432\u044b\u043a' : 'Special skill'}
                </div>
                <div className="text-base font-medium text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.specialSkillName, locale) || t.noValue}
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-soft)]">
                  {getLocalizedText(selectedItem.specialSkillDescription, locale) || t.noValue}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]"><DictionaryInlineValue label={t.element} value={resolveName(elements, selectedItem.elementId)} imageUrl={resolveItem(elements, selectedItem.elementId)?.imageUrl} /></div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]"><DictionaryInlineValue label={t.rarity} value={resolveName(rarities, selectedItem.rarityId)} imageUrl={resolveItem(rarities, selectedItem.rarityId)?.imageUrl} /></div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <DictionaryInlineValue label={t.heroClass} value={resolveName(heroClasses, selectedItem.heroClassId)} imageUrl={resolveItem(heroClasses, selectedItem.heroClassId)?.imageUrl} />
                    {(() => {
                      const heroClass = resolveItem(heroClasses, selectedItem.heroClassId);
                      const heroClassContent = heroClass
                        ? [
                            `${getLocalizedText(heroClass.baseName, locale)}: ${getLocalizedText(heroClass.baseDescription, locale)}`,
                            `${getLocalizedText(heroClass.masterName, locale)}: ${getLocalizedText(heroClass.masterDescription, locale)}`,
                          ]
                            .filter((value) => value.trim().length > 0)
                            .join('\n\n')
                        : '';
                      return heroClassContent ? <HeroInfoPopover label={t.heroClass} content={heroClassContent} /> : null;
                    })()}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <span>{t.manaSpeed}: {resolveName(manaSpeeds, selectedItem.manaSpeedId)}</span>
                    {(() => {
                      const manaSpeed = resolveItem(manaSpeeds, selectedItem.manaSpeedId);
                      const description = manaSpeed?.description ? getLocalizedText(manaSpeed.description, locale) : '';
                      return description ? <HeroInfoPopover label={t.manaSpeed} content={description} /> : null;
                    })()}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <DictionaryInlineValue label={t.family} value={resolveName(families, selectedItem.familyId)} imageUrl={resolveItem(families, selectedItem.familyId)?.imageUrl} />
                    {(() => {
                      const family = resolveItem(families, selectedItem.familyId);
                      const description = family?.description ? getLocalizedText(family.description, locale) : '';
                      return description ? <HeroInfoPopover label={t.family} content={description} /> : null;
                    })()}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <DictionaryInlineValue label={t.alphaTalent} value={resolveName(alphaTalents, selectedItem.alphaTalentId)} imageUrl={resolveItem(alphaTalents, selectedItem.alphaTalentId)?.imageUrl} />
                    {(() => {
                      const alphaTalent = resolveItem(alphaTalents, selectedItem.alphaTalentId);
                      const description = alphaTalent?.description ? getLocalizedText(alphaTalent.description, locale) : '';
                      return description ? <HeroInfoPopover label={t.alphaTalent} content={description} /> : null;
                    })()}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{locale === 'RU' ? '\u041f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438' : 'Passive skills'}</div>
                {selectedItem.passiveSkillIds.length === 0 ? (
                    <div className="text-sm text-[var(--foreground-soft)]">{locale === 'RU' ? '\u041f\u0430\u0441\u0441\u0438\u0432\u043d\u044b\u0435 \u043d\u0430\u0432\u044b\u043a\u0438 \u043d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u044b' : 'No passive skills selected'}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.passiveSkillIds.map((skillId) => {
                      const skill = passiveSkills.find((item) => item.id === skillId);
                      if (!skill) return null;

                      return (
                        <span
                          key={skillId}
                          className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200"
                        >
                          <DictionaryMiniIcon imageUrl={skill.imageUrl} label={getLocalizedText(skill.name, locale)} size={18} className="border-cyan-300/20 bg-cyan-950/40" />
                          {getLocalizedText(skill.name, locale)}
                          <HeroInfoPopover
                            label={getLocalizedText(skill.name, locale)}
                            content={getLocalizedText(skill.description, locale)}
                          />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                  {locale === 'RU' ? 'Мнения авторитетных игроков' : 'Expert opinions'}
                </div>
                {loadingAdminHeroExpertOpinions ? (
                  <div className="text-sm text-[var(--foreground-soft)]">
                    {locale === 'RU' ? 'Загрузка мнений...' : 'Loading expert opinions...'}
                  </div>
                ) : adminHeroExpertOpinionsError ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {adminHeroExpertOpinionsError}
                  </div>
                ) : selectedAdminHeroExpertOpinions.length === 0 ? (
                  <div className="text-sm text-[var(--foreground-soft)]">
                    {locale === 'RU' ? 'Мнения пока не добавлены' : 'No expert opinions yet'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedAdminHeroExpertOpinions.map((opinion) => (
                      <div
                        key={opinion.localId}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-[var(--foreground)]">
                              {opinion.authorName}
                            </div>
                            <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                              {[opinion.publishedAt || null, opinion.sourceTitle || null, opinion.sourceType || null]
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              opinion.isPublished
                                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)]'
                            }`}
                          >
                            {opinion.isPublished
                              ? locale === 'RU'
                                ? 'Опубликовано'
                                : 'Published'
                              : locale === 'RU'
                                ? 'Черновик'
                                : 'Draft'}
                          </span>
                        </div>
                        <div className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-soft)]">
                          {getLocalizedText(opinion.content, locale) ||
                            (locale === 'RU' ? 'Текст не заполнен' : 'Content is empty')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseAttack}: {selectedItem.baseAttack ?? t.noValue}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseArmor}: {selectedItem.baseArmor ?? t.noValue}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseHp}: {selectedItem.baseHp ?? t.noValue}</div></div>
              <HeroStatCalculatorPanel locale={locale} heroId={selectedItem.id} heroSlug={selectedItem.slug} calculateEndpoint={`/api/v1/admin/heroes/${selectedItem.id}/stats/calculate`} isCostume={selectedItem.isCostume} currentCostumeIndex={selectedItem.costumeIndex ?? null} baseAttack={selectedItem.baseAttack ?? null} baseArmor={selectedItem.baseArmor ?? null} baseHp={selectedItem.baseHp ?? null} costumes={selectedAdminVariants?.costumes} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.status}: {selectedItem.status}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.releaseDate}: {selectedItem.releaseDate || t.noValue}</div></div>
{selectedItem.isCostume && <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseHero}: {resolveBaseHeroName(selectedItem.baseHeroId)}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.costumeIndexLabel}: {selectedItem.costumeIndex ?? t.noValue}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]"><div className="flex items-center gap-3"><DictionaryMiniIcon imageUrl="/dictionary-icons/costume.png" label={locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'} size={34} chromeless fallbackToLetter={false} /><span className="min-w-0 flex-1 text-base font-bold text-[var(--foreground)]">{locale === 'RU' ? 'Бонус костюма' : 'Costume bonus'}</span>{selectedItem.costumeBonus ? <HeroInfoPopover label={locale === 'RU' ? '\u0411\u043e\u043d\u0443\u0441 \u043a\u043e\u0441\u0442\u044e\u043c\u0430' : 'Costume bonus'} content={formatCostumeBonusContent(locale, selectedItem.costumeBonus)} /> : null}</div></div></div>}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.relatedCostumes}</div>
                {selectedAdminVariants?.costumes && selectedAdminVariants.costumes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAdminVariants.costumes.map((costume) => (
                      <span key={costume.id} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">
                        {formatCostumeVariantName(costume.name, costume.costumeIndex)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--foreground-soft)]">{t.noRelatedCostumes}</div>
                )}
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-soft)]"><div className="mb-2 font-semibold text-[var(--foreground)]">{t.metadata}</div><div>{t.createdAt}: {formatAdminDate(selectedItem.createdAt, locale, t.noValue)}</div><div>{t.updatedBy}: {selectedItem.updatedByEmail ?? selectedItem.updatedBy}</div><div>{t.updatedAt}: {formatAdminDate(selectedItem.updatedAt, locale, t.noValue)}</div></div>
            </div>
          )}
        </section>
      </div>

      <DictionaryModal open={isCreateOpen} title={t.createTitle} closeLabel={t.close} closeOnBackdropClick={false} onClose={closeCreateModal}><div className="space-y-6">{renderForm(createForm, setCreateForm, false)}<div className="flex justify-end gap-3"><button type="button" disabled={submitting || createUploadingImage.RU || createUploadingImage.EN || createUploadingPreview} onClick={closeCreateModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]">{t.cancel}</button><button type="button" disabled={submitting || createUploadingImage.RU || createUploadingImage.EN || createUploadingPreview} onClick={handleCreate} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15">{submitting ? t.creating : t.create}</button></div></div></DictionaryModal>
      <DictionaryModal open={isEditOpen} title={t.editTitle} closeLabel={t.close} closeOnBackdropClick={false} onClose={closeEditModal}><div className="space-y-6">{renderForm(editForm, setEditForm, true)}<div className="flex justify-end gap-3"><button type="button" disabled={submitting || editUploadingImage.RU || editUploadingImage.EN || editUploadingPreview} onClick={closeEditModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]">{t.cancel}</button><button type="button" disabled={submitting || editUploadingImage.RU || editUploadingImage.EN || editUploadingPreview} onClick={handleUpdate} className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-300">{submitting ? t.saving : t.save}</button></div></div></DictionaryModal>
    </>
  );
}
