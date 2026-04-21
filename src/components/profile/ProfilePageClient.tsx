'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, Plus, Save, ShieldAlert, Trash2, X } from 'lucide-react';

import PublicHeroDetailsModal, {
  type PublicHeroCardItem,
  type PublicHeroDetailsItem,
  type PublicHeroVariantsItem,
} from '@/components/heroes/admin/PublicHeroDetailsModal';
import { useApi, ApiError } from '@/lib/use-api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';
import { getHeroPreviewAccentClass } from '@/lib/hero-preview';
import type {
  PlayerProfileHeroResponse,
  PlayerProfileResponse,
  PlayerProfileUpdateRequest,
} from '@/lib/types/player-profile';

type ProfileFormState = {
  firstName: string;
  lastName: string;
  telegramUsername: string;
  vkUsername: string;
  discordUsername: string;
  currentGameNickname: string;
};

type ProfileTab = 'info' | 'heroes';

type HeroLocale = 'RU' | 'EN';

type PublicHeroCatalogItem = {
  id: number;
  slug: string;
  name: string;
  baseHeroId?: number | null;
  isCostume?: boolean | null;
  costumeIndex?: number | null;
  previewUrl?: string | null;
  imageUrl?: string | null;
  elementName: string;
  rarityStars: number;
};

type PublicHeroPageResponse = {
  items: PublicHeroCatalogItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type RosterHeroCard = {
  profileHeroId: string;
  heroId: number;
  slug: string;
  name: string;
  previewUrl: string | null;
  elementName: string | null;
  isCostume: boolean;
  costumeIndex: number | null;
};

const emptyForm: ProfileFormState = {
  firstName: '',
  lastName: '',
  telegramUsername: '',
  vkUsername: '',
  discordUsername: '',
  currentGameNickname: '',
};

function toFormState(profile: PlayerProfileResponse): ProfileFormState {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    telegramUsername: profile.telegramUsername ?? '',
    vkUsername: profile.vkUsername ?? '',
    discordUsername: profile.discordUsername ?? '',
    currentGameNickname: profile.currentGameNickname ?? '',
  };
}

function HeroPreviewTile({
  name,
  previewUrl,
  elementName,
  isCostume,
  costumeIndex,
  onClick,
  onRemove,
  removeLabel,
}: {
  name: string;
  previewUrl: string | null;
  elementName: string | null;
  isCostume?: boolean;
  costumeIndex?: number | null;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const accentClass = getHeroPreviewAccentClass(elementName);
  const content = (
    <>
      <div className={`overflow-hidden rounded-2xl border p-[2px] ${accentClass}`}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={name}
            className="h-20 w-20 rounded-[14px] object-cover sm:h-24 sm:w-24"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[14px] bg-[var(--surface-strong)] text-xs text-[var(--foreground-soft)] sm:h-24 sm:w-24">
            ?
          </div>
        )}
      </div>
      <span className="line-clamp-2 min-h-[2.5rem] text-xs font-medium text-[var(--foreground)] sm:text-sm">
        {name}
      </span>
    </>
  );

  return (
    <div className="group relative">
      {isCostume ? (
        <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full border border-cyan-400/40 bg-slate-950/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200 shadow-lg">
          {`C${costumeIndex ?? '?'}`}
        </div>
      ) : null}

      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex w-full flex-col items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center shadow-sm transition hover:bg-[var(--surface-hover)]"
        >
          {content}
        </button>
      ) : (
        <div className="flex w-full flex-col items-center gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center shadow-sm">
          {content}
        </div>
      )}

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title={removeLabel}
          aria-label={removeLabel}
          className="absolute right-2 top-2 rounded-full border border-red-500/30 bg-[var(--surface-strong)] p-2 text-red-400 opacity-100 shadow-lg transition hover:bg-red-500/10 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function AddHeroTile({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-3 text-center shadow-sm transition hover:bg-[var(--surface-hover)]"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--foreground-soft)] shadow-[inset_0_8px_20px_rgba(255,255,255,0.05),0_12px_26px_rgba(0,0,0,0.18)] sm:h-24 sm:w-24">
        <Plus className="h-8 w-8 opacity-75" />
      </div>
      <span className="text-xs font-semibold text-[var(--foreground)] sm:text-sm">
        {label}
      </span>
    </button>
  );
}

