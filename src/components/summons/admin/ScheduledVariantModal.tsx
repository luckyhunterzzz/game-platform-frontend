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
  SummonBonusConditionRequest,
  SummonContentStatus,
  SummonFamilyOption,
  SummonHeroOption,
  SummonHeroVariantMode,
  SummonProbabilityCreateRequest,
  SummonProbabilityDefinition,
  SummonProbabilityDefinitionCreateRequest,
  SummonProbabilityKind,
  SummonRarityOption,
  SummonVariant,
  SummonVariantCloneRequest,
  SummonVariantUpdateRequest,
} from '@/lib/types/summon';
import { ApiError, useApi } from '@/lib/use-api';

import SummonBonusRulesEditor, {
  emptyBonusCondition,
  type BonusConditionForm,
  type BonusRuleForm,
} from './SummonBonusRulesEditor';
import SummonHeroPoolField from './SummonHeroPoolField';
import SummonHeroVariantModeField from './SummonHeroVariantModeField';
import { normalizeHeroIdsForMode, resolveHeroOptionsForMode } from './summon-hero-variants';

const PROBABILITY_DEFINITIONS_API = '/api/v1/admin/summon-probability-definitions';
const ADMIN_HEROES_API = '/api/v1/admin/heroes';
const ADMIN_FAMILIES_API = '/api/v1/admin/heroes/families';
const ADMIN_RARITIES_API = '/api/v1/admin/heroes/rarities';

type HeroAdminResponse = {
  id: number;
  slug: string;
  nameJson: SummonHeroOption['nameJson'];
  status: SummonContentStatus;
  familyId?: number | null;
  rarityId?: number | null;
  isCostume?: boolean;
  baseHeroId?: number | null;
  costumeIndex?: number | null;
};

type ProbabilityFormItem = {
  key: string;
  definitionId: string;
  kind: SummonProbabilityKind;
  valuePercent: string;
  heroIds: number[];
  heroVariantMode: SummonHeroVariantMode;
  userSelectionEnabled: boolean;
  defaultSelectedHeroCount: string;
};

