'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
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
import HeroInfoPopover from './HeroInfoPopover';
import HeroImageUploadField from './HeroImageUploadField';
import HeroStatCalculatorPanel from './HeroStatCalculatorPanel';
import LocalizedTextFields from './LocalizedTextFields';
import LocalizedTextareaFields from './LocalizedTextareaFields';
import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantSummaryItem,
  type PublicHeroVariantsItem,
} from './PublicHeroDetailsModal';

const PUBLIC_API = '/api/v1/public/heroes';
const ADMIN_API = '/api/v1/admin/heroes';
const ADMIN_CATALOG_API = '/api/v1/admin/heroes/catalog';
const PUBLIC_FILTERS_API = '/api/v1/public/heroes/filters';
const PUBLIC_NAMES_API = '/api/v1/public/heroes/names';
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

type PublicHeroVariantsResponse = {
  currentHero: PublicHeroDetailsItem;
  baseHero: PublicHeroVariantSummaryItem;
  costumes: PublicHeroVariantSummaryItem[];
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
  isCostume: boolean;
  baseHeroId?: number | null;
  costumeIndex?: number | null;
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
  isCostume: boolean;
  baseHeroId?: number | null;
  costumeIndex?: number | null;
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
  baseAttack: string;
  baseArmor: string;
  baseHp: string;
  status: HeroStatus;
  releaseDate: string;
  isCostume: boolean;
  baseHeroId: string;
  costumeIndex: string;
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
  isCostume: boolean;
  baseHeroId?: number | null;
  costumeIndex?: number | null;
  costumeBonusJson?: null;
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
  baseAttack: '',
  baseArmor: '',
  baseHp: '',
  status: 'DRAFT',
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
    isCostume: dto.isCostume,
    baseHeroId: dto.baseHeroId ?? null,
    costumeIndex: dto.costumeIndex ?? null,
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
    baseAttack: hero.baseAttack == null ? '' : String(hero.baseAttack),
    baseArmor: hero.baseArmor == null ? '' : String(hero.baseArmor),
    baseHp: hero.baseHp == null ? '' : String(hero.baseHp),
    status: hero.status,
    releaseDate: hero.releaseDate ?? '',
    isCostume: hero.isCostume,
    baseHeroId: hero.baseHeroId ? String(hero.baseHeroId) : '',
    costumeIndex: hero.costumeIndex == null ? '' : String(hero.costumeIndex),
  };
}

