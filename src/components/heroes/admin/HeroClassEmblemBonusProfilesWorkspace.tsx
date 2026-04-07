'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  type CreateHeroClassEmblemBonusProfileRequest,
  type EmblemPathType,
  type HeroClassEmblemBonusProfileItem,
  type HeroClassEmblemBonusProfileResponseDto,
  type HeroClassItem,
  type HeroClassResponseDto,
  type HeroLocale,
  type UpdateHeroClassEmblemBonusProfileRequest,
  getLocalizedText,
  mapHeroClassDto,
  mapHeroClassEmblemBonusProfileDto,
} from '@/lib/types/hero';
import DictionaryModal from './DictionaryModal';

const API = '/api/v1/admin/heroes/emblem-profiles';
const HERO_CLASSES_API = '/api/v1/admin/heroes/hero-classes';

type FormState = {
  heroClassId: string;
  pathType: EmblemPathType | '';
  attackFlatBonus: string;
  armorFlatBonus: string;
  hpFlatBonus: string;
  attackPercentBonus: string;
  armorPercentBonus: string;
  hpPercentBonus: string;
  masterAttackBonus: string;
  masterArmorBonus: string;
  masterHpBonus: string;
};

const EMPTY_FORM: FormState = {
  heroClassId: '',
  pathType: '',
  attackFlatBonus: '',
  armorFlatBonus: '',
  hpFlatBonus: '',
  attackPercentBonus: '',
  armorPercentBonus: '',
  hpPercentBonus: '',
  masterAttackBonus: '',
  masterArmorBonus: '',
  masterHpBonus: '',
};

const PATH_TYPES: EmblemPathType[] = ['DAMAGE', 'DEFENSE'];

export default function HeroClassEmblemBonusProfilesWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { locale } = useI18n();
  const heroLocale: HeroLocale = locale === 'ru' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      heroLocale === 'RU'
        ? {
            sectionTitle: 'Профили эмблем',
            sectionSubtitle: 'Настройки обычных и мастер-эмблем по классам',
            create: 'Создать',
            createTitle: 'Создать профиль эмблем',
            editTitle: 'Редактировать профиль эмблем',
            detailsTitle: 'Профиль эмблем',
            detailsSubtitle: 'Просмотр, изменение и удаление выбранного профиля',
            edit: 'Редактировать',
            delete: 'Удалить',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loadingList: 'Загрузка профилей...',
            loadingDetails: 'Загрузка профиля...',
            empty: 'Профилей пока нет',
            select: 'Выбери профиль из списка',
            close: 'Закрыть',
            heroClass: 'Класс героя',
            pathType: 'Путь',
            flatBonuses: 'Обычные эмблемы: фикс',
            percentBonuses: 'Обычные эмблемы: проценты',
            masterBonuses: 'Мастер-эмблемы',
            attack: 'Атака',
            armor: 'Броня',
            hp: 'HP',
            selectHeroClass: 'Выберите класс героя',
            selectPathType: 'Выберите путь',
            deleteConfirm: (item: HeroClassEmblemBonusProfileItem) =>
              `Удалить профиль эмблем #${item.id}?`,
            pathLabel: (path: EmblemPathType) =>
              path === 'DAMAGE' ? 'Урон' : 'Защита',
          }
        : {
            sectionTitle: 'Emblem profiles',
            sectionSubtitle: 'Regular and master emblem settings by hero class',
            create: 'Create',
            createTitle: 'Create emblem profile',
            editTitle: 'Edit emblem profile',
            detailsTitle: 'Emblem profile',
            detailsSubtitle: 'View, update and delete the selected profile',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading profiles...',
            loadingDetails: 'Loading profile...',
            empty: 'No emblem profiles yet',
            select: 'Select a profile from the list',
            close: 'Close',
            heroClass: 'Hero class',
            pathType: 'Path',
            flatBonuses: 'Regular emblems: flat',
            percentBonuses: 'Regular emblems: percent',
            masterBonuses: 'Master emblems',
            attack: 'Attack',
            armor: 'Armor',
            hp: 'HP',
            selectHeroClass: 'Select hero class',
            selectPathType: 'Select path',
            deleteConfirm: (item: HeroClassEmblemBonusProfileItem) =>
              `Delete emblem profile #${item.id}?`,
            pathLabel: (path: EmblemPathType) =>
              path === 'DAMAGE' ? 'Damage' : 'Defense',
          },
    [heroLocale],
  );

  const [items, setItems] = useState<HeroClassEmblemBonusProfileItem[]>([]);
  const [heroClasses, setHeroClasses] = useState<HeroClassItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<HeroClassEmblemBonusProfileItem | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  const resolveHeroClassName = useCallback(
    (heroClassId: number) => {
      const heroClass = heroClasses.find((item) => item.id === heroClassId);
      return heroClass ? getLocalizedText(heroClass.name, heroLocale) : `#${heroClassId}`;
    },
    [heroClasses, heroLocale],
  );

  const loadHeroClasses = useCallback(async () => {
    try {
      const response = await apiJson<HeroClassResponseDto[]>(HERO_CLASSES_API);
      setHeroClasses(response.map(mapHeroClassDto));
    } catch {
      setHeroClasses([]);
    }
  }, [apiJson]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);

    try {
      const response = await apiJson<HeroClassEmblemBonusProfileResponseDto[]>(API);
      const mapped = response.map(mapHeroClassEmblemBonusProfileDto);
      setItems(mapped);

      if (mapped.length > 0) {
        setSelectedId((prev) => prev ?? mapped[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load emblem profiles');
    } finally {
      setLoadingList(false);
    }
  }, [apiJson]);

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await apiJson<HeroClassEmblemBonusProfileResponseDto>(`${API}/${id}`);
        setSelectedItem(mapHeroClassEmblemBonusProfileDto(response));
      } catch (error) {
        setDetailsError(
          error instanceof Error ? error.message : 'Failed to load emblem profile',
        );
      } finally {
        setLoadingDetails(false);
      }
    },
    [apiJson],
  );

  useEffect(() => {
    void loadHeroClasses();
    void loadList();
  }, [loadHeroClasses, loadList]);

  useEffect(() => {
    if (selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [loadDetails, selectedId]);

  const validateInteger = (value: string, labelRu: string, labelEn: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return heroLocale === 'RU' ? `${labelRu} обязателен` : `${labelEn} is required`;
    }
    const parsed = Number(normalized);
    if (!Number.isInteger(parsed)) {
      return heroLocale === 'RU'
        ? `${labelRu} должен быть целым числом`
        : `${labelEn} must be an integer`;
    }
    return null;
  };

  const validateNumber = (value: string, labelRu: string, labelEn: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return heroLocale === 'RU' ? `${labelRu} обязателен` : `${labelEn} is required`;
    }
    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      return heroLocale === 'RU'
        ? `${labelRu} должен быть числом`
        : `${labelEn} must be a number`;
    }
    return null;
  };

  const validateForm = (form: FormState): string | null => {
    const heroClassId = Number(form.heroClassId);
    if (!Number.isInteger(heroClassId) || heroClassId <= 0) {
      return heroLocale === 'RU' ? 'Класс героя обязателен' : 'Hero class is required';
    }
    if (!form.pathType) {
      return heroLocale === 'RU' ? 'Путь обязателен' : 'Path is required';
    }

    return (
      validateInteger(form.attackFlatBonus, 'Фикс атаки', 'Attack flat bonus') ||
      validateInteger(form.armorFlatBonus, 'Фикс брони', 'Armor flat bonus') ||
      validateInteger(form.hpFlatBonus, 'Фикс HP', 'HP flat bonus') ||
      validateNumber(form.attackPercentBonus, 'Процент атаки', 'Attack percent bonus') ||
      validateNumber(form.armorPercentBonus, 'Процент брони', 'Armor percent bonus') ||
      validateNumber(form.hpPercentBonus, 'Процент HP', 'HP percent bonus') ||
      validateInteger(form.masterAttackBonus, 'Мастер-бонус атаки', 'Master attack bonus') ||
      validateInteger(form.masterArmorBonus, 'Мастер-бонус брони', 'Master armor bonus') ||
      validateInteger(form.masterHpBonus, 'Мастер-бонус HP', 'Master HP bonus')
    );
  };

  const resetCreateForm = () => {
    setCreateForm(EMPTY_FORM);
    setSubmitError(null);
  };

  const resetEditForm = (item: HeroClassEmblemBonusProfileItem) => {
    setEditForm({
      heroClassId: String(item.heroClassId),
      pathType: item.pathType,
      attackFlatBonus: String(item.attackFlatBonus),
      armorFlatBonus: String(item.armorFlatBonus),
      hpFlatBonus: String(item.hpFlatBonus),
      attackPercentBonus: String(item.attackPercentBonus),
      armorPercentBonus: String(item.armorPercentBonus),
      hpPercentBonus: String(item.hpPercentBonus),
      masterAttackBonus: String(item.masterAttackBonus),
      masterArmorBonus: String(item.masterArmorBonus),
      masterHpBonus: String(item.masterHpBonus),
    });
    setSubmitError(null);
  };

  const buildPayload = (
    form: FormState,
  ): CreateHeroClassEmblemBonusProfileRequest => ({
    heroClassId: Number(form.heroClassId),
    pathType: form.pathType as EmblemPathType,
    attackFlatBonus: Number(form.attackFlatBonus),
    armorFlatBonus: Number(form.armorFlatBonus),
    hpFlatBonus: Number(form.hpFlatBonus),
    attackPercentBonus: Number(form.attackPercentBonus),
    armorPercentBonus: Number(form.armorPercentBonus),
    hpPercentBonus: Number(form.hpPercentBonus),
    masterAttackBonus: Number(form.masterAttackBonus),
    masterArmorBonus: Number(form.masterArmorBonus),
    masterHpBonus: Number(form.masterHpBonus),
  });

  const handleCreate = async () => {
    const validationError = validateForm(createForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const created = await apiPostJson<
        CreateHeroClassEmblemBonusProfileRequest,
        HeroClassEmblemBonusProfileResponseDto
      >(API, buildPayload(createForm));

      const mapped = mapHeroClassEmblemBonusProfileDto(created);
      setItems((prev) => [...prev, mapped].sort((a, b) => a.id - b.id));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!selectedItem) return;
    resetEditForm(selectedItem);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;

    const validationError = validateForm(editForm);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const updated = await apiPutJson<
        UpdateHeroClassEmblemBonusProfileRequest,
        HeroClassEmblemBonusProfileResponseDto
      >(`${API}/${selectedItem.id}`, buildPayload(editForm));

      const mapped = mapHeroClassEmblemBonusProfileDto(updated);
      setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setSelectedItem(mapped);
      setEditOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm(t.deleteConfirm(selectedItem))) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await apiDeleteVoid(`${API}/${selectedItem.id}`);
      const nextItems = items.filter((item) => item.id !== selectedItem.id);
      setItems(nextItems);
      if (nextItems.length > 0) {
        setSelectedId(nextItems[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Failed to delete profile';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderNumberField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    step: '1' | '0.0001' = '1',
  ) => (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--foreground-soft)]">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
      />
    </label>
  );

  const renderBonusGroup = (
    title: string,
    values: { attack: string; armor: string; hp: string },
    handlers: {
      attack: (value: string) => void;
      armor: (value: string) => void;
      hp: (value: string) => void;
    },
    step: '1' | '0.0001' = '1',
  ) => (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="text-sm font-semibold text-[var(--foreground)]">{title}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {renderNumberField(t.attack, values.attack, handlers.attack, step)}
        {renderNumberField(t.armor, values.armor, handlers.armor, step)}
        {renderNumberField(t.hp, values.hp, handlers.hp, step)}
      </div>
    </div>
  );

  const renderForm = (
    form: FormState,
    setForm: React.Dispatch<React.SetStateAction<FormState>>,
  ) => (
    <div className="space-y-6">
      {submitError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {submitError}
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">
          {t.heroClass}
        </span>
        <select
          value={form.heroClassId}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, heroClassId: event.target.value }))
          }
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="">{t.selectHeroClass}</option>
          {heroClasses.map((item) => (
            <option key={item.id} value={item.id}>
              {getLocalizedText(item.name, heroLocale)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">
          {t.pathType}
        </span>
        <select
          value={form.pathType}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              pathType: event.target.value as EmblemPathType,
            }))
          }
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="">{t.selectPathType}</option>
          {PATH_TYPES.map((path) => (
            <option key={path} value={path}>
              {t.pathLabel(path)}
            </option>
          ))}
        </select>
      </label>

      {renderBonusGroup(
        t.flatBonuses,
        {
          attack: form.attackFlatBonus,
          armor: form.armorFlatBonus,
          hp: form.hpFlatBonus,
        },
        {
          attack: (value) => setForm((prev) => ({ ...prev, attackFlatBonus: value })),
          armor: (value) => setForm((prev) => ({ ...prev, armorFlatBonus: value })),
          hp: (value) => setForm((prev) => ({ ...prev, hpFlatBonus: value })),
        },
      )}

      {renderBonusGroup(
        t.percentBonuses,
        {
          attack: form.attackPercentBonus,
          armor: form.armorPercentBonus,
          hp: form.hpPercentBonus,
        },
        {
          attack: (value) => setForm((prev) => ({ ...prev, attackPercentBonus: value })),
          armor: (value) => setForm((prev) => ({ ...prev, armorPercentBonus: value })),
          hp: (value) => setForm((prev) => ({ ...prev, hpPercentBonus: value })),
        },
        '0.0001',
      )}

      {renderBonusGroup(
        t.masterBonuses,
        {
          attack: form.masterAttackBonus,
          armor: form.masterArmorBonus,
          hp: form.masterHpBonus,
        },
        {
          attack: (value) => setForm((prev) => ({ ...prev, masterAttackBonus: value })),
          armor: (value) => setForm((prev) => ({ ...prev, masterArmorBonus: value })),
          hp: (value) => setForm((prev) => ({ ...prev, masterHpBonus: value })),
        },
      )}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {t.sectionTitle}
              </h3>
              <p className="text-sm text-[var(--foreground-soft)]">{t.sectionSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15"
            >
              {t.create}
            </button>
          </div>

          {listError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {listError}
            </div>
          )}

          {loadingList ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.loadingList}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--foreground-soft)]">
              {t.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isActive = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? 'border-cyan-400/40 bg-cyan-400/10'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {resolveHeroClassName(item.heroClassId)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                      {t.pathType}: {t.pathLabel(item.pathType)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                      +{item.attackFlatBonus} / +{item.armorFlatBonus} / +{item.hpFlatBonus}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-wide text-[var(--foreground-muted)]">
                      ID: {item.id}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {t.detailsTitle}
              </h3>
              <p className="text-sm text-[var(--foreground-soft)]">{t.detailsSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!selectedItem || loadingDetails}
                onClick={handleOpenEdit}
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.edit}
              </button>
              <button
                type="button"
                disabled={!selectedItem || submitting || loadingDetails}
                onClick={handleDelete}
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.delete}
              </button>
            </div>
          </div>

          {submitError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError}
            </div>
          )}

          {detailsError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {detailsError}
            </div>
          )}

          {loadingDetails ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
              {t.loadingDetails}
            </div>
          ) : !selectedItem ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--foreground-soft)]">
              {t.select}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                    {t.heroClass}
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {resolveHeroClassName(selectedItem.heroClassId)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                    {t.pathType}
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {t.pathLabel(selectedItem.pathType)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                    {t.flatBonuses}
                  </div>
                  <div className="space-y-2 text-sm text-[var(--foreground)]">
                    <div>{t.attack}: {selectedItem.attackFlatBonus}</div>
                    <div>{t.armor}: {selectedItem.armorFlatBonus}</div>
                    <div>{t.hp}: {selectedItem.hpFlatBonus}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                    {t.percentBonuses}
                  </div>
                  <div className="space-y-2 text-sm text-[var(--foreground)]">
                    <div>{t.attack}: {selectedItem.attackPercentBonus}</div>
                    <div>{t.armor}: {selectedItem.armorPercentBonus}</div>
                    <div>{t.hp}: {selectedItem.hpPercentBonus}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                    {t.masterBonuses}
                  </div>
                  <div className="space-y-2 text-sm text-[var(--foreground)]">
                    <div>{t.attack}: {selectedItem.masterAttackBonus}</div>
                    <div>{t.armor}: {selectedItem.masterArmorBonus}</div>
                    <div>{t.hp}: {selectedItem.masterHpBonus}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <DictionaryModal
        open={isCreateOpen}
        title={t.createTitle}
        closeLabel={t.close}
        onClose={() => !submitting && setCreateOpen(false)}
      >
        <div className="space-y-6">
          {renderForm(createForm, setCreateForm)}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCreate}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15"
            >
              {submitting ? t.creating : t.create}
            </button>
          </div>
        </div>
      </DictionaryModal>

      <DictionaryModal
        open={isEditOpen}
        title={t.editTitle}
        closeLabel={t.close}
        onClose={() => !submitting && setEditOpen(false)}
      >
        <div className="space-y-6">
          {renderForm(editForm, setEditForm)}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setEditOpen(false)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleUpdate}
              className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/15"
            >
              {submitting ? t.saving : t.save}
            </button>
          </div>
        </div>
      </DictionaryModal>
    </>
  );
}