function percentageToHundredths(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,3}(?:\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

function formatHundredths(value: number) {
  const whole = Math.floor(Math.abs(value) / 100);
  const fraction = String(Math.abs(value) % 100).padStart(2, '0').replace(/0+$/, '');
  return `${value < 0 ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

function toLocalInput(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string) {
  return new Date(value).toISOString();
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

function probabilityForms(variant: SummonVariant): ProbabilityFormItem[] {
  return variant.probabilities.map((probability) => ({
    key: probability.id,
    definitionId: probability.definition.id,
    kind: 'MAIN',
    valuePercent: String(probability.valuePercent),
    heroIds: probability.heroIds,
    heroVariantMode: probability.heroVariantMode ?? 'EXACT',
    userSelectionEnabled: probability.userSelectionEnabled,
    defaultSelectedHeroCount: String(probability.defaultSelectedHeroCount ?? 2),
  }));
}

function bonusRuleForms(variant: SummonVariant): BonusRuleForm[] {
  const probabilityDefinitionById = new Map(
    variant.probabilities.map((probability) => [probability.id, probability.definition.id]),
  );
  return variant.bonusRules.map((rule) => ({
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
      userHeroSelectionEnabled: step.userHeroSelectionEnabled,
      rewardHeroIds: step.rewardHeroIds,
    })),
  }));
}

function localizedName(
  value: { ru?: string | null; en?: string | null } | null | undefined,
  locale: 'ru' | 'en',
) {
  const primary = locale === 'ru' ? value?.ru : value?.en;
  const secondary = locale === 'ru' ? value?.en : value?.ru;
  return primary?.trim() || secondary?.trim() || '—';
}

function optionalLocalizedText(value: LocalizedText): LocalizedText | null {
  const ru = value.ru.trim();
  const en = value.en.trim();
  return ru || en ? { ru, en } : null;
}

export default function ScheduledVariantModal({
  open,
  summonId,
  variants,
  variant,
  onClose,
  onSaved,
}: {
  open: boolean;
  summonId: string;
  variants: SummonVariant[];
  variant?: SummonVariant | null;
  onClose: () => void;
  onSaved: (variant: SummonVariant) => void | Promise<void>;
}) {
  const { apiJson, apiPostJson, apiPutJson } = useApi();
  const { locale } = useI18n();
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [status, setStatus] = useState<Exclude<SummonContentStatus, 'HIDDEN'>>('DRAFT');
  const [sourceVariantId, setSourceVariantId] = useState('');
  const [probabilities, setProbabilities] = useState<ProbabilityFormItem[]>([]);
  const [bonusRules, setBonusRules] = useState<BonusRuleForm[]>([]);
  const [definitions, setDefinitions] = useState<SummonProbabilityDefinition[]>([]);
  const [heroes, setHeroes] = useState<SummonHeroOption[]>([]);
  const [families, setFamilies] = useState<SummonFamilyOption[]>([]);
  const [rarities, setRarities] = useState<SummonRarityOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [definitionCreatorOpen, setDefinitionCreatorOpen] = useState(false);
  const [definitionName, setDefinitionName] = useState<LocalizedText>({ ...EMPTY_LOCALIZED_TEXT });
  const [definitionDescription, setDefinitionDescription] = useState<LocalizedText>({ ...EMPTY_LOCALIZED_TEXT });
  const [creatingDefinition, setCreatingDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveInFlightRef = useRef(false);

  const text = useMemo(() => locale === 'ru'
    ? {
        createTitle: 'Новая календарная версия',
        editTitle: 'Редактирование календарной версии',
        close: 'Закрыть',
        source: 'Скопировать настройки из',
        period: 'Период',
        startsAt: 'Начало',
        endsAt: 'Окончание',
        status: 'Статус',
        draft: 'Черновик',
        ready: 'Готов',
        archived: 'Архивный',
        save: 'Сохранить',
        create: 'Создать версию',
        probabilities: 'Вероятности',
        probabilityHint: 'Календарная версия хранит собственный снимок настроек.',
        addProbability: 'Добавить вероятность',
        duplicateProbability: 'Дублировать вероятность',
        definition: 'Название вероятности',
        selectDefinition: 'Выберите определение',
        newDefinition: 'Создать новое определение',
        definitionNameRequired: 'Заполните название определения на русском и английском языках.',
        createDefinition: 'Создать определение',
        cancel: 'Отмена',
        percent: 'Вероятность, %',
        mainTotal: 'Сумма основных вероятностей',
        remaining: 'Осталось до 100%',
        recommended: 'Это пул рекомендованных героев',
        recommendedHint: 'Если герои не заданы, пользователь выберет их позднее.',
        defaultCount: 'Количество по умолчанию',
        remove: 'Удалить вероятность',
        empty: 'Вероятности не настроены.',
        invalidPeriod: 'Укажите корректный период: окончание должно быть позже начала.',
        invalidConfiguration: 'Проверьте вероятности, рекомендованный пул и бонусные правила.',
        readyTotal: 'Для READY сумма основных вероятностей должна быть ровно 100%.',
        fallbackError: 'Не удалось сохранить календарную версию.',
        defaultVariant: 'Основной вариант',
        scheduledVariant: 'Календарная версия',
      }
    : {
        createTitle: 'New calendar version',
        editTitle: 'Edit calendar version',
        close: 'Close',
        source: 'Copy settings from',
        period: 'Period',
        startsAt: 'Starts at',
        endsAt: 'Ends at',
        status: 'Status',
        draft: 'Draft',
        ready: 'Ready',
        archived: 'Archived',
        save: 'Save',
        create: 'Create version',
        probabilities: 'Probabilities',
        probabilityHint: 'A calendar version keeps its own configuration snapshot.',
        addProbability: 'Add probability',
        duplicateProbability: 'Duplicate probability',
        definition: 'Probability name',
        selectDefinition: 'Select definition',
        newDefinition: 'Create new definition',
        definitionNameRequired: 'Enter the Russian and English definition names.',
        createDefinition: 'Create definition',
        cancel: 'Cancel',
        percent: 'Probability, %',
        mainTotal: 'Main probability total',
        remaining: 'Remaining to 100%',
        recommended: 'This is the featured hero pool',
        recommendedHint: 'If no heroes are assigned, the user will select them later.',
        defaultCount: 'Default hero count',
        remove: 'Remove probability',
        empty: 'No probabilities configured.',
        invalidPeriod: 'Enter a valid period: the end must be later than the start.',
        invalidConfiguration: 'Check probabilities, the featured pool, and bonus rules.',
        readyTotal: 'MAIN probabilities must total exactly 100% for READY status.',
        fallbackError: 'Failed to save the calendar version.',
        defaultVariant: 'Default variant',
        scheduledVariant: 'Calendar version',
      }, [locale]);

  const fiveStarRarityIds = useMemo(
    () => new Set(rarities.filter((rarity) => rarity.stars === 5).map((rarity) => rarity.id)),
    [rarities],
  );
  const mainTotalHundredths = useMemo(
    () => probabilities
      .filter((probability) => probability.kind === 'MAIN')
      .reduce((sum, probability) => sum + (percentageToHundredths(probability.valuePercent) ?? 0), 0),
    [probabilities],
  );
  const initialSourceVariantId = variants[0]?.id ?? '';

  const initializationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initializationKeyRef.current = null;
      return;
    }
    const initializationKey = variant?.id ?? `new:${summonId}`;
    if (initializationKeyRef.current === initializationKey) return;
    initializationKeyRef.current = initializationKey;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setStartsAt(toLocalInput(variant?.startsAt ?? now.toISOString()));
    setEndsAt(toLocalInput(variant?.endsAt ?? tomorrow.toISOString()));
    setStatus(variant?.status === 'HIDDEN' ? 'DRAFT' : variant?.status ?? 'DRAFT');
    setSourceVariantId(initialSourceVariantId);
    setProbabilities(variant ? probabilityForms(variant) : []);
    setBonusRules(variant ? bonusRuleForms(variant) : []);
    setDefinitionCreatorOpen(false);
    setDefinitionName({ ...EMPTY_LOCALIZED_TEXT });
    setDefinitionDescription({ ...EMPTY_LOCALIZED_TEXT });
    setError(null);
  }, [initialSourceVariantId, open, summonId, variant]);

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
          setHeroes(heroResponse);
          setFamilies(familyResponse);
          setRarities(rarityResponse);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : text.fallbackError);
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

  useEffect(() => {
    if (open && !variant && !sourceVariantId && initialSourceVariantId) {
      setSourceVariantId(initialSourceVariantId);
    }
  }, [initialSourceVariantId, open, sourceVariantId, variant]);

  const updateProbability = (key: string, changes: Partial<ProbabilityFormItem>) => {
    setProbabilities((current) => current.map((item) => item.key === key ? { ...item, ...changes } : item));
  };

  const duplicateProbability = (key: string) => {
    setProbabilities((current) => {
      const index = current.findIndex((item) => item.key === key);
      if (index < 0) return current;
      const source = current[index];
      const copy: ProbabilityFormItem = {
        ...source,
        key: crypto.randomUUID(),
        heroIds: [...source.heroIds],
      };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });
  };

  const createDefinition = async () => {
    if (!definitionName.ru.trim() || !definitionName.en.trim()) {
      setError(text.definitionNameRequired);
      return;
    }

    try {
      setCreatingDefinition(true);
      setError(null);
      const created = await apiPostJson<
        SummonProbabilityDefinitionCreateRequest,
        SummonProbabilityDefinition
      >(PROBABILITY_DEFINITIONS_API, {
        nameJson: {
          ru: definitionName.ru.trim(),
          en: definitionName.en.trim(),
        },
        descriptionJson: optionalLocalizedText(definitionDescription),
      });
      setDefinitions((current) => [...current, created].sort((left, right) =>
        localizedName(left.nameJson, locale).localeCompare(localizedName(right.nameJson, locale)),
      ));
      setDefinitionCreatorOpen(false);
      setDefinitionName({ ...EMPTY_LOCALIZED_TEXT });
      setDefinitionDescription({ ...EMPTY_LOCALIZED_TEXT });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : text.fallbackError);
    } finally {
      setCreatingDefinition(false);
    }
  };

  const toConditionRequest = (condition: BonusConditionForm): SummonBonusConditionRequest => ({
    type: condition.type,
    rarityId: condition.type === 'RARITY' ? Number(condition.rarityId) : null,
    probabilityDefinitionId: condition.type === 'PROBABILITY'
      ? condition.probabilityDefinitionId
      : null,
  });

  const validateConfiguration = () => {
    const definitionIds = new Set<string>();
    let recommendedPools = 0;
    for (const probability of probabilities) {
      const percent = percentageToHundredths(probability.valuePercent);
      if (!probability.definitionId || percent === null || percent < 0 || percent > 10_000) return false;
      if (definitionIds.has(probability.definitionId)) return false;
      definitionIds.add(probability.definitionId);
      if (probability.userSelectionEnabled) {
        recommendedPools += 1;
        const count = Number(probability.defaultSelectedHeroCount);
        const selectedHeroes = probability.heroIds
          .map((heroId) => heroes.find((hero) => hero.id === heroId))
          .filter((hero): hero is SummonHeroOption => Boolean(hero));
        if (
          probability.kind !== 'MAIN'
          || !Number.isInteger(count)
          || count < 1
          || count > 10
          || probability.heroIds.length > 10
          || selectedHeroes.some((hero) => !hero.rarityId || !fiveStarRarityIds.has(hero.rarityId))
        ) return false;
      }
    }
    if (recommendedPools > 1) return false;

    const conditionValid = (condition: BonusConditionForm) => {
      if (condition.type === 'RARITY') return Boolean(condition.rarityId);
      if (condition.type === 'PROBABILITY') {
        return Boolean(condition.probabilityDefinitionId) && definitionIds.has(condition.probabilityDefinitionId);
      }
      return true;
    };
    for (const rule of bonusRules) {
      if (!rule.definitionId || rule.steps.length === 0) return false;
      if (rule.kind === 'CONDITIONAL' && !conditionValid(rule.triggerCondition)) return false;
      if (rule.steps.length > 1 && !conditionValid(rule.continuationCondition)) return false;
      for (const step of rule.steps) {
        const chance = percentageToHundredths(step.activationChancePercent);
        if (chance === null || chance < 0 || chance > 10_000) return false;
        if (step.rewardMode === 'CUSTOM_DISTRIBUTION') {
          if (step.rewardProbabilities.length === 0) return false;
          const rewardDefinitionIds = new Set<string>();
          let rewardTotal = 0;
          for (const reward of step.rewardProbabilities) {
            const rewardPercent = percentageToHundredths(reward.valuePercent);
            if (
              !reward.probabilityDefinitionId
              || !definitionIds.has(reward.probabilityDefinitionId)
              || rewardDefinitionIds.has(reward.probabilityDefinitionId)
              || rewardPercent === null
              || rewardPercent <= 0
              || rewardPercent > 10_000
            ) return false;
            rewardDefinitionIds.add(reward.probabilityDefinitionId);
            rewardTotal += rewardPercent;
          }
          if (rewardTotal !== 10_000) return false;
        } else if (step.rewardProbabilities.length > 0) return false;
        if (step.rewardMode === 'SPECIFIC_HERO_POOL') {
          if (
            (step.userHeroSelectionEnabled && step.rewardHeroIds.length > 0)
            || (!step.userHeroSelectionEnabled && step.rewardHeroIds.length !== 1)
          ) return false;
          const rewardHeroes = step.rewardHeroIds
            .map((heroId) => heroes.find((hero) => hero.id === heroId))
            .filter((hero): hero is SummonHeroOption => Boolean(hero));
          if (
            rewardHeroes.length !== step.rewardHeroIds.length
            || rewardHeroes.some((hero) => !hero.rarityId || !fiveStarRarityIds.has(hero.rarityId))
          ) return false;
        } else if (step.userHeroSelectionEnabled || step.rewardHeroIds.length > 0) return false;
      }
    }
    return true;
  };

  const probabilityRequests = (): SummonProbabilityCreateRequest[] => probabilities.map((item, index) => ({
    definitionId: item.definitionId,
    kind: 'MAIN',
    valuePercent: Number(item.valuePercent),
    position: index + 1,
    heroIds: item.heroIds,
    heroVariantMode: item.heroVariantMode,
    userSelectionEnabled: item.userSelectionEnabled,
    defaultSelectedHeroCount: item.userSelectionEnabled ? Number(item.defaultSelectedHeroCount) : null,
  }));

  const bonusRequests = () => bonusRules.map((rule) => ({
    definitionId: rule.definitionId,
    kind: rule.kind,
    userSelectable: rule.userSelectable,
    triggerCondition: rule.kind === 'CONDITIONAL' ? toConditionRequest(rule.triggerCondition) : null,
    continuationCondition: rule.steps.length > 1 ? toConditionRequest(rule.continuationCondition) : null,
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
      userHeroSelectionEnabled: step.rewardMode === 'SPECIFIC_HERO_POOL'
        && step.userHeroSelectionEnabled,
      rewardHeroIds: step.rewardMode === 'SPECIFIC_HERO_POOL'
        ? step.rewardHeroIds
        : [],
    })),
  }));

  const handleSave = async () => {
    if (saveInFlightRef.current) return;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError(text.invalidPeriod);
      return;
    }
    if (variant && !validateConfiguration()) {
      setError(text.invalidConfiguration);
      return;
    }
    if (variant && status === 'READY' && mainTotalHundredths !== 10_000) {
      setError(text.readyTotal);
      return;
    }

    try {
      saveInFlightRef.current = true;
      setSaving(true);
      setError(null);
      const saved = variant
        ? await apiPutJson<SummonVariantUpdateRequest, SummonVariant>(
            `/api/v1/admin/summons/${summonId}/variants/${variant.id}`,
            {
              startsAt: toIso(startsAt),
              endsAt: toIso(endsAt),
              status,
              probabilities: probabilityRequests(),
              bonusRules: bonusRequests(),
            },
          )
        : await apiPostJson<SummonVariantCloneRequest, SummonVariant>(
            `/api/v1/admin/summons/${summonId}/variants/clone`,
            {
              sourceVariantId,
              startsAt: toIso(startsAt),
              endsAt: toIso(endsAt),
              status,
            },
          );
      await onSaved(saved);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof ApiError || saveError instanceof Error
        ? saveError.message
        : text.fallbackError);
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  return (
    <DictionaryModal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      closeOnBackdropClick={false}
      closeLabel={text.close}
      title={variant ? text.editTitle : text.createTitle}
      maxWidthClassName="md:max-w-6xl"
      headerActions={(
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loadingOptions || (!variant && !sourceVariantId)}
          className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-300 disabled:opacity-50"
        >
          {variant ? text.save : text.create}
        </button>
      )}
    >
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
          <h4 className="text-lg font-bold text-[var(--foreground)]">{text.period}</h4>
          {!variant ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.source}</span>
              <select
                value={sourceVariantId}
                onChange={(event) => setSourceVariantId(event.target.value)}
                disabled={saving}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]"
              >
                {variants.map((item, index) => (
                  <option key={item.id} value={item.id}>
                    {item.variantType === 'DEFAULT'
                      ? text.defaultVariant
                      : `${text.scheduledVariant} #${index}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[var(--foreground-soft)]">{text.startsAt}</span>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                disabled={saving}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[var(--foreground-soft)]">{text.endsAt}</span>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                disabled={saving}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[var(--foreground-soft)]">{text.status}</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as typeof status)}
                disabled={saving}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]"
              >
                <option value="DRAFT">{text.draft}</option>
                <option value="READY">{text.ready}</option>
                <option value="ARCHIVED">{text.archived}</option>
              </select>
            </label>
          </div>
        </section>

        {variant ? (
          <>
            {definitionCreatorOpen ? (
              <section className="space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                <h4 className="text-lg font-bold text-[var(--foreground)]">{text.newDefinition}</h4>
                <LocalizedTextFields
                  value={definitionName}
                  onChange={setDefinitionName}
                  disabled={creatingDefinition}
                />
                <LocalizedTextareaFields
                  value={definitionDescription}
                  onChange={setDefinitionDescription}
                  disabled={creatingDefinition}
                  rows={3}
                />
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
                    onClick={() => setDefinitionCreatorOpen(false)}
                    disabled={creatingDefinition}
                    className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-soft)]"
                  >
                    {text.cancel}
                  </button>
                </div>
              </section>
            ) : null}

            <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-bold text-[var(--foreground)]">{text.probabilities}</h4>
                  <p className="mt-1 text-sm text-[var(--foreground-soft)]">{text.probabilityHint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProbabilities((current) => [{
                    key: crypto.randomUUID(),
                    definitionId: '',
                    kind: 'MAIN',
                    valuePercent: '',
                    heroIds: [],
                    heroVariantMode: 'ORIGINAL',
                    userSelectionEnabled: false,
                    defaultSelectedHeroCount: '2',
                  }, ...current])}
                  disabled={saving || loadingOptions}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {text.addProbability}
                </button>
              </div>

              <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-[var(--foreground-soft)]">{text.mainTotal}</div>
                  <div className="mt-1 text-xl font-bold text-fuchsia-300">{formatHundredths(mainTotalHundredths)}%</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--foreground-soft)]">{text.remaining}</div>
                  <div className="mt-1 text-xl font-bold text-[var(--foreground)]">{formatHundredths(10_000 - mainTotalHundredths)}%</div>
                </div>
              </div>

              {probabilities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--foreground-soft)]">
                  {text.empty}
                </div>
              ) : (
                <div className="space-y-4">
                  {probabilities.map((probability, index) => (
                    <article key={probability.key} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex items-center justify-between">
                        <strong>#{index + 1}</strong>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateProbability(probability.key)}
                            disabled={saving}
                            aria-label={text.duplicateProbability}
                            title={text.duplicateProbability}
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-50"
                          >
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            {text.duplicateProbability}
                          </button>
                          <button
                            type="button"
                            onClick={() => setProbabilities((current) => current.filter((item) => item.key !== probability.key))}
                            disabled={saving}
                            aria-label={text.remove}
                            className="rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-red-300"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                        <label className="flex flex-col gap-2">
                          <span className="text-sm text-[var(--foreground-soft)]">{text.definition}</span>
                          <select
                            value={probability.definitionId}
                            onChange={(event) => updateProbability(probability.key, { definitionId: event.target.value })}
                            disabled={saving}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                          >
                            <option value="">{text.selectDefinition}</option>
                            {definitions.map((definition) => (
                              <option key={definition.id} value={definition.id}>
                                {localizedName(definition.nameJson, locale)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setDefinitionCreatorOpen(true)}
                            disabled={saving}
                            className="w-fit text-xs font-semibold text-cyan-300"
                          >
                            + {text.newDefinition}
                          </button>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-sm text-[var(--foreground-soft)]">{text.percent}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={probability.valuePercent}
                            onChange={(event) => updateProbability(probability.key, { valuePercent: event.target.value })}
                            disabled={saving}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                          />
                        </label>
                      </div>

                      <div className="space-y-3 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
                        <label className="flex items-start gap-3 text-sm text-[var(--foreground-soft)]">
                          <input
                            type="checkbox"
                            checked={probability.userSelectionEnabled}
                            onChange={(event) => {
                              const enabled = event.target.checked;
                              updateProbability(probability.key, {
                                userSelectionEnabled: enabled,
                                heroIds: enabled
                                  ? probability.heroIds.filter((heroId) => {
                                      const hero = heroes.find((item) => item.id === heroId);
                                      return Boolean(hero?.rarityId && fiveStarRarityIds.has(hero.rarityId));
                                    }).slice(0, 10)
                                  : probability.heroIds,
                              });
                            }}
                            disabled={saving}
                            className="mt-0.5 h-4 w-4"
                          />
                          <span>
                            <span className="block font-semibold text-[var(--foreground)]">{text.recommended}</span>
                            <span className="mt-1 block text-xs">{text.recommendedHint}</span>
                          </span>
                        </label>
                        {probability.userSelectionEnabled ? (
                          <label className="flex max-w-xs flex-col gap-2">
                            <span className="text-xs text-[var(--foreground-soft)]">{text.defaultCount}</span>
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
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]"
                            />
                          </label>
                        ) : null}
                      </div>

                      <SummonHeroVariantModeField
                        locale={locale}
                        value={probability.heroVariantMode}
                        onChange={(heroVariantMode) => updateProbability(probability.key, {
                          heroVariantMode,
                          heroIds: normalizeHeroIdsForMode(probability.heroIds, heroVariantMode, heroes),
                        })}
                        disabled={saving}
                      />

                      <SummonHeroPoolField
                        locale={locale}
                        heroes={resolveHeroOptionsForMode(heroes, probability.heroVariantMode)}
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
              probabilityDefinitionIds={probabilities.map((probability) => probability.definitionId).filter(Boolean)}
              heroes={heroes}
              families={families}
              rarities={rarities}
              rules={bonusRules}
              onChange={setBonusRules}
              onCreateDefinition={() => setDefinitionCreatorOpen(true)}
              disabled={saving || loadingOptions}
            />
          </>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>
        ) : null}

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--foreground-soft)]"
          >
            {text.close}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loadingOptions || (!variant && !sourceVariantId)}
            className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-300 disabled:opacity-50"
          >
            {variant ? text.save : text.create}
          </button>
        </div>
      </div>
    </DictionaryModal>
  );
}
