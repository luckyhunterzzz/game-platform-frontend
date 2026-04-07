'use client';

import { useEffect, useMemo, useState } from 'react';
import { ApiError, useApi } from '@/lib/use-api';

type HeroLocale = 'RU' | 'EN';
type EvolutionStageCode = 'ASCENSION_4_80' | 'ASCENSION_4_85' | 'ASCENSION_4_90';
type EmblemPathType = 'DAMAGE' | 'DEFENSE';

type HeroVariantSummary = {
  id: number;
  slug: string;
  name: string;
  costumeIndex?: number | null;
};

type HeroVariantsResponse = {
  currentHero: {
    id: number;
    slug: string;
    name: string;
    baseHeroId?: number | null;
  };
  baseHero: HeroVariantSummary;
  costumes: HeroVariantSummary[];
};

type HeroStatBlockResponse = {
  attack: number;
  armor: number;
  hp: number;
};

type HeroStatCalculationResponse = {
  stageCode: EvolutionStageCode;
  costumeHeroId?: number | null;
  costumeIndex?: number | null;
  emblemPathType?: EmblemPathType | null;
  includeMasterEmblems: boolean;
  finalStats: HeroStatBlockResponse;
};

type HeroStatCalculatorPanelProps = {
  locale: HeroLocale;
  heroId: number;
  heroSlug: string;
  isCostume: boolean;
  baseAttack?: number | null;
  baseArmor?: number | null;
  baseHp?: number | null;
  costumes?: HeroVariantSummary[];
};

const STAGES: EvolutionStageCode[] = ['ASCENSION_4_80', 'ASCENSION_4_85', 'ASCENSION_4_90'];
const CALCULATE_STATS_LABEL = 'stats/calculate';

function statDeltaLabel(finalValue: number, baseValue: number | null | undefined) {
  if (baseValue == null) return null;
  const delta = finalValue - baseValue;
  if (delta <= 0) return null;
  return `(+${delta})`;
}

function sortCostumes(costumes: HeroVariantSummary[]) {
  return [...costumes].sort((a, b) => {
    const aIndex = a.costumeIndex ?? Number.MAX_SAFE_INTEGER;
    const bIndex = b.costumeIndex ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name);
  });
}

