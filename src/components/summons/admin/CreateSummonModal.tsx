'use client';

import { Copy, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import DictionaryModal from '@/components/heroes/admin/DictionaryModal';
import LocalizedTextFields from '@/components/heroes/admin/LocalizedTextFields';
import LocalizedTextareaFields from '@/components/heroes/admin/LocalizedTextareaFields';
import { useI18n } from '@/lib/i18n/i18n-context';
import { EMPTY_LOCALIZED_TEXT, type LocalizedText } from '@/lib/types/hero';
import type {
  BonusResultConditionType,
  SummonAdminDetails,
  SummonBonusConditionRequest,
  SummonContentStatus,
  SummonCreateRequest,
  SummonFamilyOption,
  SummonHeroOption,
  SummonProbabilityDefinition,
  SummonProbabilityDefinitionCreateRequest,
  SummonProbabilityKind,
  SummonRarityOption,
} from '@/lib/types/summon';
import { ApiError, useApi } from '@/lib/use-api';

import SummonHeroPoolField from './SummonHeroPoolField';
import SummonImageUploadField, { type SummonImageValue } from './SummonImageUploadField';
import SummonBonusRulesEditor, {
  emptyBonusCondition,
  type BonusConditionForm,
  type BonusRuleForm,
} from './SummonBonusRulesEditor';

const ADMIN_SUMMONS_API = '/api/v1/admin/summons';
const PROBABILITY_DEFINITIONS_API = '/api/v1/admin/summon-probability-definitions';
const ADMIN_HEROES_API = '/api/v1/admin/heroes';
const ADMIN_FAMILIES_API = '/api/v1/admin/heroes/families';
const ADMIN_RARITIES_API = '/api/v1/admin/heroes/rarities';

type HeroAdminResponse = {
  id: number;
  slug: string;
  nameJson: LocalizedText;
  status: SummonContentStatus;
  familyId?: number | null;
  rarityId?: number | null;
};

type ProbabilityFormItem = {
  key: string;
  definitionId: string;
  kind: SummonProbabilityKind;
  valuePercent: string;
  heroIds: number[];
  userSelectionEnabled: boolean;
  defaultSelectedHeroCount: string;
};

type SummonFormState = {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  status: Exclude<SummonContentStatus, 'HIDDEN'>;
  portalImage: SummonImageValue;
  backgroundImage: SummonImageValue;
  probabilities: ProbabilityFormItem[];
  bonusRules: BonusRuleForm[];
};

const EMPTY_IMAGE: SummonImageValue = { bucket: null, objectKey: null, url: null };

function createEmptyForm(): SummonFormState {
  return {
    slug: '',
    name: { ...EMPTY_LOCALIZED_TEXT },
    description: { ...EMPTY_LOCALIZED_TEXT },
    status: 'DRAFT',
    portalImage: { ...EMPTY_IMAGE },
    backgroundImage: { ...EMPTY_IMAGE },
    probabilities: [],
    bonusRules: [],
  };
}

function percentageToHundredths(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,3}(?:\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

function formatHundredths(value: number) {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const whole = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0').replace(/0+$/, '');
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`;
}

function conditionFromResponse(
  condition: { type: BonusResultConditionType; rarityId?: number | null; probabilityId?: string | null } | null | undefined,
  probabilityDefinitionById: Map<string, string>,
): BonusConditionForm {
  if (!condition) return emptyBonusCondition();
  return {
    type: condition.type,
    rarityId: condition.rarityId ? String(condition.rarityId) : '',
    probabilityDefinitionId: condition.probabilityId
      ? probabilityDefinitionById.get(condition.probabilityId) ?? ''
      : '',
  };
}

function createFormFromSummon(summon: SummonAdminDetails): SummonFormState {
  const probabilityDefinitionById = new Map(
    summon.defaultVariant.probabilities.map((probability) => [probability.id, probability.definition.id]),
  );

  return {
    slug: summon.slug,
    name: { ...summon.nameJson },
    description: summon.descriptionJson ? { ...summon.descriptionJson } : { ...EMPTY_LOCALIZED_TEXT },
    status: summon.status === 'HIDDEN' ? 'DRAFT' : summon.status,
    portalImage: {
      bucket: summon.imageBucket ?? null,
      objectKey: summon.imageObjectKey ?? null,
      url: summon.imageUrl ?? null,
    },
    backgroundImage: {
      bucket: summon.backgroundImageBucket ?? null,
      objectKey: summon.backgroundImageObjectKey ?? null,
      url: summon.backgroundImageUrl ?? null,
    },
    probabilities: summon.defaultVariant.probabilities.map((probability) => ({
      key: probability.id,
      definitionId: probability.definition.id,
      kind: probability.kind as SummonProbabilityKind,
      valuePercent: String(probability.valuePercent),
      heroIds: probability.heroIds,
      userSelectionEnabled: probability.userSelectionEnabled,
      defaultSelectedHeroCount: String(probability.defaultSelectedHeroCount ?? 2),
    })),
    bonusRules: summon.defaultVariant.bonusRules.map((rule) => ({
      key: rule.id,
      definitionId: rule.definition.id,
      kind: rule.kind,
      userSelectable: rule.userSelectable,
      triggerCondition: conditionFromResponse(rule.triggerCondition, probabilityDefinitionById),
      continuationCondition: conditionFromResponse(rule.continuationCondition, probabilityDefinitionById),
      steps: rule.steps.map((step) => ({
        key: step.id,
        activationChancePercent: String(step.activationChancePercent),
        rewardMode: step.rewardMode,
        rewardProbabilities: step.rewardProbabilities.map((reward) => ({
          key: `${step.id}-${reward.probabilityId}`,
          probabilityDefinitionId: probabilityDefinitionById.get(reward.probabilityId) ?? '',
          valuePercent: String(reward.valuePercent),
        })),
      })),
    })),
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);
}

function optionalLocalizedText(value: LocalizedText): LocalizedText | null {
  const ru = value.ru.trim();
  const en = value.en.trim();
  return ru || en ? { ru, en } : null;
}

export default function CreateSummonModal({
  open,
  onClose,
  onSaved,
  summon = null,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (summon: SummonAdminDetails) => void | Promise<void>;
  summon?: SummonAdminDetails | null;
}) {
  const { apiJson, apiPostJson, apiPutJson } = useApi();
  const { locale } = useI18n();
  const [form, setForm] = useState<SummonFormState>(createEmptyForm);
  const [definitions, setDefinitions] = useState<SummonProbabilityDefinition[]>([]);
  const [heroes, setHeroes] = useState<SummonHeroOption[]>([]);
  const [families, setFamilies] = useState<SummonFamilyOption[]>([]);
  const [rarities, setRarities] = useState<SummonRarityOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  const [portalUploading, setPortalUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slugManuallyChanged, setSlugManuallyChanged] = useState(false);
  const [definitionTarget, setDefinitionTarget] = useState<{
    type: 'probability' | 'bonus';
    key: string;
  } | null>(null);
  const [definitionName, setDefinitionName] = useState<LocalizedText>({ ...EMPTY_LOCALIZED_TEXT });
  const [definitionDescription, setDefinitionDescription] = useState<LocalizedText>({ ...EMPTY_LOCALIZED_TEXT });
  const [creatingDefinition, setCreatingDefinition] = useState(false);
  const [definitionError, setDefinitionError] = useState<string | null>(null);

  const text = useMemo(
    () =>
      locale === 'ru'
        ? {
            title: 'Создание призыва',
            editTitle: 'Редактирование призыва',
            close: 'Закрыть',
            basic: 'Основная информация',
            slug: 'Slug',
            slugHint: 'Только латинские буквы, цифры и дефисы.',
            status: 'Статус',
            draft: 'Черновик',
            ready: 'Готов',
            archived: 'Архивный',
            nameRu: 'Название RU',
            nameEn: 'Name EN',
            descriptionRu: 'Описание RU',
            descriptionEn: 'Description EN',
            optional: 'Описание необязательное.',
            portalImage: 'Изображение портала',
            backgroundImage: 'Фоновое изображение призыва',
            probabilities: 'Вероятности',
            probabilityHint: 'Каждая вероятность содержит процент и собственный пул героев.',
            addProbability: 'Добавить вероятность',
            duplicateProbability: 'Дублировать вероятность',
            removeProbability: 'Удалить вероятность',
            definition: 'Название вероятности',
            selectDefinition: 'Выберите существующее определение',
            newDefinition: 'Создать новое определение',
            kind: 'Тип вероятности',
            main: 'Основная',
            bonus: 'Бонусный пул',
            percent: 'Вероятность, %',
            userSelection: 'Это пул рекомендованных героев',
            userSelectionHint:
              'Если пул пуст, в будущем пользователь должен будет выбрать героев самостоятельно.',
            defaultSelectedHeroCount: 'Количество героев по умолчанию',
            recommendedLimit: 'Только герои 5★, максимум 10.',
            mainTotal: 'Сумма основных вероятностей',
            remaining: 'Осталось до 100%',
            emptyProbabilities: 'Вероятности ещё не добавлены. Черновик можно сохранить без них.',
            definitionCreateTitle: 'Новое определение вероятности',
            definitionDescriptionHint: 'Это название можно будет переиспользовать в других призывах.',
            createDefinition: 'Создать и выбрать',
            cancelDefinition: 'Отмена',
            save: 'Создать призыв',
            update: 'Сохранить изменения',
            cancel: 'Отмена',
            loadingOptions: 'Загрузка героев и определений...',
            requiredNames: 'Заполните название на русском и английском языках.',
            invalidSlug: 'Slug должен содержать только латинские буквы, цифры и дефисы.',
            incompleteProbability: 'Заполните определение и корректный процент у каждой вероятности.',
            percentagePrecision: 'Процент может содержать не более двух знаков после запятой.',
            duplicateDefinition: 'Одно определение вероятности нельзя добавить дважды.',
            invalidRecommendedPool:
              'Для рекомендованного пула укажите от 1 до 10 героев по умолчанию и используйте только героев 5★.',
            duplicateRecommendedPool: 'В одном варианте может быть только один пул рекомендованных героев.',
            readyTotal: 'Для статуса READY сумма основных вероятностей должна быть ровно 100%.',
            incompleteBonus: 'Полностью настройте название, условия и шаги каждого бонусного правила.',
            definitionNamesRequired: 'Заполните название определения на русском и английском языках.',
            fallbackError: 'Не удалось создать призыв.',
          }
        : {
            title: 'Create summon',
            editTitle: 'Edit summon',
            close: 'Close',
            basic: 'Basic information',
            slug: 'Slug',
            slugHint: 'Use only Latin letters, numbers, and hyphens.',
            status: 'Status',
            draft: 'Draft',
            ready: 'Ready',
            archived: 'Archived',
            nameRu: 'Название RU',
            nameEn: 'Name EN',
            descriptionRu: 'Описание RU',
            descriptionEn: 'Description EN',
            optional: 'Description is optional.',
            portalImage: 'Portal image',
            backgroundImage: 'Summon background image',
            probabilities: 'Probabilities',
            probabilityHint: 'Each probability has a percentage and its own hero pool.',
            addProbability: 'Add probability',
            duplicateProbability: 'Duplicate probability',
            removeProbability: 'Remove probability',
            definition: 'Probability name',
            selectDefinition: 'Select an existing definition',
            newDefinition: 'Create new definition',
            kind: 'Probability type',
            main: 'Main',
            bonus: 'Bonus pool',
            percent: 'Probability, %',
            userSelection: 'This is the featured hero pool',
            userSelectionHint:
              'When the pool is empty, the user will have to select heroes later.',
            defaultSelectedHeroCount: 'Default hero count',
            recommendedLimit: 'Only 5★ heroes, maximum 10.',
            mainTotal: 'Main probability total',
            remaining: 'Remaining to 100%',
            emptyProbabilities: 'No probabilities added yet. A draft can be saved without them.',
            definitionCreateTitle: 'New probability definition',
            definitionDescriptionHint: 'This name can be reused in other summons.',
            createDefinition: 'Create and select',
            cancelDefinition: 'Cancel',
            save: 'Create summon',
            update: 'Save changes',
            cancel: 'Cancel',
            loadingOptions: 'Loading heroes and definitions...',
            requiredNames: 'Enter the Russian and English names.',
            invalidSlug: 'Slug may contain only Latin letters, numbers, and hyphens.',
            incompleteProbability: 'Select a definition and enter a valid percentage for every probability.',
            percentagePrecision: 'A percentage may contain no more than two decimal places.',
            duplicateDefinition: 'A probability definition cannot be added twice.',
            invalidRecommendedPool:
              'Use a default count from 1 to 10 and only 5★ heroes for the featured pool.',
            duplicateRecommendedPool: 'A variant can contain only one featured hero pool.',
            readyTotal: 'MAIN probabilities must total exactly 100% for READY status.',
            incompleteBonus: 'Complete the name, conditions, and steps of every bonus rule.',
            definitionNamesRequired: 'Enter the Russian and English definition names.',
            fallbackError: 'Failed to create summon.',
          },
    [locale],
  );

  const mainTotalHundredths = useMemo(
    () =>
      form.probabilities
        .filter((item) => item.kind === 'MAIN')
        .reduce((total, item) => total + (percentageToHundredths(item.valuePercent) ?? 0), 0),
    [form.probabilities],
  );

  const fiveStarRarityIds = useMemo(
    () => new Set(rarities.filter((rarity) => rarity.stars === 5).map((rarity) => rarity.id)),
    [rarities],
  );

  const initializationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initializationKeyRef.current = null;
      return;
    }
    const initializationKey = summon?.id ?? 'new';
    if (initializationKeyRef.current === initializationKey) return;
    initializationKeyRef.current = initializationKey;
    setForm(summon ? createFormFromSummon(summon) : createEmptyForm());
    setErrorMessage(null);
    setSlugManuallyChanged(Boolean(summon));
    setDefinitionTarget(null);
    setDefinitionName({ ...EMPTY_LOCALIZED_TEXT });
    setDefinitionDescription({ ...EMPTY_LOCALIZED_TEXT });
    setDefinitionError(null);
  }, [open, summon]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [definitionResponse, heroResponse, familyResponse, rarityResponse] = await Promise.all([
          apiJson<SummonProbabilityDefinition[]>(PROBABILITY_DEFINITIONS_API),
          apiJson<HeroAdminResponse[]>(ADMIN_HEROES_API),
          apiJson<SummonFamilyOption[]>(ADMIN_FAMILIES_API),
          apiJson<SummonRarityOption[]>(ADMIN_RARITIES_API),
        ]);
        if (!cancelled) {
          setDefinitions(definitionResponse);
          setHeroes(heroResponse.map(({ id, slug, nameJson, status, familyId, rarityId }) => ({
            id,
            slug,
            nameJson,
            status,
            familyId,
            rarityId,
          })));
          setFamilies(familyResponse);
          setRarities(rarityResponse);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : text.fallbackError);
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [apiJson, open, text.fallbackError]);

  const handleNameChange = (name: LocalizedText) => {
    setForm((previous) => ({
      ...previous,
      name,
      slug: slugManuallyChanged ? previous.slug : slugify(name.en || name.ru),
    }));
  };

  const addProbability = () => {
    const key = `probability-${Date.now()}-${form.probabilities.length}`;
    setForm((previous) => ({
      ...previous,
      probabilities: [
        {
          key,
          definitionId: '',
          kind: 'MAIN',
          valuePercent: '',
          heroIds: [],
          userSelectionEnabled: false,
          defaultSelectedHeroCount: '2',
        },
        ...previous.probabilities,
      ],
    }));
  };

  const updateProbability = (key: string, changes: Partial<ProbabilityFormItem>) => {
    setForm((previous) => ({
      ...previous,
      probabilities: previous.probabilities.map((item) =>
        item.key === key ? { ...item, ...changes } : item,
      ),
    }));
  };

  const duplicateProbability = (key: string) => {
    setForm((previous) => {
      const index = previous.probabilities.findIndex((item) => item.key === key);
      if (index < 0) return previous;
      const source = previous.probabilities[index];
      const copy: ProbabilityFormItem = {
        ...source,
        key: crypto.randomUUID(),
        heroIds: [...source.heroIds],
      };
      return {
        ...previous,
        probabilities: [
          ...previous.probabilities.slice(0, index + 1),
          copy,
          ...previous.probabilities.slice(index + 1),
        ],
      };
    });
  };

  const removeProbability = (key: string) => {
    setForm((previous) => ({
      ...previous,
      probabilities: previous.probabilities.filter((item) => item.key !== key),
    }));
    if (definitionTarget?.type === 'probability' && definitionTarget.key === key) {
      setDefinitionTarget(null);
    }
  };

  const openDefinitionCreator = (type: 'probability' | 'bonus', key: string) => {
    setDefinitionTarget({ type, key });
    setDefinitionName({ ...EMPTY_LOCALIZED_TEXT });
    setDefinitionDescription({ ...EMPTY_LOCALIZED_TEXT });
    setDefinitionError(null);
  };

  const createDefinition = async () => {
    if (!definitionName.ru.trim() || !definitionName.en.trim()) {
      setDefinitionError(text.definitionNamesRequired);
      return;
    }

    try {
      setCreatingDefinition(true);
      setDefinitionError(null);
      const request: SummonProbabilityDefinitionCreateRequest = {
        nameJson: { ru: definitionName.ru.trim(), en: definitionName.en.trim() },
        descriptionJson: optionalLocalizedText(definitionDescription),
      };
      const created = await apiPostJson<
        SummonProbabilityDefinitionCreateRequest,
        SummonProbabilityDefinition
      >(PROBABILITY_DEFINITIONS_API, request);

      setDefinitions((previous) =>
        [...previous, created].sort((left, right) =>
          (left.nameJson?.ru || left.nameJson?.en || '').localeCompare(
            right.nameJson?.ru || right.nameJson?.en || '',
          ),
        ),
      );
      if (definitionTarget?.type === 'probability') {
        updateProbability(definitionTarget.key, { definitionId: created.id });
      } else if (definitionTarget?.type === 'bonus') {
        setForm((previous) => ({
          ...previous,
          bonusRules: previous.bonusRules.map((rule) =>
            rule.key === definitionTarget.key ? { ...rule, definitionId: created.id } : rule,
          ),
        }));
      }
      setDefinitionTarget(null);
    } catch (error) {
      setDefinitionError(error instanceof ApiError || error instanceof Error ? error.message : text.fallbackError);
    } finally {
      setCreatingDefinition(false);
    }
  };

  const validate = () => {
    if (!form.name.ru.trim() || !form.name.en.trim()) return text.requiredNames;
    if (!/^[a-z0-9-]+$/.test(form.slug.trim())) return text.invalidSlug;

    const definitionIds = new Set<string>();
    let recommendedPools = 0;
    for (const probability of form.probabilities) {
      if (!probability.definitionId || probability.valuePercent === '') {
        return text.incompleteProbability;
      }
      const value = percentageToHundredths(probability.valuePercent);
      if (value === null) return text.percentagePrecision;
      if (value < 0 || value > 10_000) {
        return text.incompleteProbability;
      }
      if (definitionIds.has(probability.definitionId)) return text.duplicateDefinition;
      definitionIds.add(probability.definitionId);

      if (probability.userSelectionEnabled) {
        recommendedPools += 1;
        const defaultCount = Number(probability.defaultSelectedHeroCount);
        const selectedHeroes = probability.heroIds
          .map((heroId) => heroes.find((hero) => hero.id === heroId))
          .filter((hero): hero is SummonHeroOption => Boolean(hero));
        if (
          probability.kind !== 'MAIN'
          || !Number.isInteger(defaultCount)
          || defaultCount < 1
          || defaultCount > 10
          || probability.heroIds.length > 10
          || selectedHeroes.some((hero) => !hero.rarityId || !fiveStarRarityIds.has(hero.rarityId))
        ) {
          return text.invalidRecommendedPool;
        }
      }
    }
    if (recommendedPools > 1) return text.duplicateRecommendedPool;

    const configuredDefinitionIds = new Set(form.probabilities.map((probability) => probability.definitionId));
    const conditionIsValid = (condition: BonusConditionForm) => {
      if (condition.type === 'RARITY') return Boolean(condition.rarityId);
      if (condition.type === 'PROBABILITY') {
        return Boolean(condition.probabilityDefinitionId)
          && configuredDefinitionIds.has(condition.probabilityDefinitionId);
      }
      return true;
    };

    for (const rule of form.bonusRules) {
      if (!rule.definitionId || rule.steps.length === 0) return text.incompleteBonus;
      if (rule.kind === 'CONDITIONAL' && !conditionIsValid(rule.triggerCondition)) {
        return text.incompleteBonus;
      }
      if (rule.steps.length > 1 && !conditionIsValid(rule.continuationCondition)) {
        return text.incompleteBonus;
      }
      for (const step of rule.steps) {
        const chance = percentageToHundredths(step.activationChancePercent);
        if (chance === null || chance < 0 || chance > 10_000) return text.incompleteBonus;
        if (step.rewardMode === 'CUSTOM_DISTRIBUTION') {
          if (step.rewardProbabilities.length === 0) return text.incompleteBonus;
          const rewardDefinitionIds = new Set<string>();
          let rewardTotal = 0;
          for (const reward of step.rewardProbabilities) {
            const rewardPercent = percentageToHundredths(reward.valuePercent);
            if (
              !reward.probabilityDefinitionId
              || !configuredDefinitionIds.has(reward.probabilityDefinitionId)
              || rewardDefinitionIds.has(reward.probabilityDefinitionId)
              || rewardPercent === null
              || rewardPercent <= 0
              || rewardPercent > 10_000
            ) return text.incompleteBonus;
            rewardDefinitionIds.add(reward.probabilityDefinitionId);
            rewardTotal += rewardPercent;
          }
          if (rewardTotal !== 10_000) return text.incompleteBonus;
        } else if (step.rewardProbabilities.length > 0) {
          return text.incompleteBonus;
        }
      }
    }

    if (form.status === 'READY' && mainTotalHundredths !== 10_000) {
      return text.readyTotal;
    }
    return null;
  };

  const toConditionRequest = (condition: BonusConditionForm): SummonBonusConditionRequest => ({
    type: condition.type,
    rarityId: condition.type === 'RARITY' ? Number(condition.rarityId) : null,
    probabilityDefinitionId:
      condition.type === 'PROBABILITY' ? condition.probabilityDefinitionId : null,
  });

  const handleSave = async () => {
    if (saveInFlightRef.current) return;

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const request: SummonCreateRequest = {
      slug: form.slug.trim(),
      nameJson: { ru: form.name.ru.trim(), en: form.name.en.trim() },
      descriptionJson: optionalLocalizedText(form.description),
      status: form.status,
      imageBucket: form.portalImage.bucket ?? null,
      imageObjectKey: form.portalImage.objectKey ?? null,
      backgroundImageBucket: form.backgroundImage.bucket ?? null,
      backgroundImageObjectKey: form.backgroundImage.objectKey ?? null,
      probabilities: form.probabilities.map((item, index) => ({
        definitionId: item.definitionId,
        kind: item.kind,
        valuePercent: Number(item.valuePercent),
        position: index + 1,
        heroIds: item.heroIds,
        userSelectionEnabled: item.userSelectionEnabled,
        defaultSelectedHeroCount: item.userSelectionEnabled
          ? Number(item.defaultSelectedHeroCount)
          : null,
      })),
      bonusRules: form.bonusRules.map((rule) => ({
        definitionId: rule.definitionId,
        kind: rule.kind,
        userSelectable: rule.userSelectable,
        triggerCondition: rule.kind === 'CONDITIONAL'
          ? toConditionRequest(rule.triggerCondition)
          : null,
        continuationCondition: rule.steps.length > 1
          ? toConditionRequest(rule.continuationCondition)
          : null,
        steps: rule.steps.map((step, index) => ({
          position: index + 1,
          activationChancePercent: Number(step.activationChancePercent),
          rewardMode: step.rewardMode,
          rewardProbabilities: step.rewardMode === 'CUSTOM_DISTRIBUTION'
            ? step.rewardProbabilities.map((reward, rewardIndex) => ({
                probabilityDefinitionId: reward.probabilityDefinitionId,
                valuePercent: Number(reward.valuePercent),
                position: rewardIndex + 1,
              }))
            : [],
        })),
      })),
    };

    try {
      saveInFlightRef.current = true;
      setSaving(true);
      setErrorMessage(null);
      const saved = summon
        ? await apiPutJson<SummonCreateRequest, SummonAdminDetails>(
            `${ADMIN_SUMMONS_API}/${summon.id}`,
            request,
          )
        : await apiPostJson<SummonCreateRequest, SummonAdminDetails>(ADMIN_SUMMONS_API, request);
      await onSaved(saved);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof ApiError || error instanceof Error ? error.message : text.fallbackError);
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  const busy = saving || portalUploading || backgroundUploading;

  return (
    <DictionaryModal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      closeLabel={text.close}
      closeOnBackdropClick={false}
      title={summon ? text.editTitle : text.title}
      headerActions={
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy}
          className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {summon ? text.update : text.save}
        </button>
      }
      maxWidthClassName="md:max-w-6xl"
    >
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <h4 className="text-lg font-bold text-[var(--foreground)]">{text.basic}</h4>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.slug}</span>
              <input
                type="text"
                value={form.slug}
                onChange={(event) => {
                  setSlugManuallyChanged(true);
                  setForm((previous) => ({ ...previous, slug: event.target.value.toLocaleLowerCase() }));
                }}
                disabled={saving}
                placeholder="astral-summon"
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
              />
              <span className="text-xs text-[var(--foreground-muted)]">{text.slugHint}</span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.status}</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    status: event.target.value as SummonFormState['status'],
                  }))
                }
                disabled={saving}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
              >
                <option value="DRAFT">{text.draft}</option>
                <option value="READY">{text.ready}</option>
                <option value="ARCHIVED">{text.archived}</option>
              </select>
            </label>
          </div>

          <LocalizedTextFields
            value={form.name}
            onChange={handleNameChange}
            ruLabel={text.nameRu}
            enLabel={text.nameEn}
            disabled={saving}
          />
          <div className="space-y-2">
            <div className="text-xs text-[var(--foreground-muted)]">{text.optional}</div>
            <LocalizedTextareaFields
              value={form.description}
              onChange={(description) => setForm((previous) => ({ ...previous, description }))}
              ruLabel={text.descriptionRu}
              enLabel={text.descriptionEn}
              disabled={saving}
              rows={4}
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <SummonImageUploadField
            locale={locale}
            label={text.portalImage}
            value={form.portalImage}
            onChange={(portalImage) => setForm((previous) => ({ ...previous, portalImage }))}
            onUploadingChange={setPortalUploading}
            disabled={saving}
          />
          <SummonImageUploadField
            locale={locale}
            label={text.backgroundImage}
            value={form.backgroundImage}
            onChange={(backgroundImage) => setForm((previous) => ({ ...previous, backgroundImage }))}
            onUploadingChange={setBackgroundUploading}
            disabled={saving}
          />
        </section>

        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-lg font-bold text-[var(--foreground)]">{text.probabilities}</h4>
              <p className="mt-1 text-sm text-[var(--foreground-soft)]">{text.probabilityHint}</p>
            </div>
            <button
              type="button"
              onClick={addProbability}
              disabled={saving || loadingOptions}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {text.addProbability}
            </button>
          </div>

          <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-[var(--foreground-soft)]">{text.mainTotal}</div>
              <div className={`mt-1 text-xl font-bold ${mainTotalHundredths === 10_000 ? 'text-emerald-300' : 'text-fuchsia-300'}`}>
                {formatHundredths(mainTotalHundredths)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--foreground-soft)]">{text.remaining}</div>
              <div className="mt-1 text-xl font-bold text-[var(--foreground)]">
                {formatHundredths(10_000 - mainTotalHundredths)}%
              </div>
            </div>
          </div>

          {loadingOptions ? <div className="text-sm text-[var(--foreground-soft)]">{text.loadingOptions}</div> : null}

          {form.probabilities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--foreground-soft)]">
              {text.emptyProbabilities}
            </div>
          ) : (
            <div className="space-y-4">
              {form.probabilities.map((probability, index) => (
                <article key={probability.key} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-[var(--foreground)]">#{index + 1}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => duplicateProbability(probability.key)}
                        disabled={saving}
                        aria-label={text.duplicateProbability}
                        title={text.duplicateProbability}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        {text.duplicateProbability}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProbability(probability.key)}
                        disabled={saving}
                        aria-label={text.removeProbability}
                        className="rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-red-300 transition hover:bg-red-400/15 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.definition}</span>
                      <select
                        value={probability.definitionId}
                        onChange={(event) => updateProbability(probability.key, { definitionId: event.target.value })}
                        disabled={saving}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                      >
                        <option value="">{text.selectDefinition}</option>
                        {definitions.map((definition) => (
                          <option key={definition.id} value={definition.id}>
                            {(locale === 'ru' ? definition.nameJson?.ru : definition.nameJson?.en) || definition.nameJson?.ru || definition.nameJson?.en}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => openDefinitionCreator('probability', probability.key)}
                        disabled={saving}
                        className="w-fit text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
                      >
                        + {text.newDefinition}
                      </button>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.kind}</span>
                      <select
                        value={probability.kind}
                        onChange={(event) => {
                          const kind = event.target.value as SummonProbabilityKind;
                          updateProbability(probability.key, {
                            kind,
                            userSelectionEnabled: kind === 'MAIN' && probability.userSelectionEnabled,
                          });
                        }}
                        disabled={saving}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                      >
                        <option value="MAIN">{text.main}</option>
                        <option value="BONUS">{text.bonus}</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.percent}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={probability.valuePercent}
                        onChange={(event) => updateProbability(probability.key, { valuePercent: event.target.value })}
                        disabled={saving}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                      />
                    </label>
                  </div>

                  {definitionTarget?.type === 'probability' && definitionTarget.key === probability.key ? (
                    <div className="space-y-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                      <div>
                        <div className="font-semibold text-[var(--foreground)]">{text.definitionCreateTitle}</div>
                        <div className="mt-1 text-xs text-[var(--foreground-soft)]">{text.definitionDescriptionHint}</div>
                      </div>
                      <LocalizedTextFields value={definitionName} onChange={setDefinitionName} disabled={creatingDefinition} />
                      <LocalizedTextareaFields value={definitionDescription} onChange={setDefinitionDescription} disabled={creatingDefinition} rows={3} />
                      {definitionError ? <div className="text-sm text-red-300">{definitionError}</div> : null}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void createDefinition()}
                          disabled={creatingDefinition}
                          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 disabled:opacity-50"
                        >
                          {text.createDefinition}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDefinitionTarget(null)}
                          disabled={creatingDefinition}
                          className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-soft)]"
                        >
                          {text.cancelDefinition}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
                    <label className="flex items-start gap-3 text-sm text-[var(--foreground-soft)]">
                      <input
                        type="checkbox"
                        checked={probability.userSelectionEnabled}
                        onChange={(event) => {
                          const enabled = event.target.checked;
                          updateProbability(probability.key, {
                            userSelectionEnabled: enabled,
                            kind: enabled ? 'MAIN' : probability.kind,
                            heroIds: enabled
                              ? probability.heroIds.filter((heroId) => {
                                  const hero = heroes.find((item) => item.id === heroId);
                                  return Boolean(hero?.rarityId && fiveStarRarityIds.has(hero.rarityId));
                                }).slice(0, 10)
                              : probability.heroIds,
                          });
                        }}
                        disabled={saving}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <span>
                        <span className="block font-semibold text-[var(--foreground)]">{text.userSelection}</span>
                        <span className="mt-1 block text-xs leading-5">{text.userSelectionHint}</span>
                      </span>
                    </label>

                    {probability.userSelectionEnabled ? (
                      <label className="flex max-w-xs flex-col gap-2">
                        <span className="text-xs font-medium text-[var(--foreground-soft)]">
                          {text.defaultSelectedHeroCount}
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="1"
                          value={probability.defaultSelectedHeroCount}
                          onChange={(event) => updateProbability(probability.key, {
                            defaultSelectedHeroCount: event.target.value,
                          })}
                          disabled={saving}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                        />
                        <span className="text-xs text-[var(--foreground-muted)]">{text.recommendedLimit}</span>
                      </label>
                    ) : null}
                  </div>

                  <SummonHeroPoolField
                    locale={locale}
                    heroes={heroes}
                    families={families}
                    rarities={rarities}
                    selectedIds={probability.heroIds}
                    onChange={(heroIds) => updateProbability(probability.key, { heroIds })}
                    disabled={saving}
                    allowedRarityStars={probability.userSelectionEnabled ? 5 : undefined}
                    maxSelected={probability.userSelectionEnabled ? 10 : undefined}
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        <SummonBonusRulesEditor
          locale={locale}
          definitions={definitions}
          probabilityDefinitionIds={form.probabilities.map((probability) => probability.definitionId).filter(Boolean)}
          rarities={rarities}
          rules={form.bonusRules}
          onChange={(bonusRules) => setForm((previous) => ({ ...previous, bonusRules }))}
          onCreateDefinition={(ruleKey) => openDefinitionCreator('bonus', ruleKey)}
          disabled={saving || loadingOptions}
        />

        {definitionTarget?.type === 'bonus' ? (
          <section className="space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <div>
              <div className="font-semibold text-[var(--foreground)]">{text.definitionCreateTitle}</div>
              <div className="mt-1 text-xs text-[var(--foreground-soft)]">{text.definitionDescriptionHint}</div>
            </div>
            <LocalizedTextFields value={definitionName} onChange={setDefinitionName} disabled={creatingDefinition} />
            <LocalizedTextareaFields value={definitionDescription} onChange={setDefinitionDescription} disabled={creatingDefinition} rows={3} />
            {definitionError ? <div className="text-sm text-red-300">{definitionError}</div> : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void createDefinition()}
                disabled={creatingDefinition}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 disabled:opacity-50"
              >
                {text.createDefinition}
              </button>
              <button
                type="button"
                onClick={() => setDefinitionTarget(null)}
                disabled={creatingDefinition}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-soft)]"
              >
                {text.cancelDefinition}
              </button>
            </div>
          </section>
        ) : null}

        {errorMessage ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            {text.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy}
            className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {summon ? text.update : text.save}
          </button>
        </div>
      </div>
    </DictionaryModal>
  );
}