function optionalNumber(value: string): number | null {
  return value.trim() ? Number(value) : null;
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

export default function HeroesWorkspace({ adminMode = false }: { adminMode?: boolean }) {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid, apiPostFormData } = useApi();
  const { locale: appLocale } = useI18n();
  const { userId, userEmail, displayName } = useAuth();
  const locale: HeroLocale = appLocale === 'ru' ? 'RU' : 'EN';
  const createRuImageInputRef = useRef<HTMLInputElement | null>(null);
  const createEnImageInputRef = useRef<HTMLInputElement | null>(null);
  const editRuImageInputRef = useRef<HTMLInputElement | null>(null);
  const editEnImageInputRef = useRef<HTMLInputElement | null>(null);
  const publicFiltersPanelRef = useRef<HTMLDivElement | null>(null);

  const [publicPage, setPublicPage] = useState<HeroPageResponse | null>(null);
  const [publicItems, setPublicItems] = useState<PublicHeroCardItem[]>([]);
  const [publicSearch, setPublicSearch] = useState('');
  const [publicFilters, setPublicFilters] = useState<PublicCatalogFiltersState>(EMPTY_PUBLIC_FILTERS);
  const [publicFilterOptions, setPublicFilterOptions] = useState<HeroCatalogFiltersResponse | null>(null);
  const [openPublicFilterKey, setOpenPublicFilterKey] = useState<keyof PublicCatalogFiltersState | null>(null);
  const [loadingMorePublic, setLoadingMorePublic] = useState(false);
  const [selectedPublicHero, setSelectedPublicHero] = useState<PublicHeroCardItem | null>(null);
  const [selectedPublicHeroDetails, setSelectedPublicHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedPublicHeroVariants, setSelectedPublicHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [items, setItems] = useState<HeroItem[]>([]);
  const [baseHeroOptions, setBaseHeroOptions] = useState<HeroLookupItem[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCatalogPage, setAdminCatalogPage] = useState<AdminHeroPageResponse | null>(null);
  const [loadingMoreAdmin, setLoadingMoreAdmin] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<HeroItem | null>(null);
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
  const [createUploadingImage, setCreateUploadingImage] = useState<Record<HeroLocale, boolean>>({
    RU: false,
    EN: false,
  });
  const [editUploadingImage, setEditUploadingImage] = useState<Record<HeroLocale, boolean>>({
    RU: false,
    EN: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [publicDetailsError, setPublicDetailsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createImageUploadError, setCreateImageUploadError] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [editImageUploadError, setEditImageUploadError] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isCreatePassiveSkillsOpen, setCreatePassiveSkillsOpen] = useState(false);
  const [isEditPassiveSkillsOpen, setEditPassiveSkillsOpen] = useState(false);
  const [createPassiveSkillQuery, setCreatePassiveSkillQuery] = useState('');
  const [editPassiveSkillQuery, setEditPassiveSkillQuery] = useState('');
  const [isPublicDetailsOpen, setPublicDetailsOpen] = useState(false);
  const [createForm, setCreateForm] = useState<HeroFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<HeroFormState>(EMPTY_FORM);
  const [createImagePreviewUrl, setCreateImagePreviewUrl] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [createImageFileName, setCreateImageFileName] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });
  const [editImageFileName, setEditImageFileName] = useState<Record<HeroLocale, string | null>>({
    RU: null,
    EN: null,
  });

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            title: 'Герои',
            publicSubtitle: 'Публичный каталог героев',
            adminSubtitle: 'CRUD по карточкам героев',
            create: 'Создать героя',
            createTitle: 'Создать героя',
            editTitle: 'Редактировать героя',
            detailsTitle: 'Карточка героя',
            detailsSubtitle: 'Просмотр и редактирование выбранного героя',
            edit: 'Редактировать',
            delete: 'Удалить',
            close: 'Закрыть',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loading: 'Загрузка героев...',
            loadingDetails: 'Загрузка карточки...',
            empty: 'Героев пока нет',
            selectHero: 'Выбери героя из списка',
            slug: 'Slug',
            slugHint: 'Строчные латинские буквы, цифры и дефис',
            nameRu: 'Имя RU',
            nameEn: 'Name EN',
            skillNameRu: 'Название навыка RU',
            skillNameEn: 'Skill name EN',
            skillDescriptionRu: 'Описание навыка RU',
            skillDescriptionEn: 'Skill description EN',
            element: 'Элемент',
            rarity: 'Редкость',
            heroClass: 'Класс героя',
            manaSpeed: 'Скорость маны',
            family: 'Семья',
            alphaTalent: 'Альфа-талант',
            noFamily: 'Без семьи',
            noAlphaTalent: 'Без альфа-таланта',
            selectElement: 'Выберите элемент',
            selectRarity: 'Выберите редкость',
            selectHeroClass: 'Выберите класс героя',
            selectManaSpeed: 'Выберите скорость маны',
            stats: 'Базовые значения',
            baseAttack: 'Базовая атака',
            baseArmor: 'Базовая броня',
            baseHp: 'Базовое HP',
            statsHint: 'Можно оставить пустым',
            status: 'Статус',
            releaseDate: 'Дата выхода',
            isCostume: 'Это костюм',
            baseHero: 'Базовый герой',
            selectBaseHero: 'Выберите базового героя',
            metadata: 'Служебные поля',
            createdBy: 'Создал',
            createdAt: 'Создано',
            updatedBy: 'Обновил',
            updatedAt: 'Обновлено',
            noValue: 'Не указано',
            invalidSlug: 'Slug должен содержать только строчные латинские буквы, цифры и дефис',
            required: 'Поле обязательно',
            nonNegative: 'Значение должно быть 0 или больше',
            costumeBaseHeroRequired: 'Для костюма нужно выбрать базового героя',
            search: 'Поиск',
            searchHeroes: 'Поиск героев',
            searchHeroesPlaceholder: 'Имя или slug героя',
            filters: 'Фильтры',
            resetFilters: 'Сбросить фильтры',
            loadMore: 'Показать еще',
            noResults: 'Ничего не найдено',
            adminSearchPlaceholder: 'Поиск по героям',
            deleteConfirm: (name: string) => `Удалить героя "${name}"?`,
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
            required: 'Field is required',
            nonNegative: 'Value must be 0 or greater',
            costumeBaseHeroRequired: 'Costume hero requires a base hero',
            search: 'Search',
            searchHeroes: 'Search heroes',
            searchHeroesPlaceholder: 'Hero name or slug',
            filters: 'Filters',
            resetFilters: 'Reset filters',
            loadMore: 'Load more',
            noResults: 'Nothing found',
            adminSearchPlaceholder: 'Search heroes',
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
    setPublicFilterOptions(response);
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
        size: '20',
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
    try {
      const response = await apiJson<PublicHeroVariantsResponse>(`${PUBLIC_API}/${slug}/variants?language=${locale}`);
      setSelectedPublicHeroDetails(response.currentHero);
      setSelectedPublicHeroVariants(response);
      setSelectedPublicHero(
        findBaseHeroCardBySlug(response.currentHero.slug) ?? toSyntheticPublicHeroCard(response.currentHero, response),
      );
    } catch (error) {
      setPublicDetailsError(error instanceof Error ? error.message : 'Failed to load hero');
      setSelectedPublicHeroDetails(null);
      setSelectedPublicHeroVariants(null);
    } finally {
      setLoadingPublicDetails(false);
    }
  }, [apiJson, findBaseHeroCardBySlug, locale, toSyntheticPublicHeroCard]);

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
    if (adminMode && selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [adminMode, selectedId, loadDetails]);

  useEffect(() => {
    if (openPublicFilterKey === null) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!publicFiltersPanelRef.current) {
        return;
      }

      if (!publicFiltersPanelRef.current.contains(event.target as Node)) {
        setOpenPublicFilterKey(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPublicFilterKey(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
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
        ? 'Можно загружать только PNG, JPEG или WEBP.'
        : 'Only PNG, JPEG or WEBP images are allowed.';

    const uploadErrorMessage =
      locale === 'RU'
        ? 'Не удалось загрузить изображение героя.'
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

  const resetCreateModalState = () => {
    setCreateForm(EMPTY_FORM);
    setSubmitError(null);
    setCreateImagePreviewUrl({ RU: null, EN: null });
    setCreateImageFileName({ RU: null, EN: null });
    setCreateImageUploadError({ RU: null, EN: null });
    setCreateUploadingImage({ RU: false, EN: false });
    resetImageInput('create', 'RU');
    resetImageInput('create', 'EN');
  };

  const openCreateModal = () => {
    resetCreateModalState();
    setCreatePassiveSkillsOpen(false);
    setCreatePassiveSkillQuery('');
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (submitting || createUploadingImage.RU || createUploadingImage.EN) return;
    resetCreateModalState();
    setCreatePassiveSkillsOpen(false);
    setCreatePassiveSkillQuery('');
    setCreateOpen(false);
  };

  const openEditModal = () => {
    if (!selectedItem) return;
    setEditForm(toForm(selectedItem));
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
    resetImageInput('edit', 'RU');
    resetImageInput('edit', 'EN');
    setEditOpen(true);
  };

  const closeEditModal = () => {
    if (submitting || editUploadingImage.RU || editUploadingImage.EN) return;
    setEditPassiveSkillsOpen(false);
    setEditPassiveSkillQuery('');
    setEditOpen(false);
    setEditImagePreviewUrl({ RU: null, EN: null });
    setEditImageFileName({ RU: null, EN: null });
    setEditImageUploadError({ RU: null, EN: null });
    setEditUploadingImage({ RU: false, EN: false });
    resetImageInput('edit', 'RU');
    resetImageInput('edit', 'EN');
  };

  const baseHeroes = useMemo(
    () => [...baseHeroOptions].sort((a, b) => a.name.localeCompare(b.name, locale === 'RU' ? 'ru' : 'en')),
    [baseHeroOptions, locale],
  );

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

    return locale === 'RU' ? `Выбрано: ${selected.length}` : `${selected.length} selected`;
  };

  const resetPublicFilters = () => {
    setPublicSearch('');
    setPublicFilters(EMPTY_PUBLIC_FILTERS);
    setOpenPublicFilterKey(null);
  };

  const validateForm = (form: HeroFormState): string | null => {
    if (!form.slug.trim()) return `${t.slug}: ${t.required}`;
    if (!SLUG_PATTERN.test(form.slug.trim())) return t.invalidSlug;
    if (!form.elementId) return `${t.element}: ${t.required}`;
    if (!form.rarityId) return `${t.rarity}: ${t.required}`;
    if (!form.heroClassId) return `${t.heroClass}: ${t.required}`;
    if (!form.manaSpeedId) return `${t.manaSpeed}: ${t.required}`;
    if (form.isCostume && !form.baseHeroId) return t.costumeBaseHeroRequired;
    if (form.isCostume && !form.costumeIndex.trim()) {
      return locale === 'RU' ? 'Номер костюма обязателен' : 'Costume index is required';
    }
    const localizedError =
      validateLocalizedTextPair(form.name, t.nameRu, t.nameEn) ??
      validateLocalizedTextPair(form.specialSkillName, t.skillNameRu, t.skillNameEn) ??
      validateLocalizedTextPair(form.specialSkillDescription, t.skillDescriptionRu, t.skillDescriptionEn);
    if (localizedError) return localizedError;
    for (const value of [form.baseAttack, form.baseArmor, form.baseHp]) {
      if (value.trim() && (Number.isNaN(Number(value)) || Number(value) < 0)) return t.nonNegative;
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
    isCostume: form.isCostume,
    baseHeroId: form.isCostume && form.baseHeroId ? Number(form.baseHeroId) : null,
    costumeIndex: form.isCostume && form.costumeIndex ? Number(form.costumeIndex) : null,
    costumeBonusJson: null,
    releaseDate: form.releaseDate || null,
    status: form.status,
    updatedBy: userId ?? '',
    updatedByEmail: userEmail ?? null,
    passiveSkillIds: form.passiveSkillIds,
  });

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
  };

  const handleCreate = async () => {
    if (!userId) {
      setSubmitError('Missing user id for update audit');
      return;
    }

    if (createImageUploadError.RU || createImageUploadError.EN) {
      setSubmitError(createImageUploadError.RU ?? createImageUploadError.EN);
      return;
    }

    const error = validateForm(createForm);
    if (error) return setSubmitError(error);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await apiPostJson<HeroMutationRequest, AdminHeroResponseDto>(ADMIN_API, buildPayload(createForm));
      upsertHero(created);
      resetCreateModalState();
      setCreatePassiveSkillsOpen(false);
      setCreatePassiveSkillQuery('');
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

    if (editImageUploadError.RU || editImageUploadError.EN) {
      setSubmitError(editImageUploadError.RU ?? editImageUploadError.EN);
      return;
    }

    const error = validateForm(editForm);
    if (error) return setSubmitError(error);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await apiPutJson<HeroMutationRequest, AdminHeroResponseDto>(`${ADMIN_API}/${selectedItem.id}`, buildPayload(editForm));
      upsertHero(updated);
      setEditPassiveSkillsOpen(false);
      setEditPassiveSkillQuery('');
      setEditOpen(false);
      setEditImagePreviewUrl({ RU: null, EN: null });
      setEditImageFileName({ RU: null, EN: null });
      setEditImageUploadError({ RU: null, EN: null });
      setEditUploadingImage({ RU: false, EN: false });
      resetImageInput('edit', 'RU');
      resetImageInput('edit', 'EN');
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
    const heroImageSectionTitle = locale === 'RU' ? 'Картинки героя' : 'Hero images';
    const ruImageLabel = locale === 'RU' ? 'Картинка RU' : 'RU image';
    const enImageLabel = locale === 'RU' ? 'Картинка EN' : 'EN image';
    const passiveSkillsTitle = locale === 'RU' ? 'Пассивные навыки' : 'Passive skills';
    const noPassiveSkillsLabel = locale === 'RU' ? 'Пассивные навыки не выбраны' : 'No passive skills selected';
    const addPassiveSkillLabel = locale === 'RU' ? 'Добавить пассивный навык' : 'Add passive skill';
    const availablePassiveSkillsLabel = locale === 'RU' ? 'Доступные пассивные навыки' : 'Available passive skills';
    const hidePassiveSkillsLabel = locale === 'RU' ? 'Скрыть список' : 'Hide list';
    const noAvailablePassiveSkillsLabel = locale === 'RU' ? 'Все пассивные навыки уже выбраны' : 'All passive skills are already selected';
    const noPassiveSkillSearchResultsLabel = locale === 'RU' ? 'По вашему запросу ничего не найдено' : 'No skills found for your search';
    const addPassiveSkillActionLabel = locale === 'RU' ? 'Добавить' : 'Add';
    const removePassiveSkillActionLabel = locale === 'RU' ? 'Удалить' : 'Remove';
    const searchPassiveSkillsLabel = locale === 'RU' ? 'Поиск навыка' : 'Search skill';
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

    return (
    <div className="space-y-6">
      {submitError && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{submitError}</div>}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.slug}</span>
        <input type="text" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" />
        <span className="text-xs text-[var(--foreground-muted)]">{t.slugHint}</span>
      </label>
      <LocalizedTextFields value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} ruLabel={t.nameRu} enLabel={t.nameEn} />
      <LocalizedTextFields value={form.specialSkillName} onChange={(value) => setForm((prev) => ({ ...prev, specialSkillName: value }))} ruLabel={t.skillNameRu} enLabel={t.skillNameEn} />
      <LocalizedTextareaFields value={form.specialSkillDescription} onChange={(value) => setForm((prev) => ({ ...prev, specialSkillDescription: value }))} ruLabel={t.skillDescriptionRu} enLabel={t.skillDescriptionEn} rows={5} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.element}</span><select value={form.elementId} onChange={(e) => setForm((prev) => ({ ...prev, elementId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.selectElement}</option>{elements.map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)}</option>)}</select></label>
        <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.rarity}</span><select value={form.rarityId} onChange={(e) => setForm((prev) => ({ ...prev, rarityId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.selectRarity}</option>{rarities.map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)} ({item.stars}*)</option>)}</select></label>
        <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.heroClass}</span><select value={form.heroClassId} onChange={(e) => setForm((prev) => ({ ...prev, heroClassId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.selectHeroClass}</option>{heroClasses.map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)}</option>)}</select></label>
        <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.manaSpeed}</span><select value={form.manaSpeedId} onChange={(e) => setForm((prev) => ({ ...prev, manaSpeedId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.selectManaSpeed}</option>{manaSpeeds.map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)}</option>)}</select></label>
        <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.family}</span><select value={form.familyId} onChange={(e) => setForm((prev) => ({ ...prev, familyId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.noFamily}</option>{families.map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)}</option>)}</select></label>
        <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.alphaTalent}</span><select value={form.alphaTalentId} onChange={(e) => setForm((prev) => ({ ...prev, alphaTalentId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.noAlphaTalent}</option>{alphaTalents.map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)}</option>)}</select></label>
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
                  <label className="block">
                    <span className="sr-only">{searchPassiveSkillsLabel}</span>
                    <input
                      type="text"
                      value={passiveSkillQuery}
                      onChange={(event) => setPassiveSkillQuery(event.target.value)}
                      placeholder={searchPassiveSkillsLabel}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] outline-none"
                    />
                  </label>
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
                          <span>{getLocalizedText(skill.name, locale)}</span>
                          <HeroInfoPopover
                            label={getLocalizedText(skill.name, locale)}
                            content={getLocalizedText(skill.description, locale)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              passiveSkillIds: [...prev.passiveSkillIds, skill.id],
                            }))
                          }
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
      <div><div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.stats}</div><div className="mb-3 text-xs text-[var(--foreground-muted)]">{t.statsHint}</div><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><input type="number" min="0" value={form.baseAttack} onChange={(e) => setForm((prev) => ({ ...prev, baseAttack: e.target.value }))} placeholder={t.baseAttack} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /><input type="number" min="0" value={form.baseArmor} onChange={(e) => setForm((prev) => ({ ...prev, baseArmor: e.target.value }))} placeholder={t.baseArmor} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /><input type="number" min="0" value={form.baseHp} onChange={(e) => setForm((prev) => ({ ...prev, baseHp: e.target.value }))} placeholder={t.baseHp} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></div></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.status}</span><select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as HeroStatus }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none">{(['DRAFT', 'READY', 'HIDDEN', 'ARCHIVED'] as HeroStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.releaseDate}</span><input type="date" value={form.releaseDate} onChange={(e) => setForm((prev) => ({ ...prev, releaseDate: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label></div>
      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"><input type="checkbox" checked={form.isCostume} onChange={(e) => setForm((prev) => ({ ...prev, isCostume: e.target.checked, baseHeroId: e.target.checked ? prev.baseHeroId : '', costumeIndex: e.target.checked ? prev.costumeIndex : '' }))} /><span className="text-sm text-[var(--foreground-soft)]">{t.isCostume}</span></label>
      {form.isCostume && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.baseHero}</span><select value={form.baseHeroId} onChange={(e) => setForm((prev) => ({ ...prev, baseHeroId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.selectBaseHero}</option>{baseHeroes.filter((item) => !isEdit || item.id !== selectedItem?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{locale === 'RU' ? 'Номер костюма' : 'Costume index'}</span><input type="number" min="1" value={form.costumeIndex} onChange={(e) => setForm((prev) => ({ ...prev, costumeIndex: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label></div>}
      {currentAuditLabel && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-xs text-[var(--foreground-muted)]">{t.updatedBy}: {currentAuditLabel}</div>}
    </div>
  );
  };

  const handleOpenPublicHero = async (hero: PublicHeroCardItem) => {
    setSelectedPublicHero(hero);
    setSelectedPublicHeroDetails(null);
    setSelectedPublicHeroVariants(null);
    setPublicDetailsError(null);
    setPublicDetailsOpen(true);
    await loadPublicVariants(hero.slug);
  };

  const handleOpenPublicHeroBySlug = async (slug: string) => {
    setSelectedPublicHeroDetails(null);
    setSelectedPublicHeroVariants(null);
    setPublicDetailsError(null);
    setPublicDetailsOpen(true);
    await loadPublicVariants(slug);
  };

  const handleClosePublicHero = () => {
    setPublicDetailsOpen(false);
    setSelectedPublicHero(null);
    setSelectedPublicHeroDetails(null);
    setSelectedPublicHeroVariants(null);
    setPublicDetailsError(null);
  };

  if (!adminMode) {
    return (
      <>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{t.title}</h3>
            <p className="text-sm text-[var(--foreground-soft)]">{t.publicSubtitle}</p>
          </div>
          <div className="mb-6 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground-soft)]">{t.searchHeroes}</span>
                <input
                  type="text"
                  value={publicSearch}
                  onChange={(event) => setPublicSearch(event.target.value)}
                  placeholder={t.searchHeroesPlaceholder}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetPublicFilters}
                  disabled={!hasActivePublicFilters}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.resetFilters}
                </button>
              </div>
            </div>

            {publicFilterOptions ? (
              <div ref={publicFiltersPanelRef} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-sm font-semibold text-[var(--foreground)]">{t.filters}</div>
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

                    return (
                      <div key={group.key} className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenPublicFilterKey((prev) => (prev === group.key ? null : group.key))
                          }
                          className={`min-w-[160px] rounded-xl border px-3 py-2 text-left text-xs transition ${
                            selectedCount > 0
                              ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
                              : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{group.label}</span>
                            <span className="text-[10px] text-[var(--foreground-muted)]">
                              {isOpen ? '▲' : '▼'}
                            </span>
                          </div>
                          <div className="mt-1 truncate text-[11px] text-[var(--foreground-muted)]">
                            {summary ?? (locale === 'RU' ? 'Не выбрано' : 'Not selected')}
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="absolute left-0 top-full z-20 mt-2 w-[260px] rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                              {group.label}
                            </div>
                            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                              {group.options.map((option) => {
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
                                    <span className="leading-5">{label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
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
                    <div className="text-sm font-semibold text-[var(--foreground)]">{hero.name}</div>
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
          <label className="mb-4 block">
            <span className="sr-only">{t.search}</span>
            <input
              type="text"
              value={adminSearch}
              onChange={(event) => setAdminSearch(event.target.value)}
              placeholder={t.adminSearchPlaceholder}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
            />
          </label>
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
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><div className="text-lg font-semibold text-[var(--foreground)]">{getLocalizedText(selectedItem.name, locale)}</div><div className="mt-1 text-sm text-[var(--foreground-soft)]">{selectedItem.slug}</div></div>
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
                  {locale === 'RU' ? 'Особый навык' : 'Special skill'}
                </div>
                <div className="text-base font-medium text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.specialSkillName, locale) || t.noValue}
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-soft)]">
                  {getLocalizedText(selectedItem.specialSkillDescription, locale) || t.noValue}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.element}: {resolveName(elements, selectedItem.elementId)}</div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.rarity}: {resolveName(rarities, selectedItem.rarityId)}</div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <span>{t.heroClass}: {resolveName(heroClasses, selectedItem.heroClassId)}</span>
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
                    <span>{t.family}: {resolveName(families, selectedItem.familyId)}</span>
                    {(() => {
                      const family = resolveItem(families, selectedItem.familyId);
                      const description = family?.description ? getLocalizedText(family.description, locale) : '';
                      return description ? <HeroInfoPopover label={t.family} content={description} /> : null;
                    })()}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">
                  <div className="flex items-center gap-2">
                    <span>{t.alphaTalent}: {resolveName(alphaTalents, selectedItem.alphaTalentId)}</span>
                    {(() => {
                      const alphaTalent = resolveItem(alphaTalents, selectedItem.alphaTalentId);
                      const description = alphaTalent?.description ? getLocalizedText(alphaTalent.description, locale) : '';
                      return description ? <HeroInfoPopover label={t.alphaTalent} content={description} /> : null;
                    })()}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">{locale === 'RU' ? 'Пассивные навыки' : 'Passive skills'}</div>
                {selectedItem.passiveSkillIds.length === 0 ? (
                  <div className="text-sm text-[var(--foreground-soft)]">{locale === 'RU' ? 'Пассивные навыки не выбраны' : 'No passive skills selected'}</div>
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseAttack}: {selectedItem.baseAttack ?? t.noValue}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseArmor}: {selectedItem.baseArmor ?? t.noValue}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseHp}: {selectedItem.baseHp ?? t.noValue}</div></div>
              <HeroStatCalculatorPanel locale={locale} heroId={selectedItem.id} heroSlug={selectedItem.slug} isCostume={selectedItem.isCostume} baseAttack={selectedItem.baseAttack ?? null} baseArmor={selectedItem.baseArmor ?? null} baseHp={selectedItem.baseHp ?? null} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.status}: {selectedItem.status}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.releaseDate}: {selectedItem.releaseDate || t.noValue}</div></div>
              {selectedItem.isCostume && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseHero}: {resolveBaseHeroName(selectedItem.baseHeroId)}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{locale === 'RU' ? 'Номер костюма' : 'Costume index'}: {selectedItem.costumeIndex ?? t.noValue}</div></div>}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-soft)]"><div className="mb-2 font-semibold text-[var(--foreground)]">{t.metadata}</div><div>{t.createdAt}: {formatAdminDate(selectedItem.createdAt, locale, t.noValue)}</div><div>{t.updatedBy}: {selectedItem.updatedByEmail ?? selectedItem.updatedBy}</div><div>{t.updatedAt}: {formatAdminDate(selectedItem.updatedAt, locale, t.noValue)}</div></div>
            </div>
          )}
        </section>
      </div>

      <DictionaryModal open={isCreateOpen} title={t.createTitle} closeLabel={t.close} onClose={closeCreateModal}><div className="space-y-6">{renderForm(createForm, setCreateForm, false)}<div className="flex justify-end gap-3"><button type="button" disabled={submitting || createUploadingImage.RU || createUploadingImage.EN} onClick={closeCreateModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]">{t.cancel}</button><button type="button" disabled={submitting || createUploadingImage.RU || createUploadingImage.EN} onClick={handleCreate} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15">{submitting ? t.creating : t.create}</button></div></div></DictionaryModal>
      <DictionaryModal open={isEditOpen} title={t.editTitle} closeLabel={t.close} onClose={closeEditModal}><div className="space-y-6">{renderForm(editForm, setEditForm, true)}<div className="flex justify-end gap-3"><button type="button" disabled={submitting || editUploadingImage.RU || editUploadingImage.EN} onClick={closeEditModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]">{t.cancel}</button><button type="button" disabled={submitting || editUploadingImage.RU || editUploadingImage.EN} onClick={handleUpdate} className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-300">{submitting ? t.saving : t.save}</button></div></div></DictionaryModal>
    </>
  );
}