export default function HeroStatCalculatorPanel({
  locale,
  heroId,
  heroSlug,
  isCostume,
  baseAttack,
  baseArmor,
  baseHp,
  costumes = [],
}: HeroStatCalculatorPanelProps) {
  const { apiJson, apiPostJson } = useApi();
  const [stageCode, setStageCode] = useState<EvolutionStageCode>('ASCENSION_4_80');
  const [emblemPathType, setEmblemPathType] = useState<EmblemPathType | null>(null);
  const [includeMasterEmblems, setIncludeMasterEmblems] = useState(false);
  const [selectedCostumeHeroId, setSelectedCostumeHeroId] = useState<number | null>(null);
  const [costumeOptions, setCostumeOptions] = useState<HeroVariantSummary[]>(sortCostumes(costumes));
  const [loadingCostumes, setLoadingCostumes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HeroStatCalculationResponse | null>(null);

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            title: 'Вычисляемые значения',
            subtitle: 'Выберите конфигурацию героя и получите итоговые статы.',
            stage: 'Стадия',
            costume: 'Костюм',
            noCostume: 'Без костюма',
            emblems: 'Эмблемы',
            noEmblems: 'Без эмблем',
            damage: 'В урон',
            defense: 'В защиту',
            masterEmblems: 'Мастер эмблемы',
            loading: 'Считаем статы...',
            loadingCostumes: 'Загружаем костюмы...',
            unavailable: 'Для расчета нужны базовые статы героя.',
            attack: 'Атака',
            armor: 'Броня',
            hp: 'HP',
            stageLabel: (stage: EvolutionStageCode) =>
              stage === 'ASCENSION_4_80' ? '4.80' : stage === 'ASCENSION_4_85' ? '4.85' : '4.90',
          }
        : {
            title: 'Calculated stats',
            subtitle: 'Choose hero setup and get final stats.',
            stage: 'Stage',
            costume: 'Costume',
            noCostume: 'No costume',
            emblems: 'Emblems',
            noEmblems: 'No emblems',
            damage: 'Damage',
            defense: 'Defense',
            masterEmblems: 'Master emblems',
            loading: 'Calculating stats...',
            loadingCostumes: 'Loading costumes...',
            unavailable: 'Base hero stats are required for calculation.',
            attack: 'Attack',
            armor: 'Armor',
            hp: 'HP',
            stageLabel: (stage: EvolutionStageCode) =>
              stage === 'ASCENSION_4_80' ? '4.80' : stage === 'ASCENSION_4_85' ? '4.85' : '4.90',
          },
    [locale],
  );

  useEffect(() => {
    setCostumeOptions(sortCostumes(costumes));
  }, [costumes]);

  useEffect(() => {
    if (isCostume || costumes.length > 0 || !heroSlug) {
      return;
    }

    let cancelled = false;

    const loadCostumes = async () => {
      setLoadingCostumes(true);
      try {
        const response = await apiJson<HeroVariantsResponse>(`/api/v1/public/heroes/${heroSlug}/variants?language=${locale}`);
        if (!cancelled) {
          setCostumeOptions(sortCostumes(response.costumes));
        }
      } catch {
        if (!cancelled) {
          setCostumeOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCostumes(false);
        }
      }
    };

    void loadCostumes();

    return () => {
      cancelled = true;
    };
  }, [apiJson, costumes.length, heroSlug, isCostume, locale]);

  useEffect(() => {
    if (!emblemPathType) {
      setIncludeMasterEmblems(false);
    }
  }, [emblemPathType]);

  useEffect(() => {
    if (baseAttack == null || baseArmor == null || baseHp == null) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const calculate = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiPostJson<
          {
            stageCode: EvolutionStageCode;
            costumeHeroId?: number | null;
            emblemPathType?: EmblemPathType | null;
            includeMasterEmblems: boolean;
          },
          HeroStatCalculationResponse
        >(`/api/v1/admin/heroes/${heroId}/${CALCULATE_STATS_LABEL}`, {
          stageCode,
          costumeHeroId: selectedCostumeHeroId,
          emblemPathType,
          includeMasterEmblems,
        });

        if (!cancelled) {
          setResult(response);
        }
      } catch (nextError) {
        if (!cancelled) {
          setResult(null);
          setError(
            nextError instanceof ApiError || nextError instanceof Error
              ? nextError.message
              : 'Failed to calculate stats',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void calculate();

    return () => {
      cancelled = true;
    };
  }, [apiPostJson, baseArmor, baseAttack, baseHp, emblemPathType, heroId, includeMasterEmblems, selectedCostumeHeroId, stageCode]);

  if (baseAttack == null || baseArmor == null || baseHp == null) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--foreground-soft)]">
        {t.unavailable}
      </div>
    );
  }

  const finalStats = result?.finalStats ?? {
    attack: baseAttack,
    armor: baseArmor,
    hp: baseHp,
  };

  const statCards = [
    { key: 'attack', icon: '⚔️', label: t.attack, value: finalStats.attack, base: baseAttack },
    { key: 'armor', icon: '🛡️', label: t.armor, value: finalStats.armor, base: baseArmor },
    { key: 'hp', icon: '❤️', label: t.hp, value: finalStats.hp, base: baseHp },
  ] as const;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold text-[var(--foreground)]">{t.title}</div>
        <div className="mt-1 text-sm text-[var(--foreground-soft)]">{t.subtitle}</div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{t.stage}</div>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setStageCode(stage)}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  stageCode === stage
                    ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-200'
                    : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {t.stageLabel(stage)}
              </button>
            ))}
          </div>
        </div>

        {!isCostume ? (
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              {t.costume}
            </span>
            <select
              value={selectedCostumeHeroId ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSelectedCostumeHeroId(nextValue ? Number(nextValue) : null);
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
            >
              <option value="">{t.noCostume}</option>
              {costumeOptions.map((costume) => (
                <option key={costume.id} value={costume.id}>
                  {costume.costumeIndex ? `#${costume.costumeIndex} ` : ''}
                  {costume.name}
                </option>
              ))}
            </select>
            {loadingCostumes ? (
              <span className="text-xs text-[var(--foreground-muted)]">{t.loadingCostumes}</span>
            ) : null}
          </label>
        ) : null}

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">{t.emblems}</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEmblemPathType(null)}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                emblemPathType === null
                  ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-200'
                  : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {t.noEmblems}
            </button>
            <button
              type="button"
              onClick={() => setEmblemPathType('DAMAGE')}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                emblemPathType === 'DAMAGE'
                  ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-200'
                  : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {t.damage}
            </button>
            <button
              type="button"
              onClick={() => setEmblemPathType('DEFENSE')}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                emblemPathType === 'DEFENSE'
                  ? 'border-cyan-400/40 bg-cyan-400/12 text-cyan-200'
                  : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {t.defense}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={includeMasterEmblems}
            onChange={(event) => setIncludeMasterEmblems(event.target.checked)}
            disabled={!emblemPathType}
            className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
          />
          <span>{t.masterEmblems}</span>
        </label>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground-soft)]">
            {t.loading}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {statCards.map((stat) => {
            const deltaLabel = statDeltaLabel(stat.value, stat.base);
            return (
              <div key={stat.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                  <span>{stat.icon}</span>
                  <span>{stat.label}</span>
                </div>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  {stat.value}
                  {deltaLabel ? <span className="ml-2 text-sm font-medium text-emerald-300">{deltaLabel}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
