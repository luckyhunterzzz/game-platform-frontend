'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

function familyName(family: SummonFamilyOption, locale: 'ru' | 'en') {
  const primary = locale === 'ru' ? family.nameJson?.ru : family.nameJson?.en;
  const secondary = locale === 'ru' ? family.nameJson?.en : family.nameJson?.ru;
  return primary?.trim() || secondary?.trim() || `#${family.id}`;
}

export default function SummonHeroPoolField({
  locale,
  heroes,
  families,
  rarities,
  selectedIds,
  onChange,
  disabled = false,
  allowedRarityStars,
  maxSelected,
}: {
  locale: 'ru' | 'en';
  heroes: SummonHeroOption[];
  families: SummonFamilyOption[];
  rarities: SummonRarityOption[];
  selectedIds: number[];
  onChange: (heroIds: number[]) => void;
  disabled?: boolean;
  allowedRarityStars?: number;
  maxSelected?: number;
}) {
  const [search, setSearch] = useState('');
  const [familySearch, setFamilySearch] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [familyDropdownOpen, setFamilyDropdownOpen] = useState(false);
  const [rarityId, setRarityId] = useState('');
  const familyDropdownRef = useRef<HTMLDivElement>(null);
  const familySearchInputRef = useRef<HTMLInputElement>(null);
  const allowedRarityIds = useMemo(
    () => new Set(
      rarities
        .filter((rarity) => allowedRarityStars === undefined || rarity.stars === allowedRarityStars)
        .map((rarity) => rarity.id),
    ),
    [allowedRarityStars, rarities],
  );
  const eligibleHeroes = useMemo(
    () => heroes.filter(
      (hero) => allowedRarityStars === undefined || (hero.rarityId && allowedRarityIds.has(hero.rarityId)),
    ),
    [allowedRarityIds, allowedRarityStars, heroes],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedHeroes = useMemo(
    () => heroes.filter((hero) => selectedSet.has(hero.id)),
    [heroes, selectedSet],
  );
  const availableHeroes = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return [];

    return eligibleHeroes
      .filter((hero) => {
        if (selectedSet.has(hero.id)) return false;
        return `${heroName(hero, locale)} ${hero.slug}`.toLocaleLowerCase().includes(normalized);
      })
      .slice(0, 40);
  }, [eligibleHeroes, locale, search, selectedSet]);
  const bulkHeroes = useMemo(() => {
    if (!familyId && !rarityId) return [];
    return eligibleHeroes.filter(
      (hero) =>
        !selectedSet.has(hero.id) &&
        (!familyId || hero.familyId === Number(familyId)) &&
        (!rarityId || hero.rarityId === Number(rarityId)),
    );
  }, [eligibleHeroes, familyId, rarityId, selectedSet]);
  const selectedFamily = useMemo(
    () => families.find((family) => family.id === Number(familyId)) ?? null,
    [families, familyId],
  );
  const filteredFamilies = useMemo(() => {
    const normalized = familySearch.trim().toLocaleLowerCase();
    const sorted = [...families].sort((left, right) =>
      familyName(left, locale).localeCompare(familyName(right, locale), locale, { sensitivity: 'base' }),
    );
    if (!normalized) return sorted;
    return sorted.filter(
      (family) =>
        `${family.nameJson?.ru ?? ''} ${family.nameJson?.en ?? ''}`
          .toLocaleLowerCase()
          .includes(normalized),
    );
  }, [families, familySearch, locale]);

  useEffect(() => {
    if (!familyDropdownOpen) return;
    familySearchInputRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (!familyDropdownRef.current?.contains(event.target as Node)) {
        setFamilyDropdownOpen(false);
        setFamilySearch('');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFamilyDropdownOpen(false);
        setFamilySearch('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [familyDropdownOpen]);

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
          familiesNotFound: 'Семьи не найдены.',
          rarity: 'Редкость',
          allRarities: 'Все редкости',
          addFiltered: 'Добавить найденных',
          willAdd: 'Будет добавлено',
          fiveStarsOnly: 'Для рекомендованного пула доступны только герои 5★.',
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
          familiesNotFound: 'No families found.',
          rarity: 'Rarity',
          allRarities: 'All rarities',
          addFiltered: 'Add matching heroes',
          willAdd: 'Will add',
          fiveStarsOnly: 'Only 5★ heroes are available for the featured pool.',
        };

  const addHero = (heroId: number) => {
    if (maxSelected !== undefined && selectedIds.length >= maxSelected) return;
    onChange([...selectedIds, heroId]);
    setSearch('');
  };

  const removeHero = (heroId: number) => {
    onChange(selectedIds.filter((id) => id !== heroId));
  };

  const addFilteredHeroes = () => {
    if (bulkHeroes.length === 0) return;
    const availableSlots = maxSelected === undefined
      ? bulkHeroes.length
      : Math.max(maxSelected - selectedIds.length, 0);
    onChange([...selectedIds, ...bulkHeroes.slice(0, availableSlots).map((hero) => hero.id)]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">{text.label}</span>
        <span className="text-xs text-[var(--foreground-muted)]">
          {text.selected}: {selectedIds.length}
          {maxSelected !== undefined ? ` / ${maxSelected}` : ''}
        </span>
      </div>

      {allowedRarityStars === 5 ? (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
          {text.fiveStarsOnly}
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
        <div className="text-sm font-semibold text-[var(--foreground)]">{text.bulkTitle}</div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          <div ref={familyDropdownRef} className="relative flex min-w-0 flex-col gap-2">
            <span className="text-xs font-medium text-[var(--foreground-soft)]">{text.family}</span>
            <button
              type="button"
              onClick={() => setFamilyDropdownOpen((current) => !current)}
              disabled={disabled}
              aria-haspopup="listbox"
              aria-expanded={familyDropdownOpen}
              className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40 disabled:opacity-50"
            >
              <span className="truncate">
                {selectedFamily ? familyName(selectedFamily, locale) : text.allFamilies}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition ${familyDropdownOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {familyDropdownOpen ? (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-2xl shadow-black/30">
                <div className="border-b border-[var(--border)] p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--foreground-muted)]" aria-hidden="true" />
                    <input
                      ref={familySearchInputRef}
                      type="search"
                      value={familySearch}
                      onChange={(event) => setFamilySearch(event.target.value)}
                      placeholder={text.familySearch}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                    />
                  </div>
                </div>

                <div role="listbox" className="max-h-64 overflow-y-auto p-1.5">
                  {!familySearch.trim() ? (
                    <button
                      type="button"
                      role="option"
                      aria-selected={!familyId}
                      onClick={() => {
                        setFamilyId('');
                        setFamilyDropdownOpen(false);
                        setFamilySearch('');
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                    >
                      <span>{text.allFamilies}</span>
                      {!familyId ? <Check className="h-4 w-4 text-cyan-300" aria-hidden="true" /> : null}
                    </button>
                  ) : null}

                  {filteredFamilies.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[var(--foreground-soft)]">
                      {text.familiesNotFound}
                    </div>
                  ) : (
                    filteredFamilies.map((family) => {
                      const selected = family.id === Number(familyId);
                      return (
                        <button
                          key={family.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setFamilyId(String(family.id));
                            setFamilyDropdownOpen(false);
                            setFamilySearch('');
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                        >
                          <span className="truncate">{familyName(family, locale)}</span>
                          {selected ? <Check className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" /> : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <label className="flex min-w-0 flex-col gap-2">
            <span className="text-xs font-medium text-[var(--foreground-soft)]">{text.rarity}</span>
            <select
              value={rarityId}
              onChange={(event) => setRarityId(event.target.value)}
              disabled={disabled}
              className="w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
            >
              <option value="">{text.allRarities}</option>
              {rarities
                .filter((rarity) => allowedRarityStars === undefined || rarity.stars === allowedRarityStars)
                .map((rarity) => (
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
            disabled={
              disabled
              || (!familyId && !rarityId)
              || bulkHeroes.length === 0
              || (maxSelected !== undefined && selectedIds.length >= maxSelected)
            }
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
