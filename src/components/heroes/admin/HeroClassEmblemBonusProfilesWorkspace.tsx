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
  attackBonus: string;
  armorBonus: string;
  hpBonus: string;
};

const EMPTY_FORM: FormState = {
  heroClassId: '',
  pathType: '',
  attackBonus: '',
  armorBonus: '',
  hpBonus: '',
};

const PATH_TYPES: EmblemPathType[] = ['ATTACK', 'ARMOR', 'HP'];

export default function HeroClassEmblemBonusProfilesWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { messages } = useI18n();

  const locale: HeroLocale =
    messages.common.languageRussian === 'Русский' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: 'Профили эмблем',
            sectionSubtitle: 'Полный CRUD для профилей эмблем',
            create: 'Создать',
            createTitle: 'Создать профиль эмблемы',
            editTitle: 'Изменить профиль эмблемы',
            detailsTitle: 'Детали профиля эмблемы',
            detailsSubtitle: 'Просмотр, изменение и удаление выбранной записи',
            edit: 'Изменить',
            delete: 'Удалить',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loadingList: 'Загрузка профилей...',
            loadingDetails: 'Загрузка деталей...',
            empty: 'Профилей пока нет',
            select: 'Выбери профиль из списка',
            close: 'Закрыть',
            heroClass: 'Класс героя',
            pathType: 'Путь',
            attackBonus: 'Бонус атаки',
            armorBonus: 'Бонус брони',
            hpBonus: 'Бонус HP',
            selectHeroClass: 'Выбери класс героя',
            selectPathType: 'Выбери путь',
            deleteConfirm: (item: HeroClassEmblemBonusProfileItem) =>
              `Удалить профиль эмблемы #${item.id}?`,
            pathLabel: (path: EmblemPathType) =>
              path === 'ATTACK' ? 'Атака' : path === 'ARMOR' ? 'Броня' : 'HP',
          }
        : {
            sectionTitle: 'Emblem profiles',
            sectionSubtitle: 'Full CRUD for emblem profiles',
            create: 'Create',
            createTitle: 'Create emblem profile',
            editTitle: 'Edit emblem profile',
            detailsTitle: 'Emblem profile details',
            detailsSubtitle: 'View, edit and delete selected item',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading profiles...',
            loadingDetails: 'Loading details...',
            empty: 'No profiles yet',
            select: 'Select a profile from the list',
            close: 'Close',
            heroClass: 'Hero class',
            pathType: 'Path type',
            attackBonus: 'Attack bonus',
            armorBonus: 'Armor bonus',
            hpBonus: 'HP bonus',
            selectHeroClass: 'Select hero class',
            selectPathType: 'Select path type',
            deleteConfirm: (item: HeroClassEmblemBonusProfileItem) =>
              `Delete emblem profile #${item.id}?`,
            pathLabel: (path: EmblemPathType) =>
              path === 'ATTACK' ? 'Attack' : path === 'ARMOR' ? 'Armor' : 'HP',
          },
    [locale],
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

  const resolveHeroClassName = (heroClassId: number) => {
    const heroClass = heroClasses.find((item) => item.id === heroClassId);
    return heroClass ? getLocalizedText(heroClass.name, locale) : `#${heroClassId}`;
  };

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
      setListError(
        error instanceof Error ? error.message : 'Failed to load emblem bonus profiles',
      );
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
          error instanceof Error ? error.message : 'Failed to load emblem bonus profile',
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
  }, [selectedId, loadDetails]);

  const validateForm = (form: FormState): string | null => {
    const heroClassId = Number(form.heroClassId);
    if (!Number.isInteger(heroClassId) || heroClassId <= 0) {
      return locale === 'RU' ? 'Класс героя обязателен' : 'Hero class is required';
    }

    if (!form.pathType) {
      return locale === 'RU' ? 'Путь обязателен' : 'Path type is required';
    }

    const attackBonus = Number(form.attackBonus);
    const armorBonus = Number(form.armorBonus);
    const hpBonus = Number(form.hpBonus);

    if (!Number.isInteger(attackBonus)) {
      return locale === 'RU'
        ? 'Бонус атаки должен быть целым числом'
        : 'Attack bonus must be an integer';
    }

    if (!Number.isInteger(armorBonus)) {
      return locale === 'RU'
        ? 'Бонус брони должен быть целым числом'
        : 'Armor bonus must be an integer';
    }

    if (!Number.isInteger(hpBonus)) {
      return locale === 'RU'
        ? 'Бонус HP должен быть целым числом'
        : 'HP bonus must be an integer';
    }

    return null;
  };

  const resetCreateForm = () => {
    setCreateForm(EMPTY_FORM);
    setSubmitError(null);
  };

  const resetEditForm = (item: HeroClassEmblemBonusProfileItem) => {
    setEditForm({
      heroClassId: String(item.heroClassId),
      pathType: item.pathType,
      attackBonus: String(item.attackBonus),
      armorBonus: String(item.armorBonus),
      hpBonus: String(item.hpBonus),
    });
    setSubmitError(null);
  };

  const buildPayload = (
    form: FormState,
  ): CreateHeroClassEmblemBonusProfileRequest => ({
    heroClassId: Number(form.heroClassId),
    pathType: form.pathType as EmblemPathType,
    attackBonus: Number(form.attackBonus),
    armorBonus: Number(form.armorBonus),
    hpBonus: Number(form.hpBonus),
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
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create emblem bonus profile',
      );
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
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update emblem bonus profile',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    if (!window.confirm(t.deleteConfirm(selectedItem))) {
      return;
    }

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
          : 'Failed to delete emblem bonus profile';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
                      ATK {item.attackBonus} / ARM {item.armorBonus} / HP {item.hpBonus}
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

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.attackBonus}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {selectedItem.attackBonus}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.armorBonus}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {selectedItem.armorBonus}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:col-span-2">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.hpBonus}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {selectedItem.hpBonus}
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
              value={createForm.heroClassId}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, heroClassId: e.target.value }))
              }
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
            >
              <option value="">{t.selectHeroClass}</option>
              {heroClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {getLocalizedText(item.name, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground-soft)]">
              {t.pathType}
            </span>
            <select
              value={createForm.pathType}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  pathType: e.target.value as EmblemPathType,
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">
                {t.attackBonus}
              </span>
              <input
                type="number"
                value={createForm.attackBonus}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, attackBonus: e.target.value }))
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">
                {t.armorBonus}
              </span>
              <input
                type="number"
                value={createForm.armorBonus}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, armorBonus: e.target.value }))
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">
                {t.hpBonus}
              </span>
              <input
                type="number"
                value={createForm.hpBonus}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, hpBonus: e.target.value }))
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
              />
            </label>
          </div>

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
              value={editForm.heroClassId}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, heroClassId: e.target.value }))
              }
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
            >
              <option value="">{t.selectHeroClass}</option>
              {heroClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {getLocalizedText(item.name, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground-soft)]">
              {t.pathType}
            </span>
            <select
              value={editForm.pathType}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  pathType: e.target.value as EmblemPathType,
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">
                {t.attackBonus}
              </span>
              <input
                type="number"
                value={editForm.attackBonus}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, attackBonus: e.target.value }))
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">
                {t.armorBonus}
              </span>
              <input
                type="number"
                value={editForm.armorBonus}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, armorBonus: e.target.value }))
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground-soft)]">
                {t.hpBonus}
              </span>
              <input
                type="number"
                value={editForm.hpBonus}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, hpBonus: e.target.value }))
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
              />
            </label>
          </div>

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