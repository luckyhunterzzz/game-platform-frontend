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
  type RarityItem,
  type RarityResponseDto,
  validateLocalizedTextPair,
} from '@/lib/types/hero';

import DictionaryModal from './DictionaryModal';
import HeroImageUploadField from './HeroImageUploadField';
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
const ELEMENTS_API = '/api/v1/admin/heroes/elements';
const RARITIES_API = '/api/v1/admin/heroes/rarities';
const HERO_CLASSES_API = '/api/v1/admin/heroes/hero-classes';
const MANA_SPEEDS_API = '/api/v1/admin/heroes/mana-speeds';
const FAMILIES_API = '/api/v1/admin/heroes/families';
const ALPHA_TALENTS_API = '/api/v1/admin/heroes/alpha-talents';
const HERO_IMAGE_UPLOAD_API = '/api/v1/admin/media/images/heroes';
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const SLUG_PATTERN = /^[a-z0-9-]+$/;

type HeroStatus = 'DRAFT' | 'READY' | 'HIDDEN' | 'ARCHIVED';

type HeroPageResponse = {
  items: PublicHeroCardItem[];
  page: number;
  totalElements: number;
  totalPages: number;
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
  isCostume: boolean;
  baseHeroId?: number | null;
  releaseDate?: string | null;
  status: HeroStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
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
  isCostume: boolean;
  baseHeroId?: number | null;
  releaseDate?: string | null;
  status: HeroStatus;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
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
  imageBucketJson: LocalizedText;
  imageObjectKeyJson: LocalizedText;
  baseAttack: string;
  baseArmor: string;
  baseHp: string;
  status: HeroStatus;
  releaseDate: string;
  isCostume: boolean;
  baseHeroId: string;
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
  costumeBonusJson?: null;
  releaseDate?: string | null;
  status: HeroStatus;
  updatedBy: string;
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
  imageBucketJson: { ...EMPTY_LOCALIZED_TEXT },
  imageObjectKeyJson: { ...EMPTY_LOCALIZED_TEXT },
  baseAttack: '',
  baseArmor: '',
  baseHp: '',
  status: 'DRAFT',
  releaseDate: '',
  isCostume: false,
  baseHeroId: '',
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
    isCostume: dto.isCostume,
    baseHeroId: dto.baseHeroId ?? null,
    releaseDate: dto.releaseDate ?? null,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    updatedBy: dto.updatedBy,
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
    imageBucketJson: { ...hero.imageBucketJson },
    imageObjectKeyJson: { ...hero.imageObjectKeyJson },
    baseAttack: hero.baseAttack == null ? '' : String(hero.baseAttack),
    baseArmor: hero.baseArmor == null ? '' : String(hero.baseArmor),
    baseHp: hero.baseHp == null ? '' : String(hero.baseHp),
    status: hero.status,
    releaseDate: hero.releaseDate ?? '',
    isCostume: hero.isCostume,
    baseHeroId: hero.baseHeroId ? String(hero.baseHeroId) : '',
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

export default function HeroesWorkspace({ adminMode = false }: { adminMode?: boolean }) {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid, apiPostFormData } = useApi();
  const { locale: appLocale } = useI18n();
  const { userId } = useAuth();
  const locale: HeroLocale = appLocale === 'ru' ? 'RU' : 'EN';
  const createRuImageInputRef = useRef<HTMLInputElement | null>(null);
  const createEnImageInputRef = useRef<HTMLInputElement | null>(null);
  const editRuImageInputRef = useRef<HTMLInputElement | null>(null);
  const editEnImageInputRef = useRef<HTMLInputElement | null>(null);

  const [publicPage, setPublicPage] = useState<HeroPageResponse | null>(null);
  const [selectedPublicHero, setSelectedPublicHero] = useState<PublicHeroCardItem | null>(null);
  const [selectedPublicHeroDetails, setSelectedPublicHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedPublicHeroVariants, setSelectedPublicHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [items, setItems] = useState<HeroItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<HeroItem | null>(null);
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [rarities, setRarities] = useState<RarityItem[]>([]);
  const [heroClasses, setHeroClasses] = useState<HeroClassItem[]>([]);
  const [manaSpeeds, setManaSpeeds] = useState<ManaSpeedItem[]>([]);
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [alphaTalents, setAlphaTalents] = useState<AlphaTalentItem[]>([]);
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
            deleteConfirm: (name: string) => `Delete hero "${name}"?`,
          },
    [locale],
  );

  const loadDictionaries = useCallback(async () => {
    if (!adminMode) return;
    const [elementsResponse, raritiesResponse, heroClassesResponse, manaSpeedsResponse, familiesResponse, alphaTalentsResponse] =
      await Promise.all([
        apiJson<ElementResponseDto[]>(ELEMENTS_API),
        apiJson<RarityResponseDto[]>(RARITIES_API),
        apiJson<HeroClassResponseDto[]>(HERO_CLASSES_API),
        apiJson<ManaSpeedResponseDto[]>(MANA_SPEEDS_API),
        apiJson<FamilyResponseDto[]>(FAMILIES_API),
        apiJson<AlphaTalentResponseDto[]>(ALPHA_TALENTS_API),
      ]);
    setElements(elementsResponse.map(mapElementDto));
    setRarities(raritiesResponse.map(mapRarityDto));
    setHeroClasses(heroClassesResponse.map(mapHeroClassDto));
    setManaSpeeds(manaSpeedsResponse.map(mapManaSpeedDto));
    setFamilies(familiesResponse.map(mapFamilyDto));
    setAlphaTalents(alphaTalentsResponse.map(mapAlphaTalentDto));
  }, [adminMode, apiJson]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      if (adminMode) {
        const response = await apiJson<AdminHeroResponseDto[]>(ADMIN_API);
        const mapped = response.map(mapHero);
        setItems(mapped);
        setSelectedId((prev) => prev ?? mapped[0]?.id ?? null);
      } else {
        const response = await apiJson<HeroPageResponse>(`${PUBLIC_API}?page=0&size=12&language=${locale}`);
        setPublicPage(response);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load heroes');
    } finally {
      setLoadingList(false);
    }
  }, [adminMode, apiJson, locale]);

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
    if (!publicPage) return null;
    return publicPage.items.find((item) => item.slug === slug) ?? null;
  }, [publicPage]);

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
    if (adminMode && selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [adminMode, selectedId, loadDetails]);

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
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (submitting || createUploadingImage.RU || createUploadingImage.EN) return;
    resetCreateModalState();
    setCreateOpen(false);
  };

  const openEditModal = () => {
    if (!selectedItem) return;
    setEditForm(toForm(selectedItem));
    setSubmitError(null);
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
    setEditOpen(false);
    setEditImagePreviewUrl({ RU: null, EN: null });
    setEditImageFileName({ RU: null, EN: null });
    setEditImageUploadError({ RU: null, EN: null });
    setEditUploadingImage({ RU: false, EN: false });
    resetImageInput('edit', 'RU');
    resetImageInput('edit', 'EN');
  };

  const baseHeroes = useMemo(
    () => items.filter((item) => !item.isCostume).sort((a, b) => getLocalizedText(a.name, locale).localeCompare(getLocalizedText(b.name, locale))),
    [items, locale],
  );

  const resolveName = (list: Array<{ id: number; name: LocalizedText }>, id?: number | null) => {
    if (id == null) return t.noValue;
    const item = list.find((entry) => entry.id === id);
    return item ? getLocalizedText(item.name, locale) : `#${id}`;
  };

  const validateForm = (form: HeroFormState): string | null => {
    if (!form.slug.trim()) return `${t.slug}: ${t.required}`;
    if (!SLUG_PATTERN.test(form.slug.trim())) return t.invalidSlug;
    if (!form.elementId) return `${t.element}: ${t.required}`;
    if (!form.rarityId) return `${t.rarity}: ${t.required}`;
    if (!form.heroClassId) return `${t.heroClass}: ${t.required}`;
    if (!form.manaSpeedId) return `${t.manaSpeed}: ${t.required}`;
    if (form.isCostume && !form.baseHeroId) return t.costumeBaseHeroRequired;
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
    costumeBonusJson: null,
    releaseDate: form.releaseDate || null,
    status: form.status,
    updatedBy: userId ?? '',
    passiveSkillIds: [],
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
    const localizedUploadFields: Array<{ imageLocale: HeroLocale; label: string }> = [
      { imageLocale: 'RU', label: ruImageLabel },
      { imageLocale: 'EN', label: enImageLabel },
    ];
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
      <div><div className="mb-2 text-sm font-semibold text-[var(--foreground)]">{t.stats}</div><div className="mb-3 text-xs text-[var(--foreground-muted)]">{t.statsHint}</div><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><input type="number" min="0" value={form.baseAttack} onChange={(e) => setForm((prev) => ({ ...prev, baseAttack: e.target.value }))} placeholder={t.baseAttack} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /><input type="number" min="0" value={form.baseArmor} onChange={(e) => setForm((prev) => ({ ...prev, baseArmor: e.target.value }))} placeholder={t.baseArmor} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /><input type="number" min="0" value={form.baseHp} onChange={(e) => setForm((prev) => ({ ...prev, baseHp: e.target.value }))} placeholder={t.baseHp} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></div></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.status}</span><select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as HeroStatus }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none">{(['DRAFT', 'READY', 'HIDDEN', 'ARCHIVED'] as HeroStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.releaseDate}</span><input type="date" value={form.releaseDate} onChange={(e) => setForm((prev) => ({ ...prev, releaseDate: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none" /></label></div>
      <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3"><input type="checkbox" checked={form.isCostume} onChange={(e) => setForm((prev) => ({ ...prev, isCostume: e.target.checked, baseHeroId: e.target.checked ? prev.baseHeroId : '' }))} /><span className="text-sm text-[var(--foreground-soft)]">{t.isCostume}</span></label>
      {form.isCostume && <label className="flex flex-col gap-2"><span className="text-sm font-medium text-[var(--foreground-soft)]">{t.baseHero}</span><select value={form.baseHeroId} onChange={(e) => setForm((prev) => ({ ...prev, baseHeroId: e.target.value }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"><option value="">{t.selectBaseHero}</option>{baseHeroes.filter((item) => !isEdit || item.id !== selectedItem?.id).map((item) => <option key={item.id} value={item.id}>{getLocalizedText(item.name, locale)}</option>)}</select></label>}
      {userId && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-xs text-[var(--foreground-muted)]">{t.updatedBy}: {userId}</div>}
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
          {listError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{listError}</div>}
          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{t.loading}</div>
          ) : !publicPage || publicPage.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{t.empty}</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {publicPage.items.map((hero) => (
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
                    <div>{t.slug}: {hero.slug}</div>
                    <div>{t.element}: {hero.elementName}</div>
                    <div>{t.rarity}: {hero.rarityName} ({hero.rarityStars}*)</div>
                    <div>{t.heroClass}: {hero.heroClassName}</div>
                    <div>{t.manaSpeed}: {hero.manaSpeedName}</div>
                  </div>
                </button>
              ))}
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
          {listError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{listError}</div>}
          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{t.loading}</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">{t.empty}</div>
          ) : (
            <div className="space-y-3">
              {items.map((hero) => <button key={hero.id} type="button" onClick={() => setSelectedId(hero.id)} className={`w-full rounded-2xl border p-4 text-left transition ${hero.id === selectedId ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'}`}><div className="text-sm font-semibold text-[var(--foreground)]">{getLocalizedText(hero.name, locale)}</div><div className="mt-2 text-xs text-[var(--foreground-soft)]">{t.slug}: {hero.slug}</div><div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--foreground-muted)]">{hero.status}</div></button>)}
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
                  <div className="p-4 text-sm text-[var(--foreground-soft)]">
                    <div className="font-semibold text-[var(--foreground)]">Image</div>
                    {getLocalizedImageValue(selectedItem.imageObjectKeyJson, 'RU') && (
                      <div className="mt-2">RU: {extractStoredImageName(selectedItem.imageObjectKeyJson.ru)}</div>
                    )}
                    {getLocalizedImageValue(selectedItem.imageObjectKeyJson, 'EN') && (
                      <div className="mt-2">EN: {extractStoredImageName(selectedItem.imageObjectKeyJson.en)}</div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.element}: {resolveName(elements, selectedItem.elementId)}</div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.rarity}: {resolveName(rarities, selectedItem.rarityId)}</div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.heroClass}: {resolveName(heroClasses, selectedItem.heroClassId)}</div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.manaSpeed}: {resolveName(manaSpeeds, selectedItem.manaSpeedId)}</div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.family}: {resolveName(families, selectedItem.familyId)}</div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.alphaTalent}: {resolveName(alphaTalents, selectedItem.alphaTalentId)}</div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseAttack}: {selectedItem.baseAttack ?? t.noValue}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseArmor}: {selectedItem.baseArmor ?? t.noValue}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseHp}: {selectedItem.baseHp ?? t.noValue}</div></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.status}: {selectedItem.status}</div><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.releaseDate}: {selectedItem.releaseDate || t.noValue}</div></div>
              {selectedItem.isCostume && <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]">{t.baseHero}: {resolveName(items.map((item) => ({ id: item.id, name: item.name })), selectedItem.baseHeroId)}</div>}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-soft)]"><div className="mb-2 font-semibold text-[var(--foreground)]">{t.metadata}</div><div>{t.createdAt}: {selectedItem.createdAt}</div><div>{t.updatedBy}: {selectedItem.updatedBy}</div><div>{t.updatedAt}: {selectedItem.updatedAt}</div></div>
            </div>
          )}
        </section>
      </div>

      <DictionaryModal open={isCreateOpen} title={t.createTitle} closeLabel={t.close} onClose={closeCreateModal}><div className="space-y-6">{renderForm(createForm, setCreateForm, false)}<div className="flex justify-end gap-3"><button type="button" disabled={submitting || createUploadingImage.RU || createUploadingImage.EN} onClick={closeCreateModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]">{t.cancel}</button><button type="button" disabled={submitting || createUploadingImage.RU || createUploadingImage.EN} onClick={handleCreate} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15">{submitting ? t.creating : t.create}</button></div></div></DictionaryModal>
      <DictionaryModal open={isEditOpen} title={t.editTitle} closeLabel={t.close} onClose={closeEditModal}><div className="space-y-6">{renderForm(editForm, setEditForm, true)}<div className="flex justify-end gap-3"><button type="button" disabled={submitting || editUploadingImage.RU || editUploadingImage.EN} onClick={closeEditModal} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]">{t.cancel}</button><button type="button" disabled={submitting || editUploadingImage.RU || editUploadingImage.EN} onClick={handleUpdate} className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-300">{submitting ? t.saving : t.save}</button></div></div></DictionaryModal>
    </>
  );
}
