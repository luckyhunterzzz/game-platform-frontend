'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  type CreateManaSpeedRequest,
  type HeroLocale,
  type LocalizedText,
  type ManaSpeedItem,
  type ManaSpeedResponseDto,
  type UpdateManaSpeedRequest,
  validateLocalizedTextPair,
  mapManaSpeedDto,
} from '@/lib/types/hero';
import DictionaryModal from './DictionaryModal';
import LocalizedTextFields from './LocalizedTextFields';
import LocalizedTextareaFields from './LocalizedTextareaFields';

const API = '/api/v1/admin/heroes/mana-speeds';

type FormState = {
  name: LocalizedText;
  description: LocalizedText;
};

const EMPTY_FORM: FormState = {
  name: { ...EMPTY_LOCALIZED_TEXT },
  description: { ...EMPTY_LOCALIZED_TEXT },
};

export default function ManaSpeedsWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { messages } = useI18n();

  const locale: HeroLocale =
    messages.common.languageRussian === 'Русский' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: 'Скорость маны',
            sectionSubtitle: 'Полный CRUD для скорости маны',
            create: 'Создать',
            createTitle: 'Создать скорость маны',
            editTitle: 'Изменить скорость маны',
            detailsTitle: 'Детали скорости маны',
            detailsSubtitle: 'Просмотр, изменение и удаление выбранной записи',
            edit: 'Изменить',
            delete: 'Удалить',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loadingList: 'Загрузка скорости маны...',
            loadingDetails: 'Загрузка деталей...',
            empty: 'Записей пока нет',
            select: 'Выбери запись из списка',
            close: 'Закрыть',
            name: 'Название',
            description: 'Описание',
            noDescription: 'Без описания',
            deleteConfirm: (item: ManaSpeedItem) =>
              `Удалить запись #${item.id} (${item.name.ru})?`,
          }
        : {
            sectionTitle: 'Mana speeds',
            sectionSubtitle: 'Full CRUD for mana speeds',
            create: 'Create',
            createTitle: 'Create mana speed',
            editTitle: 'Edit mana speed',
            detailsTitle: 'Mana speed details',
            detailsSubtitle: 'View, edit and delete selected item',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading mana speeds...',
            loadingDetails: 'Loading details...',
            empty: 'No entries yet',
            select: 'Select an entry from the list',
            close: 'Close',
            name: 'Name',
            description: 'Description',
            noDescription: 'No description',
            deleteConfirm: (item: ManaSpeedItem) =>
              `Delete entry #${item.id} (${item.name.en})?`,
          },
    [locale],
  );

  const [items, setItems] = useState<ManaSpeedItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ManaSpeedItem | null>(null);

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

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setListError(null);

    try {
      const response = await apiJson<ManaSpeedResponseDto[]>(API);
      const mapped = response.map(mapManaSpeedDto);
      setItems(mapped);

      if (mapped.length > 0) {
        setSelectedId((prev) => prev ?? mapped[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load mana speeds');
    } finally {
      setLoadingList(false);
    }
  }, [apiJson]);

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await apiJson<ManaSpeedResponseDto>(`${API}/${id}`);
        setSelectedItem(mapManaSpeedDto(response));
      } catch (error) {
        setDetailsError(error instanceof Error ? error.message : 'Failed to load mana speed');
      } finally {
        setLoadingDetails(false);
      }
    },
    [apiJson],
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId !== null) {
      void loadDetails(selectedId);
    }
  }, [selectedId, loadDetails]);

  const validateForm = (form: FormState): string | null => {
    const nameError = validateLocalizedTextPair(form.name, 'Название RU', 'Name EN');
    if (nameError) {
      return nameError;
    }

    if (form.description.ru.trim() || form.description.en.trim()) {
      return validateLocalizedTextPair(form.description, 'Описание RU', 'Description EN');
    }

    return null;
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: { ...EMPTY_LOCALIZED_TEXT },
      description: { ...EMPTY_LOCALIZED_TEXT },
    });
    setSubmitError(null);
  };

  const resetEditForm = (item: ManaSpeedItem) => {
    setEditForm({
      name: { ...item.name },
      description: item.description
        ? { ...item.description }
        : { ...EMPTY_LOCALIZED_TEXT },
    });
    setSubmitError(null);
  };

  const buildPayload = (form: FormState): CreateManaSpeedRequest => ({
    nameJson: {
      ru: form.name.ru.trim(),
      en: form.name.en.trim(),
    },
    descriptionJson:
      form.description.ru.trim() || form.description.en.trim()
        ? {
            ru: form.description.ru.trim(),
            en: form.description.en.trim(),
          }
        : null,
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
      const created = await apiPostJson<CreateManaSpeedRequest, ManaSpeedResponseDto>(
        API,
        buildPayload(createForm),
      );

      const mapped = mapManaSpeedDto(created);
      setItems((prev) => [...prev, mapped].sort((a, b) => a.id - b.id));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create mana speed');
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
      const updated = await apiPutJson<UpdateManaSpeedRequest, ManaSpeedResponseDto>(
        `${API}/${selectedItem.id}`,
        buildPayload(editForm),
      );

      const mapped = mapManaSpeedDto(updated);
      setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setSelectedItem(mapped);
      setEditOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update mana speed');
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
          : 'Failed to delete mana speed';
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
                      {getLocalizedText(item.name, locale)}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-[var(--foreground-soft)]">
                      {item.description
                        ? getLocalizedText(item.description, locale)
                        : t.noDescription}
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
                  ID
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {selectedItem.id}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.name}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.name, locale)}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.description}
                </div>
                <div className="text-sm text-[var(--foreground)]">
                  {selectedItem.description
                    ? getLocalizedText(selectedItem.description, locale)
                    : t.noDescription}
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

          <LocalizedTextFields
            value={createForm.name}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, name: value }))}
            ruLabel="Название RU"
            enLabel="Name EN"
          />

          <LocalizedTextareaFields
            value={createForm.description}
            onChange={(value) =>
              setCreateForm((prev) => ({ ...prev, description: value }))
            }
            ruLabel="Описание RU"
            enLabel="Description EN"
          />

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

          <LocalizedTextFields
            value={editForm.name}
            onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
            ruLabel="Название RU"
            enLabel="Name EN"
          />

          <LocalizedTextareaFields
            value={editForm.description}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, description: value }))
            }
            ruLabel="Описание RU"
            enLabel="Description EN"
          />

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