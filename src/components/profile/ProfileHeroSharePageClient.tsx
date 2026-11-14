'use client';

import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, RotateCcw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantsItem,
} from '@/components/heroes/admin/PublicHeroDetailsModal';
import {
  buildPowerGradeOptions,
  calculateProfileHeroPower,
  HERO_CLASS_ICON_BY_KEY,
  HERO_ELEMENT_ICON_BY_KEY,
  IconFilterSelect,
  OverviewHeroTile,
  resolveElementKey,
  resolveHeroClassKey,
  resolveHeroClassKeyFromImageUrl,
  sortRosterCardList,
  type HeroCatalogFiltersResponse,
  type HeroLocale,
  type HeroRosterSortField,
  type HeroRosterSortOrder,
  type IconFilterOption,
  type PublicHeroCatalogItem,
  type RosterHeroCard,
} from '@/components/profile/ProfilePageClient';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { PlayerProfileHeroShareResponse } from '@/lib/types/player-profile';
import { ApiError, useApi } from '@/lib/use-api';

type ShareSortField = 'snapshot' | Exclude<HeroRosterSortField, 'createdAt'>;

const PAGE_SIZE = 48;

export default function ProfileHeroSharePageClient({ token }: { token: string }) {
  const router = useRouter();
  const { locale } = useI18n();
  const { apiJson, apiPostJson } = useApi();
  const heroLocale: HeroLocale = locale === 'ru' ? 'RU' : 'EN';

  const [share, setShare] = useState<PlayerProfileHeroShareResponse | null>(null);
  const [catalogById, setCatalogById] = useState<Map<number, PublicHeroCatalogItem>>(new Map());
  const [filterCatalog, setFilterCatalog] = useState<HeroCatalogFiltersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadState, setLoadState] = useState<'ready' | 'expired' | 'missing' | 'error'>('ready');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<ShareSortField>('snapshot');
  const [sortOrder, setSortOrder] = useState<HeroRosterSortOrder>('asc');
  const [rarities, setRarities] = useState<string[]>([]);
  const [powerGrades, setPowerGrades] = useState<string[]>([]);
  const [elements, setElements] = useState<string[]>([]);
  const [heroClasses, setHeroClasses] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [selectedHeroSlug, setSelectedHeroSlug] = useState<string | null>(null);
  const [selectedHeroCard, setSelectedHeroCard] = useState<PublicHeroCardItem | null>(null);
  const [selectedHeroDetails, setSelectedHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedHeroVariants, setSelectedHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [selectedHeroLoading, setSelectedHeroLoading] = useState(false);
  const [selectedHeroError, setSelectedHeroError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadShare = async () => {
      setLoading(true);
      try {
        const response = await apiJson<PlayerProfileHeroShareResponse>(
          `/api/v1/public/profile-hero-shares/${encodeURIComponent(token)}`,
        );
        if (!cancelled) {
          setShare(response);
          setLoadState('ready');
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 410) {
            setLoadState('expired');
          } else if (error instanceof ApiError && error.status === 404) {
            setLoadState('missing');
          } else {
            setLoadState('error');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadShare();
    return () => {
      cancelled = true;
    };
  }, [apiJson, token]);

  const heroIds = useMemo(
    () => Array.from(new Set((share?.heroes ?? []).map((hero) => hero.heroId))),
    [share],
  );

  useEffect(() => {
    if (heroIds.length === 0) {
      return;
    }

    let cancelled = false;
    const loadCatalog = async () => {
      try {
        const [heroes, filters] = await Promise.all([
          apiPostJson<{ heroIds: number[] }, PublicHeroCatalogItem[]>(
            `/api/v1/public/heroes/batch?language=${heroLocale}&includeDrafts=true`,
            { heroIds },
          ),
          apiJson<HeroCatalogFiltersResponse>(`/api/v1/public/heroes/filters?language=${heroLocale}`),
        ]);
        if (!cancelled) {
          setCatalogById(new Map(heroes.map((hero) => [hero.id, hero])));
          setFilterCatalog(filters);
        }
      } catch {
        if (!cancelled) {
          setCatalogById(new Map());
          setFilterCatalog(null);
        }
      }
    };

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [apiJson, apiPostJson, heroIds, heroLocale]);

  useEffect(() => {
    setCatalogById(new Map());
  }, [heroLocale]);

  useEffect(() => {
    if (!selectedHeroSlug) {
      setSelectedHeroCard(null);
      setSelectedHeroDetails(null);
      setSelectedHeroVariants(null);
      setSelectedHeroError(null);
      setSelectedHeroLoading(false);
      return;
    }

    let cancelled = false;
    const loadHero = async () => {
      setSelectedHeroLoading(true);
      setSelectedHeroError(null);
      try {
        const response = await apiJson<PublicHeroVariantsItem>(
          `/api/v1/public/heroes/${selectedHeroSlug}/variants?language=${heroLocale}`,
        );
        if (!cancelled) {
          const hero = response.currentHero;
          const catalogHero = catalogById.get(hero.id);
          setSelectedHeroDetails(hero);
          setSelectedHeroVariants(response);
          setSelectedHeroCard({
            id: hero.id,
            slug: hero.slug,
            name: hero.name,
            imageUrl: hero.imageUrl ?? catalogHero?.imageUrl ?? null,
            previewUrl: hero.previewUrl ?? catalogHero?.previewUrl ?? hero.imageUrl ?? null,
            elementName: hero.element?.name ?? catalogHero?.elementName ?? '',
            rarityName: '',
            rarityStars: hero.rarity?.stars ?? catalogHero?.rarityStars ?? 0,
            heroClassName: hero.heroClass?.name ?? catalogHero?.heroClassName ?? '',
            manaSpeedName: hero.manaSpeed?.name ?? '',
            familyName: hero.family?.name ?? null,
            alphaTalentName: hero.alphaTalent?.name ?? null,
            baseAttack: hero.baseAttack ?? null,
            baseArmor: hero.baseArmor ?? null,
            baseHp: hero.baseHp ?? null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedHeroError(
            error instanceof ApiError
              ? error.message
              : locale === 'ru'
                ? 'Не удалось загрузить героя'
                : 'Could not load the hero',
          );
        }
      } finally {
        if (!cancelled) {
          setSelectedHeroLoading(false);
        }
      }
    };

    void loadHero();
    return () => {
      cancelled = true;
    };
  }, [apiJson, catalogById, heroLocale, locale, selectedHeroSlug]);

  const cards = useMemo<RosterHeroCard[]>(() => {
    return (share?.heroes ?? [])
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((item) => {
        const hero = catalogById.get(item.heroId);
        const rarityStars = hero?.rarityStars ?? 0;
        const rarityId = filterCatalog?.rarities.find((rarity) => rarity.stars === rarityStars)?.id ?? null;
        const power = calculateProfileHeroPower({
          baseAttack: hero?.baseAttack,
          baseArmor: hero?.baseArmor,
          baseHp: hero?.baseHp,
          rarityStars,
          rarityId,
          powerGrade: item.powerGrade,
          talentLevel: item.talentLevel,
          costumeCount: Math.max(
            item.costumeCount,
            hero?.isCostume === true ? Math.max(hero.costumeIndex ?? 1, 1) : 0,
          ),
          isCostume: hero?.isCostume === true,
          costumeIndex: hero?.costumeIndex ?? null,
          costumeBonuses: hero?.costumeBonuses ?? [],
          multipliers: filterCatalog?.evolutionMultipliers ?? [],
        });

        return {
          profileHeroId: `${item.heroId}-${item.order}`,
          heroId: item.heroId,
          baseHeroId: hero?.baseHeroId ?? null,
          powerGrade: item.powerGrade,
          talentLevel: item.talentLevel,
          costumeCount: Math.max(
            item.costumeCount,
            hero?.isCostume === true ? Math.max(hero.costumeIndex ?? 1, 1) : 0,
          ),
          availableCostumeCount: Math.max(hero?.availableCostumeCount ?? 0, 0),
          slug: hero?.slug ?? String(item.heroId),
          name: hero?.name ?? `Hero #${item.heroId}`,
          rarityStars,
          rarityImageUrl: null,
          createdAt: share?.createdAt ?? '',
          previewUrl: hero?.previewUrl ?? hero?.imageUrl ?? null,
          elementName: hero?.elementName ?? null,
          heroClassName: hero?.heroClassName ?? null,
          heroClassKey: resolveHeroClassKeyFromImageUrl(hero?.heroClassImageUrl) ?? resolveHeroClassKey(hero?.heroClassName),
          releaseDate: hero?.releaseDate ?? null,
          isCostume: hero?.isCostume === true,
          costumeIndex: hero?.costumeIndex ?? null,
          power: power.power,
          powerEstimated: power.estimated,
        };
      });
  }, [catalogById, filterCatalog, share]);

  const rarityOptions = useMemo<IconFilterOption[]>(() =>
    Array.from(new Set(cards.map((hero) => hero.rarityStars).filter((stars) => stars > 0)))
      .sort((left, right) => left - right)
      .map((stars) => ({ value: String(stars), label: `${stars}*`, starCount: stars })),
  [cards]);

  const powerGradeOptions = useMemo<IconFilterOption[]>(() =>
    buildPowerGradeOptions(heroLocale, 5).map((option) => ({
      value: option.value,
      label: option.label,
      imageUrl: option.imageUrl,
    })),
  [heroLocale]);

  const elementOptions = useMemo<IconFilterOption[]>(() =>
    Array.from(new Set(cards.map((hero) => hero.elementName).filter((value): value is string => Boolean(value))))
      .sort((left, right) => left.localeCompare(right, locale))
      .map((value) => {
        const key = resolveElementKey(value);
        return { value, label: value, imageUrl: key ? HERO_ELEMENT_ICON_BY_KEY[key] : null };
      }),
  [cards, locale]);

  const classOptions = useMemo<IconFilterOption[]>(() =>
    Array.from(new Set(cards.map((hero) => hero.heroClassName).filter((value): value is string => Boolean(value))))
      .sort((left, right) => left.localeCompare(right, locale))
      .map((value) => {
        const key = resolveHeroClassKey(value);
        return { value, label: value, imageUrl: key ? HERO_CLASS_ICON_BY_KEY[key] : null };
      }),
  [cards, locale]);

  const filteredCards = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const result = cards.filter((hero) => {
      if (rarities.length > 0 && !rarities.includes(String(hero.rarityStars))) return false;
      if (powerGrades.length > 0 && !powerGrades.includes(hero.powerGrade)) return false;
      if (elements.length > 0 && (!hero.elementName || !elements.includes(hero.elementName))) return false;
      if (heroClasses.length > 0 && (!hero.heroClassName || !heroClasses.includes(hero.heroClassName))) return false;
      return !normalizedSearch || hero.name.toLocaleLowerCase().includes(normalizedSearch);
    });

    if (sortField === 'snapshot') {
      return sortOrder === 'asc' ? result : [...result].reverse();
    }
    return sortRosterCardList(result, heroLocale, sortField, sortOrder);
  }, [cards, elements, heroClasses, heroLocale, powerGrades, rarities, search, sortField, sortOrder]);

  useEffect(() => {
    setPage(0);
  }, [elements, heroClasses, powerGrades, rarities, search, sortField, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const visibleCards = filteredCards.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const resetFilters = () => {
    setSearch('');
    setRarities([]);
    setPowerGrades([]);
    setElements([]);
    setHeroClasses([]);
    setSortField('snapshot');
    setSortOrder('asc');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <LoaderCircle className="h-8 w-8 animate-spin text-cyan-300" />
      </main>
    );
  }

  if (loadState !== 'ready' || !share) {
    const title = loadState === 'expired'
      ? locale === 'ru' ? 'Срок действия ссылки истёк' : 'This link has expired'
      : loadState === 'missing'
        ? locale === 'ru' ? 'Ссылка не найдена' : 'Link not found'
        : locale === 'ru' ? 'Не удалось открыть ссылку' : 'Could not open the link';
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-2xl">
          <h1 className="text-xl font-semibold">{title}</h1>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {locale === 'ru' ? 'На главную' : 'Go home'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-6 text-[var(--foreground)] sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-7xl">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                {locale === 'ru' ? 'Подборка героев' : 'Shared hero roster'}
              </h1>
              <p className="mt-1 text-sm text-[var(--foreground-soft)]">
                {locale === 'ru' ? `Героев: ${share.heroes.length}` : `Heroes: ${share.heroes.length}`}
                {' · '}
                {share.expiresAt
                  ? locale === 'ru'
                    ? `Доступна до ${new Date(share.expiresAt).toLocaleString('ru-RU')}`
                    : `Available until ${new Date(share.expiresAt).toLocaleString('en-US')}`
                  : locale === 'ru' ? 'Без срока действия' : 'No expiration'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              aria-label={locale === 'ru' ? 'Закрыть и перейти на главную' : 'Close and go home'}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
              <span>{locale === 'ru' ? 'Сортировка' : 'Sort by'}</span>
              <select
                value={sortField}
                onChange={(event) => setSortField(event.target.value as ShareSortField)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
              >
                <option value="snapshot">{locale === 'ru' ? 'Исходный порядок' : 'Shared order'}</option>
                <option value="name">{locale === 'ru' ? 'По имени' : 'By name'}</option>
                <option value="rarity">{locale === 'ru' ? 'По редкости' : 'By rarity'}</option>
                <option value="element">{locale === 'ru' ? 'По стихии' : 'By element'}</option>
                <option value="powerGrade">{locale === 'ru' ? 'По уровню перерождения' : 'By reborn level'}</option>
                <option value="power">{locale === 'ru' ? 'По силе' : 'By power'}</option>
                <option value="releaseDate">{locale === 'ru' ? 'По дате выхода' : 'By release date'}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)]">
              <span>{locale === 'ru' ? 'Порядок' : 'Order'}</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as HeroRosterSortOrder)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
              >
                <option value="asc">{locale === 'ru' ? 'По возрастанию' : 'Ascending'}</option>
                <option value="desc">{locale === 'ru' ? 'По убыванию' : 'Descending'}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-[var(--foreground-soft)] xl:col-span-2">
              <span>{locale === 'ru' ? 'Поиск по имени' : 'Search by name'}</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={locale === 'ru' ? 'Введите имя героя' : 'Type hero name'}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <IconFilterSelect label={locale === 'ru' ? 'Редкость' : 'Rarity'} values={rarities} allLabel={locale === 'ru' ? 'Все редкости' : 'All rarities'} options={rarityOptions} onChange={setRarities} locale={heroLocale} />
            <IconFilterSelect label={locale === 'ru' ? 'Уровень перерождения' : 'Reborn level'} values={powerGrades} allLabel={locale === 'ru' ? 'Все уровни' : 'All levels'} options={powerGradeOptions} onChange={setPowerGrades} locale={heroLocale} />
            <IconFilterSelect label={locale === 'ru' ? 'Элемент' : 'Element'} values={elements} allLabel={locale === 'ru' ? 'Все элементы' : 'All elements'} options={elementOptions} onChange={setElements} locale={heroLocale} />
            <IconFilterSelect label={locale === 'ru' ? 'Класс героя' : 'Hero class'} values={heroClasses} allLabel={locale === 'ru' ? 'Все классы' : 'All classes'} options={classOptions} onChange={setHeroClasses} locale={heroLocale} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--foreground-soft)]">
              {locale === 'ru' ? `Найдено: ${filteredCards.length}` : `Found: ${filteredCards.length}`}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--surface-hover)]"
            >
              <RotateCcw className="h-4 w-4" />
              {locale === 'ru' ? 'Сбросить' : 'Reset'}
            </button>
          </div>
        </div>

        {visibleCards.length > 0 ? (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(78px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(92px,1fr))] sm:gap-3">
            {visibleCards.map((hero) => (
              <OverviewHeroTile
                key={hero.profileHeroId}
                hero={hero}
                locale={heroLocale}
                onClick={() => setSelectedHeroSlug(hero.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--foreground-soft)]">
            {locale === 'ru' ? 'Герои не найдены' : 'No heroes found'}
          </div>
        )}

        {pageCount > 1 ? (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm disabled:opacity-50">
              {locale === 'ru' ? 'Назад' : 'Previous'}
            </button>
            <span className="text-sm text-[var(--foreground-soft)]">{page + 1} / {pageCount}</span>
            <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm disabled:opacity-50">
              {locale === 'ru' ? 'Дальше' : 'Next'}
            </button>
          </div>
        ) : null}
      </section>

      <PublicHeroDetailsModal
        open={selectedHeroSlug !== null}
        locale={heroLocale}
        heroCard={selectedHeroCard}
        loading={selectedHeroLoading}
        error={selectedHeroError}
        heroDetails={selectedHeroDetails}
        heroVariants={selectedHeroVariants}
        heroExpertOpinions={[]}
        heroExpertOpinionsLoading={false}
        heroExpertOpinionsError={null}
        onClose={() => setSelectedHeroSlug(null)}
        onOpenRelatedHero={setSelectedHeroSlug}
      />
    </main>
  );
}
