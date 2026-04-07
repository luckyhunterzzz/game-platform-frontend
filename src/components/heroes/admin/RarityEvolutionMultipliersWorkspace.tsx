'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import { getLocaleText, resolveHeroLocale } from '@/lib/heroes-ui';
import {
  type CreateRarityEvolutionMultiplierRequest,
  type EvolutionStageCode,
  type HeroLocale,
  type RarityEvolutionMultiplierItem,
  type RarityEvolutionMultiplierResponseDto,
  type RarityItem,
  type RarityResponseDto,
  type UpdateRarityEvolutionMultiplierRequest,
  mapRarityDto,
  mapRarityEvolutionMultiplierDto,
} from '@/lib/types/hero';
import DictionaryModal from './DictionaryModal';

const API = '/api/v1/admin/heroes/rarity-evolution-multipliers';
const RARITIES_API = '/api/v1/admin/heroes/rarities';

type FormState = {
  rarityId: string;
  stageCode: EvolutionStageCode | '';
  attackMultiplier: string;
  armorMultiplier: string;
  hpMultiplier: string;
};

const EMPTY_FORM: FormState = {
  rarityId: '',
  stageCode: '',
  attackMultiplier: '',
  armorMultiplier: '',
  hpMultiplier: '',
};

const STAGE_CODES: EvolutionStageCode[] = [
  'ASCENSION_4_80',
  'ASCENSION_4_85',
  'ASCENSION_4_90',
];

export default function RarityEvolutionMultipliersWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { messages } = useI18n();
  const locale: HeroLocale = resolveHeroLocale(messages);

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: 'Множители стадий',
            sectionSubtitle: 'Коэффициенты для 4.80, 4.85 и 4.90',
            create: 'Создать',
            createTitle: 'Создать множитель',
            editTitle: 'Редактировать множитель',
            detailsTitle: 'Множитель стадии',
            detailsSubtitle: 'Просмотр, изменение и удаление выбранной записи',
            edit: 'Редактировать',
            delete: 'Удалить',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loadingList: 'Загрузка множителей...',
            loadingDetails: 'Загрузка множителя...',
            empty: 'Множителей пока нет',
            select: 'Выбери множитель из списка',
            close: 'Закрыть',
            rarity: 'Редкость',
            stage: 'Стадия',
            attack: 'Множитель атаки',
            armor: 'Множитель брони',
            hp: 'Множитель HP',
            selectRarity: 'Выберите редкость',
            selectStage: 'Выберите стадию',
            deleteConfirm: (item: RarityEvolutionMultiplierItem) =>
              `Удалить множитель #${item.id}?`,
            stageLabel: (stage: EvolutionStageCode) => {
              switch (stage) {
                case 'ASCENSION_4_80':
                  return '4.80';
                case 'ASCENSION_4_85':
                  return '4.85';
                case 'ASCENSION_4_90':
                  return '4.90';
              }
            },
          }
        : {
            sectionTitle: 'Stage multipliers',
            sectionSubtitle: 'Multipliers for 4.80, 4.85 and 4.90',
            create: 'Create',
            createTitle: 'Create multiplier',
            editTitle: 'Edit multiplier',
            detailsTitle: 'Stage multiplier',
            detailsSubtitle: 'View, update and delete the selected entry',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading multipliers...',
            loadingDetails: 'Loading multiplier...',
            empty: 'No multipliers yet',
            select: 'Select a multiplier from the list',
            close: 'Close',
            rarity: 'Rarity',
            stage: 'Stage',
            attack: 'Attack multiplier',
            armor: 'Armor multiplier',
            hp: 'HP multiplier',
            selectRarity: 'Select rarity',
            selectStage: 'Select stage',
            deleteConfirm: (item: RarityEvolutionMultiplierItem) =>
              `Delete multiplier #${item.id}?`,
            stageLabel: (stage: EvolutionStageCode) => {
              switch (stage) {
                case 'ASCENSION_4_80':
                  return '4.80';
                case 'ASCENSION_4_85':
                  return '4.85';
                case 'ASCENSION_4_90':
                  return '4.90';
              }
            },
          },
    [locale],
  );

  const [items, setItems] = useState<RarityEvolutionMultiplierItem[]>([]);
  const [rarities, setRarities] = useState<RarityItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<RarityEvolutionMultiplierItem | null>(
    null,
  );
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

  const resolveRarityName = useCallback(
    (rarityId: number) => {
      const rarity = rarities.find((item) => item.id === rarityId);
      if (!rarity) {
        return `#${rarityId}`;
      }

      return `${getLocaleText(rarity.name, locale)} (${rarity.stars}*)`;
    },
    [locale, rarities],
  );

  const loadRarities = useCallback(async () => {
    try {
      const response = await apiJson<RarityResponseDto[]>(RARITIES_API);
      setRarities(response.map(mapRarityDto));
    } catch {
      setRarities([]);
    }
  }, [apiJson]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);

    try {
      const response = await apiJson<RarityEvolutionMultiplierResponseDto[]>(API);
      const mapped = response.map(mapRarityEvolutionMultiplierDto);
      setItems(mapped);

      if (mapped.length > 0) {
        setSelectedId((prev) => prev ?? mapped[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load multipliers');
    } finally {
      setLoadingList(false);
    }
  }, [apiJson]);

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await apiJson<RarityEvolutionMultiplierResponseDto>(`${API}/${id}`);
        setSelectedItem(mapRarityEvolutionMultiplierDto(response));
      } catch (error) {
        setDetailsError(error instanceof Error ? error.message : 'Failed to load multiplier');
      } finally {
        setLoadingDetails(false);
      }
    },
    [apiJson],
  );

  useEffect(() => {
    void loadRarities();
    void loadList();
  }, [loadList, loadRarities]);

  useEffect(() => {
    if (selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [loadDetails, selectedId]);

  const validateFloat = (value: string, labelRu: string, labelEn: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return locale === 'RU' ? `${labelRu} обязателен` : `${labelEn} is required`;
    }

    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      return locale === 'RU'
        ? `${labelRu} должен быть числом`
        : `${labelEn} must be a number`;
    }

    if (parsed < 0) {
      return locale === 'RU'
        ? `${labelRu} не может быть меньше 0`
        : `${labelEn} cannot be less than 0`;
    }

    return null;
  };

  const validateForm = (form: FormState): string | null => {
    const rarityId = Number(form.rarityId);
    if (!Number.isInteger(rarityId) || rarityId <= 0) {
      return locale === 'RU' ? 'Редкость обязательна' : 'Rarity is required';
    }

    if (!form.stageCode) {
      return locale === 'RU' ? 'Стадия обязательна' : 'Stage is required';
    }

    return (
      validateFloat(form.attackMultiplier, 'Множитель атаки', 'Attack multiplier') ||
      validateFloat(form.armorMultiplier, 'Множитель брони', 'Armor multiplier') ||
      validateFloat(form.hpMultiplier, 'Множитель HP', 'HP multiplier')
    );
  };

  const resetCreateForm = () => {
    setCreateForm(EMPTY_FORM);
    setSubmitError(null);
  };

  const resetEditForm = (item: RarityEvolutionMultiplierItem) => {
    setEditForm({
      rarityId: String(item.rarityId),
      stageCode: item.stageCode,
      attackMultiplier: String(item.attackMultiplier),
      armorMultiplier: String(item.armorMultiplier),
      hpMultiplier: String(item.hpMultiplier),
    });
    setSubmitError(null);
  };

  const buildPayload = (
    form: FormState,
  ): CreateRarityEvolutionMultiplierRequest => ({
    rarityId: Number(form.rarityId),
    stageCode: form.stageCode as EvolutionStageCode,
    attackMultiplier: Number(form.attackMultiplier),
    armorMultiplier: Number(form.armorMultiplier),
    hpMultiplier: Number(form.hpMultiplier),
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
        CreateRarityEvolutionMultiplierRequest,
        RarityEvolutionMultiplierResponseDto
      >(API, buildPayload(createForm));

      const mapped = mapRarityEvolutionMultiplierDto(created);
      setItems((prev) => [...prev, mapped].sort((a, b) => a.id - b.id));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create multiplier');
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
        UpdateRarityEvolutionMultiplierRequest,
        RarityEvolutionMultiplierResponseDto
      >(`${API}/${selectedItem.id}`, buildPayload(editForm));

      const mapped = mapRarityEvolutionMultiplierDto(updated);
      setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setSelectedItem(mapped);
      setEditOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update multiplier');
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
          : 'Failed to delete multiplier';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
          {t.rarity}
        </span>
        <select
          value={form.rarityId}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, rarityId: event.target.value }))
          }
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="">{t.selectRarity}</option>
          {rarities.map((item) => (
            <option key={item.id} value={item.id}>
              {resolveRarityName(item.id)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[var(--foreground-soft)]">
          {t.stage}
        </span>
        <select
          value={form.stageCode}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              stageCode: event.target.value as EvolutionStageCode,
            }))
          }
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="">{t.selectStage}</option>
          {STAGE_CODES.map((stage) => (
            <option key={stage} value={stage}>
              {t.stageLabel(stage)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground-soft)]">
            {t.attack}
          </span>
          <input
            type="number"
            step="0.0001"
            value={form.attackMultiplier}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, attackMultiplier: event.target.value }))
            }
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground-soft)]">
            {t.armor}
          </span>
          <input
            type="number"
            step="0.0001"
            value={form.armorMultiplier}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, armorMultiplier: event.target.value }))
            }
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground-soft)]">
            {t.hp}
          </span>
          <input
            type="number"
            step="0.0001"
            value={form.hpMultiplier}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, hpMultiplier: event.target.value }))
            }
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
          />
        </label>
      </div>
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
                      {resolveRarityName(item.rarityId)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                      {t.stage}: {t.stageLabel(item.stageCode)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                      ATK {item.attackMultiplier} / ARM {item.armorMultiplier} / HP{' '}
                      {item.hpMultiplier}
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
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.rarity}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {resolveRarityName(selectedItem.rarityId)}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.stage}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {t.stageLabel(selectedItem.stageCode)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                    {t.attack}
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {selectedItem.attackMultiplier}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                    {t.armor}
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {selectedItem.armorMultiplier}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                    {t.hp}
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {selectedItem.hpMultiplier}
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