export default function ProfilePageClient() {
  const { authenticated, loading: authLoading, login } = useAuth();
  const { apiJson, apiPutJson, apiPostJson, apiDeleteVoid } = useApi();
  const { messages, locale } = useI18n();

  const heroLocale: HeroLocale = locale === 'ru' ? 'RU' : 'EN';

  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [profileHeroes, setProfileHeroes] = useState<PlayerProfileHeroResponse[]>([]);
  const [loadingProfileHeroes, setLoadingProfileHeroes] = useState(false);
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorQuery, setSelectorQuery] = useState('');
  const [selectorPage, setSelectorPage] = useState(0);
  const [selectorPageSize, setSelectorPageSize] = useState(18);
  const [selectorResult, setSelectorResult] = useState<PublicHeroPageResponse | null>(null);
  const [loadingSelector, setLoadingSelector] = useState(false);
  const [loadingMoreSelector, setLoadingMoreSelector] = useState(false);
  const [selectorError, setSelectorError] = useState<string | null>(null);
  const [addingHeroId, setAddingHeroId] = useState<number | null>(null);
  const [removingProfileHeroId, setRemovingProfileHeroId] = useState<string | null>(null);
  const [rosterHeroMap, setRosterHeroMap] = useState<Map<number, PublicHeroCatalogItem>>(new Map());
  const [selectedHeroSlug, setSelectedHeroSlug] = useState<string | null>(null);
  const [selectedHeroCard, setSelectedHeroCard] = useState<PublicHeroCardItem | null>(null);
  const [selectedHeroDetails, setSelectedHeroDetails] = useState<PublicHeroDetailsItem | null>(null);
  const [selectedHeroVariants, setSelectedHeroVariants] = useState<PublicHeroVariantsItem | null>(null);
  const [selectedHeroLoading, setSelectedHeroLoading] = useState(false);
  const [selectedHeroError, setSelectedHeroError] = useState<string | null>(null);
  const selectorInputRef = useRef<HTMLInputElement | null>(null);
  const selectorScrollRef = useRef<HTMLDivElement | null>(null);
  const selectorScrollRestoreRef = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authenticated) {
      setLoading(false);
      setProfile(null);
      setForm(emptyForm);
      setProfileHeroes([]);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await apiJson<PlayerProfileResponse>('/api/v1/profile/me');

        if (cancelled) {
          return;
        }

        setProfile(response);
        setForm(toFormState(response));
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError) {
          setLoadError(error.message || messages.profile.loadError);
        } else {
          setLoadError(messages.profile.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authLoading, authenticated, messages.profile.loadError]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let cancelled = false;

    const loadProfileHeroes = async () => {
      setLoadingProfileHeroes(true);

      try {
        const response = await apiJson<PlayerProfileHeroResponse[]>('/api/v1/profile/me/heroes');

        if (!cancelled) {
          setProfileHeroes(response);
        }
      } catch {
        if (!cancelled) {
          setProfileHeroes([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfileHeroes(false);
        }
      }
    };

    void loadProfileHeroes();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authenticated]);

  useEffect(() => {
    if (!heroModalOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectorPage(0);
      setSelectorQuery(selectorSearch.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [heroModalOpen, selectorSearch]);

  useEffect(() => {
    if (!heroModalOpen) {
      return;
    }

    const width = window.innerWidth;
    const columns =
      width >= 1280 ? 6
      : width >= 1024 ? 4
      : width >= 640 ? 3
      : 2;
    const availableHeight = Math.max(window.innerHeight - 320, 280);
    const rows = Math.max(2, Math.floor(availableHeight / 180));
    setSelectorPageSize(Math.min(36, Math.max(columns * rows, 12)));

    const focusTimer = window.setTimeout(() => {
      selectorInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [heroModalOpen]);

  useEffect(() => {
    if (!heroModalOpen) {
      return;
    }

    let cancelled = false;

    const loadSelector = async () => {
      const isAppending = selectorPage > 0;
      if (isAppending) {
        setLoadingMoreSelector(true);
      } else {
        setLoadingSelector(true);
      }
      setSelectorError(null);

      try {
        const params = new URLSearchParams({
          page: String(selectorPage),
          size: String(selectorPageSize),
          language: heroLocale,
        });

        if (selectorQuery) {
          params.set('search', selectorQuery);
        }

        const response = await apiJson<PublicHeroPageResponse>(`/api/v1/public/heroes?${params.toString()}`);

        if (!cancelled) {
          setSelectorResult((current) => {
            if (selectorPage === 0 || !current) {
              return response;
            }

            return {
              ...response,
              items: [...current.items, ...response.items],
            };
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError) {
          setSelectorError(error.message);
        } else {
          setSelectorError(messages.profile.noHeroesFound);
        }
      } finally {
        if (!cancelled) {
          if (isAppending) {
            setLoadingMoreSelector(false);
          } else {
            setLoadingSelector(false);
          }
        }
      }
    };

    void loadSelector();

    return () => {
      cancelled = true;
    };
  }, [apiJson, heroLocale, heroModalOpen, messages.profile.noHeroesFound, selectorPage, selectorPageSize, selectorQuery]);

  useEffect(() => {
    if (selectorScrollRestoreRef.current === null) {
      return;
    }

    selectorScrollRef.current?.scrollTo({
      top: selectorScrollRestoreRef.current,
      behavior: 'auto',
    });
    selectorScrollRestoreRef.current = null;
  }, [selectorResult, loadingSelector]);

  const uniqueHeroIds = useMemo(() => {
    return Array.from(new Set(profileHeroes.map((item) => item.heroId)));
  }, [profileHeroes]);

  useEffect(() => {
    if (!authenticated || uniqueHeroIds.length === 0) {
      return;
    }

    let cancelled = false;

    const loadRosterHeroes = async () => {
      try {
        const missingIds = uniqueHeroIds.filter((heroId) => !rosterHeroMap.has(heroId));
        if (missingIds.length === 0) {
          return;
        }

        const unresolvedIds = new Set(missingIds);
        let page = 0;
        let hasNext = true;
        const foundItems = new Map<number, PublicHeroCatalogItem>();

        while (hasNext && unresolvedIds.size > 0) {
          const params = new URLSearchParams({
            page: String(page),
            size: '100',
            language: heroLocale,
          });

          const response = await apiJson<PublicHeroPageResponse>(`/api/v1/public/heroes?${params.toString()}`);

          for (const item of response.items) {
            if (unresolvedIds.has(item.id)) {
              foundItems.set(item.id, item);
              unresolvedIds.delete(item.id);
            }
          }

          hasNext = response.hasNext;
          page += 1;
        }

        if (!cancelled && foundItems.size > 0) {
          setRosterHeroMap((current) => {
            const next = new Map(current);
            for (const [heroId, item] of foundItems.entries()) {
              next.set(heroId, item);
            }
            return next;
          });
        }
      } catch {
        // no-op, roster can still show fallback labels until data becomes available
      }
    };

    void loadRosterHeroes();

    return () => {
      cancelled = true;
    };
  }, [apiJson, authenticated, heroLocale, rosterHeroMap, uniqueHeroIds]);

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

    const loadSelectedHero = async () => {
      setSelectedHeroLoading(true);
      setSelectedHeroError(null);
      setSelectedHeroCard(null);
      setSelectedHeroDetails(null);
      setSelectedHeroVariants(null);

      try {
        const response = await apiJson<PublicHeroVariantsItem>(
          `/api/v1/public/heroes/${selectedHeroSlug}/variants?language=${heroLocale}`,
        );

        if (!cancelled) {
          const currentHero = response.currentHero;
          const rosterHero = rosterHeroMap.get(currentHero.id);

          setSelectedHeroDetails(currentHero);
          setSelectedHeroVariants(response);
          setSelectedHeroCard({
            id: currentHero.id,
            slug: currentHero.slug,
            name: currentHero.name,
            imageUrl: currentHero.imageUrl ?? rosterHero?.imageUrl ?? null,
            previewUrl: currentHero.previewUrl ?? rosterHero?.previewUrl ?? currentHero.imageUrl ?? rosterHero?.imageUrl ?? null,
            elementName: currentHero.element?.name ?? rosterHero?.elementName ?? '',
            rarityName: '',
            rarityStars: currentHero.rarity?.stars ?? rosterHero?.rarityStars ?? 0,
            heroClassName: currentHero.heroClass?.name ?? '',
            manaSpeedName: currentHero.manaSpeed?.name ?? '',
            familyName: currentHero.family?.name ?? null,
            alphaTalentName: currentHero.alphaTalent?.name ?? null,
            baseAttack: currentHero.baseAttack ?? null,
            baseArmor: currentHero.baseArmor ?? null,
            baseHp: currentHero.baseHp ?? null,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError) {
          setSelectedHeroError(error.message);
        } else {
          setSelectedHeroError(messages.profile.loadError);
        }
      } finally {
        if (!cancelled) {
          setSelectedHeroLoading(false);
        }
      }
    };

    void loadSelectedHero();

    return () => {
      cancelled = true;
    };
  }, [apiJson, heroLocale, messages.profile.loadError, rosterHeroMap, selectedHeroSlug]);

  const rosterCards = useMemo<RosterHeroCard[]>(() => {
    return profileHeroes.map((item) => {
      const hero = rosterHeroMap.get(item.heroId);

      return {
        profileHeroId: item.id,
        heroId: item.heroId,
        slug: hero?.slug ?? String(item.heroId),
        name: hero?.name ?? `Hero #${item.heroId}`,
        previewUrl: hero?.previewUrl ?? hero?.imageUrl ?? null,
        elementName: hero?.elementName ?? null,
        isCostume: hero?.isCostume === true,
        costumeIndex: hero?.costumeIndex ?? null,
      };
    });
  }, [profileHeroes, rosterHeroMap]);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: PlayerProfileUpdateRequest = {
      firstName: form.firstName,
      lastName: form.lastName,
      telegramUsername: form.telegramUsername,
      vkUsername: form.vkUsername,
      discordUsername: form.discordUsername,
      currentGameNickname: form.currentGameNickname,
    };

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await apiPutJson<PlayerProfileUpdateRequest, PlayerProfileResponse>(
        '/api/v1/profile/me',
        payload,
      );

      setProfile(response);
      setForm(toFormState(response));
      setSaveMessage(messages.profile.saveSuccess);
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setSaving(false);
    }
  };

  const openHeroModal = () => {
    setHeroModalOpen(true);
    setSelectorSearch('');
    setSelectorQuery('');
    setSelectorPage(0);
    setSelectorError(null);
    setSelectorResult(null);
    selectorScrollRestoreRef.current = 0;
  };

  const handleLoadMoreHeroes = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loadingMoreSelector || loadingSelector || !selectorResult?.hasNext) {
      return;
    }

    selectorScrollRestoreRef.current = selectorScrollRef.current?.scrollTop ?? 0;
    event.currentTarget.blur();
    setSelectorPage((current) => current + 1);
  };

  const handleAddHero = async (heroId: number) => {
    setAddingHeroId(heroId);

    try {
      const response = await apiPostJson<{ heroId: number }, PlayerProfileHeroResponse>(
        '/api/v1/profile/me/heroes',
        { heroId },
      );

      const selectedHero = selectorResult?.items.find((item) => item.id === heroId) ?? null;
      if (selectedHero) {
        setRosterHeroMap((current) => {
          const next = new Map(current);
          next.set(heroId, selectedHero);
          return next;
        });
      }

      setProfileHeroes((current) => [...current, response]);
      setHeroModalOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setAddingHeroId(null);
    }
  };

  const handleOpenRosterHero = (slug: string) => {
    setSelectedHeroSlug(slug);
  };

  const handleCloseSelectedHero = () => {
    setSelectedHeroSlug(null);
  };

  const handleRemoveHero = async (profileHeroId: string) => {
    setRemovingProfileHeroId(profileHeroId);

    try {
      await apiDeleteVoid(`/api/v1/profile/me/heroes/${profileHeroId}`);
      setProfileHeroes((current) => current.filter((item) => item.id !== profileHeroId));
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || messages.profile.saveError);
      } else {
        setSaveError(messages.profile.saveError);
      }
    } finally {
      setRemovingProfileHeroId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-4 text-sm text-[var(--foreground-muted)] shadow-lg">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
          <span>{messages.profile.loading}</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          {messages.profile.signInTitle}
        </h1>
        <p className="mt-3 text-base text-[var(--foreground-soft)]">
          {messages.profile.signInDescription}
        </p>
        <button
          type="button"
          onClick={login}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {messages.navbar.login}
        </button>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          {messages.profile.pageTitle}
        </h1>

        <div
          className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold ${
            profile?.status === 'COMPLETE'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
          }`}
        >
          {profile?.status === 'COMPLETE' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
          <span>
            {profile?.status === 'COMPLETE'
              ? messages.profile.statusComplete
              : messages.profile.statusIncomplete}
          </span>
        </div>
      </div>

      <div className="mb-6 inline-flex rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'info'
              ? 'bg-cyan-400/10 text-cyan-300'
              : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
          }`}
        >
          {messages.profile.tabInfo}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('heroes')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'heroes'
              ? 'bg-cyan-400/10 text-cyan-300'
              : 'text-[var(--foreground-soft)] hover:text-[var(--foreground)]'
          }`}
        >
          {messages.profile.tabHeroes}
        </button>
      </div>

      {loadError ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      ) : null}

      {saveMessage ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {saveMessage}
        </div>
      ) : null}

      {saveError ? (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {saveError}
        </div>
      ) : null}

      {activeTab === 'info' ? (
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.emailLabel}
                </span>
                <input
                  value={profile?.email ?? ''}
                  disabled
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground-soft)] outline-none"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.gameNicknameLabel}
                </span>
                <input
                  value={form.currentGameNickname}
                  onChange={(event) => handleChange('currentGameNickname', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.firstNameLabel}
                </span>
                <input
                  value={form.firstName}
                  onChange={(event) => handleChange('firstName', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.lastNameLabel}
                </span>
                <input
                  value={form.lastName}
                  onChange={(event) => handleChange('lastName', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.telegramLabel}
                </span>
                <input
                  value={form.telegramUsername}
                  onChange={(event) => handleChange('telegramUsername', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.vkLabel}
                </span>
                <input
                  value={form.vkUsername}
                  onChange={(event) => handleChange('vkUsername', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {messages.profile.discordLabel}
                </span>
                <input
                  value={form.discordUsername}
                  onChange={(event) => handleChange('discordUsername', event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {saving ? messages.profile.savingButton : messages.profile.saveButton}
              </span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {messages.profile.heroesTitle}
            </h2>
          </div>

          {loadingProfileHeroes ? (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                <span>{messages.profile.loadingHeroes}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm backdrop-blur-sm sm:p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                <AddHeroTile
                  label={messages.profile.addHero}
                  onClick={openHeroModal}
                />

                {rosterCards.map((hero) => (
                  <HeroPreviewTile
                    key={hero.profileHeroId}
                    name={hero.name}
                    previewUrl={hero.previewUrl}
                    elementName={hero.elementName}
                    isCostume={hero.isCostume}
                    costumeIndex={hero.costumeIndex}
                    onClick={
                      hero.slug === String(hero.heroId)
                        ? undefined
                        : () => handleOpenRosterHero(hero.slug)
                    }
                    onRemove={
                      removingProfileHeroId === hero.profileHeroId
                        ? undefined
                        : () => void handleRemoveHero(hero.profileHeroId)
                    }
                    removeLabel={messages.profile.removeHero}
                  />
                ))}
              </div>

              {rosterCards.length === 0 ? (
                <p className="mt-5 text-sm text-[var(--foreground-soft)]">
                  {messages.profile.heroesEmpty}
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {heroModalOpen ? (
        <div
          className="fixed inset-0 z-[80] overflow-hidden bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setHeroModalOpen(false)}
        >
          <div className="flex h-full items-start justify-center py-4">
            <div
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-2xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">
                  {messages.profile.selectHero}
                </h3>

                <button
                  type="button"
                  onClick={() => setHeroModalOpen(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-5">
                <input
                  ref={selectorInputRef}
                  value={selectorSearch}
                  onChange={(event) => setSelectorSearch(event.target.value)}
                  placeholder={messages.profile.searchHeroes}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40"
                />
              </div>

              <div ref={selectorScrollRef} className="min-h-[20rem] flex-1 overflow-y-auto pr-1">
                {selectorError ? (
                  <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {selectorError}
                  </div>
                ) : null}

                {loadingSelector && (!selectorResult || selectorResult.items.length === 0) ? (
                  <div className="flex min-h-[18rem] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                      <LoaderCircle className="h-5 w-5 animate-spin text-cyan-400" />
                      <span>{messages.profile.loadingHeroes}</span>
                    </div>
                  </div>
                ) : selectorResult && selectorResult.items.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      {selectorResult.items.map((hero) => (
                        <button
                          key={`${hero.id}-${hero.slug}`}
                          type="button"
                          onClick={() => void handleAddHero(hero.id)}
                          disabled={addingHeroId === hero.id}
                          className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-sm transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <div className={`inline-block overflow-hidden rounded-2xl border p-[2px] ${getHeroPreviewAccentClass(hero.elementName)}`}>
                            {hero.previewUrl || hero.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={hero.previewUrl ?? hero.imageUrl ?? ''}
                                alt={hero.name}
                                className="h-20 w-20 rounded-[14px] object-cover sm:h-24 sm:w-24"
                              />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-[14px] bg-[var(--surface-strong)] text-xs text-[var(--foreground-soft)] sm:h-24 sm:w-24">
                                ?
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-[var(--foreground)]">
                              {hero.name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--foreground-soft)]">
                              <span>{hero.rarityStars}*</span>
                              {hero.isCostume ? (
                                <span className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-cyan-300">
                                  {`C${hero.costumeIndex ?? '?'}`}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectorResult.hasNext ? (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={handleLoadMoreHeroes}
                          disabled={loadingMoreSelector}
                          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                        >
                          {loadingMoreSelector ? messages.profile.loadingHeroes : messages.profile.loadMore}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-soft)]">
                    {messages.profile.noHeroesFound}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
        onClose={handleCloseSelectedHero}
        onOpenRelatedHero={(slug) => setSelectedHeroSlug(slug)}
      />
    </section>
  );
}
