'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type {
  SummonFamilyOption,
  SummonHeroOption,
  SummonRarityOption,
} from '@/lib/types/summon';

function heroName(hero: SummonHeroOption, locale: 'ru' | 'en') {
  const primary = locale === 'ru' ? hero.nameJson?.ru : hero.nameJson?.en;
  const secondary = locale === 'ru' ? hero.nameJson?.en : hero.nameJson?.ru;
  return primary?.trim() || secondary?.trim() || hero.slug;
}

export default function SummonHeroPoolField({
  locale,
  heroes,
  families,
  rarities,
  selectedIds,
  onChange,
  disabled = false,
}: {
  locale: 'ru' | 'en';
  heroes: SummonHeroOption[];
  families: SummonFamilyOption[];
  rarities: SummonRarityOption[];
  selectedIds: number[];
  onChange: (heroIds: number[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [familySearch, setFamilySearch] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [rarityId, setRarityId] = useState('');
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedHeroes = useMemo(
    () => heroes.filter((hero) => selectedSet.has(hero.id)),
    [heroes, selectedSet],
  );
  const availableHeroes = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return [];

    return heroes
      .filter((hero) => {
        if (selectedSet.has(hero.id)) return false;
        return `${heroName(hero, locale)} ${hero.slug}`.toLocaleLowerCase().includes(normalized);
      })
      .slice(0, 40);
  }, [heroes, locale, search, selectedSet]);
  const bulkHeroes = useMemo(() => {
    if (!familyId && !rarityId) return [];
    return heroes.filter(
      (hero) =>
        !selectedSet.has(hero.id) &&
        (!familyId || hero.familyId === Number(familyId)) &&
        (!rarityId || hero.rarityId === Number(rarityId)),
    );
  }, [familyId, heroes, rarityId, selectedSet]);
  const filteredFamilies = useMemo(() => {
    const normalized = familySearch.trim().toLocaleLowerCase();
    if (!normalized) return families;
    return families.filter(
      (family) =>
        family.id === Number(familyId) ||
        `${family.nameJson?.ru ?? ''} ${family.nameJson?.en ?? ''}`
          .toLocaleLowerCase()
          .includes(normalized),
    );
  }, [families, familyId, familySearch]);

  const text =
    locale === 'ru'
      ? {
          label: 'Герои в этой вероятности',
          selected: 'Выбрано',
          search: 'Найти героя по имени или slug',
          empty: 'Начните вводить имя героя.',
          notFound: 'Герои не найдены.',
          remove: 'Убрать героя',
          bulkTitle: 'Добавить группу героев',
          family: 'Семья',
          familySearch: 'Найти семью по названию',
          allFamilies: 'Все семьи',
          rarity: 'Редкость',
          allRarities: 'Все редкости',
          addFiltered: 'Добавить найденных',
          willAdd: 'Будет добавлено',
        }
      : {
          label: 'Heroes in this probability',
          selected: 'Selected',
          search: 'Find a hero by name or slug',
          empty: 'Start typing a hero name.',
          notFound: 'No heroes found.',
          remove: 'Remove hero',
          bulkTitle: 'Add a group of heroes',
          family: 'Family',
          familySearch: 'Find family by name',
          allFamilies: 'All families',
          rarity: 'Rarity',
          allRarities: 'All rarities',
          addFiltered: 'Add matching heroes',
          willAdd: 'Will add',
        };

  const addHero = (heroId: number) => {
    onChange([...selectedIds, heroId]);
    setSearch('');
  };

  const removeHero = (heroId: number) => {
    onChange(selectedIds.filter((id) => id !== heroId));
  };

  const addFilteredHeroes = () => {
    if (bulkHeroes.length === 0) return;
    onChange([...selectedIds, ...bulkHeroes.map((hero) => hero.id)]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.label}</span>
        <span className="text-xs text-[var(--foreground-muted)]">
          {text.selected}: {selectedIds.length}
        </span>
      </div>

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
        <div className="text-sm font-semibold text-[var(--foreground)]">{text.bulkTitle}</div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-medium text-[var(--foreground-soft)]">{text.family}</span>
            <input
              type="search"
              value={familySearch}
              onChange={(event) => setFamilySearch(event.target.value)}
              disabled={disabled}
              placeholder={text.familySearch}
              className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
            />
            <select
              value={familyId}
              onChange={(event) => setFamilyId(event.target.value)}
              disabled={disabled}
              className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
            >
              <option value="">{text.allFamilies}</option>
              {filteredFamilies.map((family) => (
                <option key={family.id} value={family.id}>
                  {heroName({ id: family.id, slug: '', nameJson: family.nameJson, status: 'READY' }, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-medium text-[var(--foreground-soft)]">{text.rarity}</span>
            <select
              value={rarityId}
              onChange={(event) => setRarityId(event.target.value)}
              disabled={disabled}
              className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
            >
              <option value="">{text.allRarities}</option>
              {rarities.map((rarity) => (
                <option key={rarity.id} value={rarity.id}>
                  {rarity.stars}★ · {heroName({ id: rarity.id, slug: '', nameJson: rarity.nameJson, status: 'READY' }, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[var(--foreground-muted)]">
            {text.willAdd}: {bulkHeroes.length}
          </span>
          <button
            type="button"
            onClick={addFilteredHeroes}
            disabled={disabled || (!familyId && !rarityId) || bulkHeroes.length === 0}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {text.addFiltered}
          </button>
        </div>
      </div>

      {selectedHeroes.length > 0 ? (
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          {selectedHeroes.map((hero) => (
            <span
              key={hero.id}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
            >
              <span className="truncate">{hero.slug}</span>
              <button
                type="button"
                onClick={() => removeHero(hero.id)}
                disabled={disabled}
                aria-label={`${text.remove}: ${heroName(hero, locale)}`}
                className="rounded-full p-0.5 transition hover:bg-white/10 disabled:opacity-50"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[var(--foreground-muted)]" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={disabled}
          placeholder={text.search}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
        />
      </div>

      <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
        {!search.trim() ? (
          <div className="px-3 py-2 text-xs text-[var(--foreground-soft)]">{text.empty}</div>
        ) : availableHeroes.length === 0 ? (
          <div className="px-3 py-2 text-xs text-[var(--foreground-soft)]">{text.notFound}</div>
        ) : (
          <div className="space-y-1">
            {availableHeroes.map((hero) => (
              <button
                key={hero.id}
                type="button"
                onClick={() => addHero(hero.id)}
                disabled={disabled}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-[var(--foreground)]">{heroName(hero, locale)}</span>
                  <span className="block truncate text-xs text-[var(--foreground-soft)]">{hero.slug}</span>
                </span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                  {hero.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
