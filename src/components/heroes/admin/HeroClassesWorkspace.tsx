'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  EMPTY_LOCALIZED_TEXT,
  getLocalizedText,
  type CreateHeroClassRequest,
  type HeroClassItem,
  type HeroClassResponseDto,
  type HeroLocale,
  type LocalizedText,
  type UpdateHeroClassRequest,
  validateLocalizedTextPair,
  mapHeroClassDto,
} from '@/lib/types/hero';
import DictionaryModal from './DictionaryModal';
import LocalizedTextFields from './LocalizedTextFields';
import LocalizedTextareaFields from './LocalizedTextareaFields';

const API = '/api/v1/admin/heroes/hero-classes';

type FormState = {
  name: LocalizedText;
  baseName: LocalizedText;
  baseDescription: LocalizedText;
  masterName: LocalizedText;
  masterDescription: LocalizedText;
};

const EMPTY_FORM: FormState = {
  name: { ...EMPTY_LOCALIZED_TEXT },
  baseName: { ...EMPTY_LOCALIZED_TEXT },
  baseDescription: { ...EMPTY_LOCALIZED_TEXT },
  masterName: { ...EMPTY_LOCALIZED_TEXT },
  masterDescription: { ...EMPTY_LOCALIZED_TEXT },
};

export default function HeroClassesWorkspace() {
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const { messages } = useI18n();

  const locale: HeroLocale =
    messages.common.languageRussian === 'Русский' ? 'RU' : 'EN';

  const t = useMemo(
    () =>
      locale === 'RU'
        ? {
            sectionTitle: 'Классы героев',
            sectionSubtitle: 'Полный CRUD для классов героев',
            create: 'Создать',
            createTitle: 'Создать класс героя',
            editTitle: 'Изменить класс героя',
            detailsTitle: 'Детали класса героя',
            detailsSubtitle: 'Просмотр, изменение и удаление выбранной записи',
            edit: 'Изменить',
            delete: 'Удалить',
            cancel: 'Отмена',
            save: 'Сохранить',
            creating: 'Создание...',
            saving: 'Сохранение...',
            loadingList: 'Загрузка классов героев...',
            loadingDetails: 'Загрузка деталей...',
            empty: 'Классов героев пока нет',
            select: 'Выбери класс героя из списка',
            close: 'Закрыть',
            name: 'Название',
            baseTalentName: 'Название базового таланта',
            baseTalentDescription: 'Описание базового таланта',
            masterTalentName: 'Название мастер таланта',
            masterTalentDescription: 'Описание мастер таланта',
            deleteConfirm: (item: HeroClassItem) =>
              `Удалить класс героя #${item.id} (${item.name.ru})?`,
          }
        : {
            sectionTitle: 'Hero classes',
            sectionSubtitle: 'Full CRUD for hero classes',
            create: 'Create',
            createTitle: 'Create hero class',
            editTitle: 'Edit hero class',
            detailsTitle: 'Hero class details',
            detailsSubtitle: 'View, edit and delete selected item',
            edit: 'Edit',
            delete: 'Delete',
            cancel: 'Cancel',
            save: 'Save',
            creating: 'Creating...',
            saving: 'Saving...',
            loadingList: 'Loading hero classes...',
            loadingDetails: 'Loading details...',
            empty: 'No hero classes yet',
            select: 'Select a hero class from the list',
            close: 'Close',
            name: 'Name',
            baseTalentName: 'Base talent name',
            baseTalentDescription: 'Base talent description',
            masterTalentName: 'Master talent name',
            masterTalentDescription: 'Master talent description',
            deleteConfirm: (item: HeroClassItem) =>
              `Delete hero class #${item.id} (${item.name.en})?`,
          },
    [locale],
  );

  const [items, setItems] = useState<HeroClassItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<HeroClassItem | null>(null);

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
      const response = await apiJson<HeroClassResponseDto[]>(API);
      const mapped = response.map(mapHeroClassDto);
      setItems(mapped);

      if (mapped.length > 0) {
        setSelectedId((prev) => prev ?? mapped[0].id);
      } else {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Failed to load hero classes');
    } finally {
      setLoadingList(false);
    }
  }, [apiJson]);

  const loadDetails = useCallback(
    async (id: number) => {
      setLoadingDetails(true);
      setDetailsError(null);

      try {
        const response = await apiJson<HeroClassResponseDto>(`${API}/${id}`);
        setSelectedItem(mapHeroClassDto(response));
      } catch (error) {
        setDetailsError(error instanceof Error ? error.message : 'Failed to load hero class');
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

  const validateLocalized = (
    value: LocalizedText,
    ruLabel: string,
    enLabel: string,
  ): string | null => {
    return validateLocalizedTextPair(value, ruLabel, enLabel);
  };

  const validateForm = (form: FormState): string | null => {
    return (
      validateLocalized(form.name, 'Название RU', 'Name EN') ||
      validateLocalized(form.baseName, 'Название базового таланта RU', 'Base talent name EN') ||
      validateLocalized(
        form.baseDescription,
        'Описание базового таланта RU',
        'Base talent description EN',
      ) ||
      validateLocalized(
        form.masterName,
        'Название мастер таланта RU',
        'Master talent name EN',
      ) ||
      validateLocalized(
        form.masterDescription,
        'Описание мастер таланта RU',
        'Master talent description EN',
      )
    );
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: { ...EMPTY_LOCALIZED_TEXT },
      baseName: { ...EMPTY_LOCALIZED_TEXT },
      baseDescription: { ...EMPTY_LOCALIZED_TEXT },
      masterName: { ...EMPTY_LOCALIZED_TEXT },
      masterDescription: { ...EMPTY_LOCALIZED_TEXT },
    });
    setSubmitError(null);
  };

  const resetEditForm = (item: HeroClassItem) => {
    setEditForm({
      name: { ...item.name },
      baseName: { ...item.baseName },
      baseDescription: { ...item.baseDescription },
      masterName: { ...item.masterName },
      masterDescription: { ...item.masterDescription },
    });
    setSubmitError(null);
  };

  const buildPayload = (form: FormState): CreateHeroClassRequest => ({
    nameJson: {
      ru: form.name.ru.trim(),
      en: form.name.en.trim(),
    },
    baseNameJson: {
      ru: form.baseName.ru.trim(),
      en: form.baseName.en.trim(),
    },
    baseDescriptionJson: {
      ru: form.baseDescription.ru.trim(),
      en: form.baseDescription.en.trim(),
    },
    masterNameJson: {
      ru: form.masterName.ru.trim(),
      en: form.masterName.en.trim(),
    },
    masterDescriptionJson: {
      ru: form.masterDescription.ru.trim(),
      en: form.masterDescription.en.trim(),
    },
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
      const created = await apiPostJson<CreateHeroClassRequest, HeroClassResponseDto>(
        API,
        buildPayload(createForm),
      );

      const mapped = mapHeroClassDto(created);
      setItems((prev) => [...prev, mapped].sort((a, b) => a.id - b.id));
      setSelectedId(mapped.id);
      setSelectedItem(mapped);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create hero class');
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
      const updated = await apiPutJson<UpdateHeroClassRequest, HeroClassResponseDto>(
        `${API}/${selectedItem.id}`,
        buildPayload(editForm),
      );

      const mapped = mapHeroClassDto(updated);
      setItems((prev) => prev.map((item) => (item.id === mapped.id ? mapped : item)));
      setSelectedItem(mapped);
      setEditOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update hero class');
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
          : 'Failed to delete hero class';
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
                    <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                      {t.baseTalentName}: {getLocalizedText(item.baseName, locale)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--foreground-soft)]">
                      {t.masterTalentName}: {getLocalizedText(item.masterName, locale)}
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
                  {t.baseTalentName}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.baseName, locale)}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.baseTalentDescription}
                </div>
                <div className="text-sm text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.baseDescription, locale)}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.masterTalentName}
                </div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.masterName, locale)}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                  {t.masterTalentDescription}
                </div>
                <div className="text-sm text-[var(--foreground)]">
                  {getLocalizedText(selectedItem.masterDescription, locale)}
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

          <LocalizedTextFields
            value={createForm.baseName}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, baseName: value }))}
            ruLabel="Название базового таланта RU"
            enLabel="Base talent name EN"
          />

          <LocalizedTextareaFields
            value={createForm.baseDescription}
            onChange={(value) =>
              setCreateForm((prev) => ({ ...prev, baseDescription: value }))
            }
            ruLabel="Описание базового таланта RU"
            enLabel="Base talent description EN"
          />

          <LocalizedTextFields
            value={createForm.masterName}
            onChange={(value) => setCreateForm((prev) => ({ ...prev, masterName: value }))}
            ruLabel="Название мастер таланта RU"
            enLabel="Master talent name EN"
          />

          <LocalizedTextareaFields
            value={createForm.masterDescription}
            onChange={(value) =>
              setCreateForm((prev) => ({ ...prev, masterDescription: value }))
            }
            ruLabel="Описание мастер таланта RU"
            enLabel="Master talent description EN"
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

          <LocalizedTextFields
            value={editForm.baseName}
            onChange={(value) => setEditForm((prev) => ({ ...prev, baseName: value }))}
            ruLabel="Название базового таланта RU"
            enLabel="Base talent name EN"
          />

          <LocalizedTextareaFields
            value={editForm.baseDescription}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, baseDescription: value }))
            }
            ruLabel="Описание базового таланта RU"
            enLabel="Base talent description EN"
          />

          <LocalizedTextFields
            value={editForm.masterName}
            onChange={(value) => setEditForm((prev) => ({ ...prev, masterName: value }))}
            ruLabel="Название мастер таланта RU"
            enLabel="Master talent name EN"
          />

          <LocalizedTextareaFields
            value={editForm.masterDescription}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, masterDescription: value }))
            }
            ruLabel="Описание мастер таланта RU"
            enLabel="Master talent description EN"
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