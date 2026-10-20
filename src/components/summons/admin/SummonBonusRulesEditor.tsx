'use client';

import { Plus, Trash2 } from 'lucide-react';

import type {
  BonusResultConditionType,
  BonusRewardMode,
  SummonBonusKind,
  SummonProbabilityDefinition,
  SummonRarityOption,
} from '@/lib/types/summon';

export type BonusConditionForm = {
  type: BonusResultConditionType;
  rarityId: string;
  probabilityDefinitionId: string;
};

export type BonusStepForm = {
  key: string;
  activationChancePercent: string;
  rewardMode: BonusRewardMode;
  rewardProbabilityDefinitionId: string;
};

export type BonusRuleForm = {
  key: string;
  definitionId: string;
  kind: SummonBonusKind;
  userSelectable: boolean;
  triggerCondition: BonusConditionForm;
  continuationCondition: BonusConditionForm;
  steps: BonusStepForm[];
};

export function emptyBonusCondition(): BonusConditionForm {
  return { type: 'ANY_RESULT', rarityId: '', probabilityDefinitionId: '' };
}

export function emptyBonusStep(): BonusStepForm {
  return {
    key: crypto.randomUUID(),
    activationChancePercent: '',
    rewardMode: 'MAIN_ROLL',
    rewardProbabilityDefinitionId: '',
  };
}

export function emptyBonusRule(): BonusRuleForm {
  return {
    key: crypto.randomUUID(),
    definitionId: '',
    kind: 'CONDITIONAL',
    userSelectable: false,
    triggerCondition: emptyBonusCondition(),
    continuationCondition: emptyBonusCondition(),
    steps: [emptyBonusStep()],
  };
}

function localizedName(
  value: { ru?: string | null; en?: string | null } | null | undefined,
  locale: 'ru' | 'en',
) {
  const primary = locale === 'ru' ? value?.ru : value?.en;
  const secondary = locale === 'ru' ? value?.en : value?.ru;
  return primary?.trim() || secondary?.trim() || '—';
}

function ConditionEditor({
  value,
  onChange,
  locale,
  rarities,
  probabilityDefinitions,
  disabled,
}: {
  value: BonusConditionForm;
  onChange: (value: BonusConditionForm) => void;
  locale: 'ru' | 'en';
  rarities: SummonRarityOption[];
  probabilityDefinitions: SummonProbabilityDefinition[];
  disabled: boolean;
}) {
  const text = locale === 'ru'
    ? {
        type: 'Что должно выпасть',
        any: 'Любой герой',
        rarity: 'Герой указанной редкости',
        probability: 'Герой из указанного пула',
        selectRarity: 'Выберите редкость',
        selectProbability: 'Выберите вероятность',
      }
    : {
        type: 'Required result',
        any: 'Any hero',
        rarity: 'Hero of selected rarity',
        probability: 'Hero from selected pool',
        selectRarity: 'Select rarity',
        selectProbability: 'Select probability',
      };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-2">
        <span className="text-xs font-medium text-[var(--foreground-soft)]">{text.type}</span>
        <select
          value={value.type}
          onChange={(event) =>
            onChange({
              type: event.target.value as BonusResultConditionType,
              rarityId: '',
              probabilityDefinitionId: '',
            })
          }
          disabled={disabled}
          className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="ANY_RESULT">{text.any}</option>
          <option value="RARITY">{text.rarity}</option>
          <option value="PROBABILITY">{text.probability}</option>
        </select>
      </label>

      {value.type === 'RARITY' ? (
        <label className="flex min-w-0 flex-col gap-2">
          <span className="text-xs font-medium text-[var(--foreground-soft)]">{text.rarity}</span>
          <select
            value={value.rarityId}
            onChange={(event) => onChange({ ...value, rarityId: event.target.value })}
            disabled={disabled}
            className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
          >
            <option value="">{text.selectRarity}</option>
            {rarities.map((rarity) => (
              <option key={rarity.id} value={rarity.id}>
                {rarity.stars}★ · {localizedName(rarity.nameJson, locale)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {value.type === 'PROBABILITY' ? (
        <label className="flex min-w-0 flex-col gap-2">
          <span className="text-xs font-medium text-[var(--foreground-soft)]">{text.probability}</span>
          <select
            value={value.probabilityDefinitionId}
            onChange={(event) => onChange({ ...value, probabilityDefinitionId: event.target.value })}
            disabled={disabled}
            className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
          >
            <option value="">{text.selectProbability}</option>
            {probabilityDefinitions.map((definition) => (
              <option key={definition.id} value={definition.id}>
                {localizedName(definition.nameJson, locale)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

export default function SummonBonusRulesEditor({
  locale,
  definitions,
  probabilityDefinitionIds,
  rarities,
  rules,
  onChange,
  onCreateDefinition,
  disabled = false,
}: {
  locale: 'ru' | 'en';
  definitions: SummonProbabilityDefinition[];
  probabilityDefinitionIds: string[];
  rarities: SummonRarityOption[];
  rules: BonusRuleForm[];
  onChange: (rules: BonusRuleForm[]) => void;
  onCreateDefinition: (ruleKey: string) => void;
  disabled?: boolean;
}) {
  const text = locale === 'ru'
    ? {
        title: 'Бонусные правила',
        hint: 'Настройте условие запуска, шанс каждого дополнительного героя и продолжение цепочки.',
        addRule: 'Добавить бонусное правило',
        empty: 'Бонусные правила не добавлены.',
        definition: 'Название бонуса',
        selectDefinition: 'Выберите определение',
        newDefinition: 'Создать новое определение',
        kind: 'Тип бонуса',
        conditional: 'Условный',
        independent: 'Независимый',
        trigger: 'Условие запуска бонуса',
        continuation: 'Условие продолжения цепочки',
        selectable: 'Пользователь может включать и выключать этот бонус',
        steps: 'Дополнительные попытки',
        addStep: 'Добавить попытку',
        chance: 'Шанс срабатывания, %',
        rewardMode: 'Какие вероятности использовать',
        mainRoll: 'Обычные вероятности призыва',
        specific: 'Конкретный пул вероятности',
        selectProbability: 'Выберите вероятность',
        removeRule: 'Удалить бонусное правило',
        removeStep: 'Удалить попытку',
      }
    : {
        title: 'Bonus rules',
        hint: 'Configure the trigger, each extra hero chance, and chain continuation.',
        addRule: 'Add bonus rule',
        empty: 'No bonus rules added.',
        definition: 'Bonus name',
        selectDefinition: 'Select a definition',
        newDefinition: 'Create new definition',
        kind: 'Bonus type',
        conditional: 'Conditional',
        independent: 'Independent',
        trigger: 'Bonus trigger condition',
        continuation: 'Chain continuation condition',
        selectable: 'User can enable or disable this bonus',
        steps: 'Extra attempts',
        addStep: 'Add attempt',
        chance: 'Activation chance, %',
        rewardMode: 'Probability source',
        mainRoll: 'Main summon distribution',
        specific: 'Specific probability pool',
        selectProbability: 'Select probability',
        removeRule: 'Remove bonus rule',
        removeStep: 'Remove attempt',
      };

  const configuredDefinitions = probabilityDefinitionIds
    .map((id) => definitions.find((definition) => definition.id === id))
    .filter((definition): definition is SummonProbabilityDefinition => Boolean(definition));

  const updateRule = (key: string, changes: Partial<BonusRuleForm>) => {
    onChange(rules.map((rule) => (rule.key === key ? { ...rule, ...changes } : rule)));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-[var(--foreground)]">{text.title}</h4>
          <p className="mt-1 text-sm text-[var(--foreground-soft)]">{text.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...rules, emptyBonusRule()])}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-400/15 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {text.addRule}
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--foreground-soft)]">
          {text.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, ruleIndex) => (
            <article key={rule.key} className="min-w-0 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-[var(--foreground)]">#{ruleIndex + 1}</div>
                <button
                  type="button"
                  onClick={() => onChange(rules.filter((item) => item.key !== rule.key))}
                  disabled={disabled}
                  aria-label={text.removeRule}
                  className="rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-red-300 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-2">
                  <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.definition}</span>
                  <select
                    value={rule.definitionId}
                    onChange={(event) => updateRule(rule.key, { definitionId: event.target.value })}
                    disabled={disabled}
                    className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
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
                    onClick={() => onCreateDefinition(rule.key)}
                    disabled={disabled}
                    className="w-fit text-xs font-semibold text-cyan-300"
                  >
                    + {text.newDefinition}
                  </button>
                </label>

                <label className="flex min-w-0 flex-col gap-2">
                  <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.kind}</span>
                  <select
                    value={rule.kind}
                    onChange={(event) => updateRule(rule.key, { kind: event.target.value as SummonBonusKind })}
                    disabled={disabled}
                    className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  >
                    <option value="CONDITIONAL">{text.conditional}</option>
                    <option value="INDEPENDENT">{text.independent}</option>
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 text-sm text-[var(--foreground-soft)]">
                <input
                  type="checkbox"
                  checked={rule.userSelectable}
                  onChange={(event) => updateRule(rule.key, { userSelectable: event.target.checked })}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                {text.selectable}
              </label>

              {rule.kind === 'CONDITIONAL' ? (
                <div className="space-y-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <div className="text-sm font-semibold text-amber-200">{text.trigger}</div>
                  <ConditionEditor
                    value={rule.triggerCondition}
                    onChange={(triggerCondition) => updateRule(rule.key, { triggerCondition })}
                    locale={locale}
                    rarities={rarities}
                    probabilityDefinitions={configuredDefinitions}
                    disabled={disabled}
                  />
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--foreground)]">{text.steps}</div>
                  <button
                    type="button"
                    onClick={() => updateRule(rule.key, { steps: [...rule.steps, emptyBonusStep()] })}
                    disabled={disabled}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {text.addStep}
                  </button>
                </div>

                {rule.steps.map((step, stepIndex) => (
                  <div key={step.key} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 lg:grid-cols-[80px_180px_minmax(0,1fr)_auto]">
                    <div className="self-center text-sm font-bold text-[var(--foreground)]">#{stepIndex + 1}</div>
                    <label className="flex min-w-0 flex-col gap-2">
                      <span className="text-xs text-[var(--foreground-soft)]">{text.chance}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={step.activationChancePercent}
                        onChange={(event) =>
                          updateRule(rule.key, {
                            steps: rule.steps.map((item) =>
                              item.key === step.key ? { ...item, activationChancePercent: event.target.value } : item,
                            ),
                          })
                        }
                        disabled={disabled}
                        className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-2">
                      <span className="text-xs text-[var(--foreground-soft)]">{text.rewardMode}</span>
                      <select
                        value={step.rewardMode}
                        onChange={(event) =>
                          updateRule(rule.key, {
                            steps: rule.steps.map((item) =>
                              item.key === step.key
                                ? {
                                    ...item,
                                    rewardMode: event.target.value as BonusRewardMode,
                                    rewardProbabilityDefinitionId: '',
                                  }
                                : item,
                            ),
                          })
                        }
                        disabled={disabled}
                        className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
                      >
                        <option value="MAIN_ROLL">{text.mainRoll}</option>
                        <option value="SPECIFIC_PROBABILITY">{text.specific}</option>
                      </select>
                      {step.rewardMode === 'SPECIFIC_PROBABILITY' ? (
                        <select
                          value={step.rewardProbabilityDefinitionId}
                          onChange={(event) =>
                            updateRule(rule.key, {
                              steps: rule.steps.map((item) =>
                                item.key === step.key
                                  ? { ...item, rewardProbabilityDefinitionId: event.target.value }
                                  : item,
                              ),
                            })
                          }
                          disabled={disabled}
                          className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
                        >
                          <option value="">{text.selectProbability}</option>
                          {configuredDefinitions.map((definition) => (
                            <option key={definition.id} value={definition.id}>
                              {localizedName(definition.nameJson, locale)}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </label>
                    <button
                      type="button"
                      onClick={() => updateRule(rule.key, { steps: rule.steps.filter((item) => item.key !== step.key) })}
                      disabled={disabled || rule.steps.length === 1}
                      aria-label={text.removeStep}
                      className="self-center rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-red-300 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>

              {rule.steps.length > 1 ? (
                <div className="space-y-2 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
                  <div className="text-sm font-semibold text-violet-200">{text.continuation}</div>
                  <ConditionEditor
                    value={rule.continuationCondition}
                    onChange={(continuationCondition) => updateRule(rule.key, { continuationCondition })}
                    locale={locale}
                    rarities={rarities}
                    probabilityDefinitions={configuredDefinitions}
                    disabled={disabled}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
