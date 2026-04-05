'use client';

import { useEffect, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB, ru } from 'date-fns/locale';

import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import { EMPTY_LOCALIZED_TEXT, type LocalizedText } from '@/lib/types/hero';
import {
  type ImageUploadResponse,
  type PublicationAdminDetails,
  type PublicationUpsertRequest,
  PublicationStatus,
  PublicationType,
} from '@/lib/types/publication';

type CreatePublicationModalProps = {
  open: boolean;
  mode?: 'create' | 'edit';
  initialPublication?: PublicationAdminDetails | null;
  onClose: () => void;
  onSaved: (mode: 'create' | 'edit') => void | Promise<void>;
};

const AVAILABLE_CREATE_STATUSES = [
  PublicationStatus.PUBLISHED,
  PublicationStatus.DRAFT,
  PublicationStatus.SCHEDULED,
];

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

registerLocale('ru', ru);
registerLocale('en-GB', enGB);

function cloneLocalizedText(value?: LocalizedText | null): LocalizedText {
  return {
    ru: value?.ru ?? '',
    en: value?.en ?? '',
  };
}

function createDefaultForm(): PublicationUpsertRequest {
  return {
    titleJson: cloneLocalizedText(EMPTY_LOCALIZED_TEXT),
    contentJson: cloneLocalizedText(EMPTY_LOCALIZED_TEXT),
    type: PublicationType.NEWS,
    status: PublicationStatus.PUBLISHED,
    pinned: false,
    publishedAt: null,
    imageBucket: null,
    imageObjectKey: null,
  };
}

function toIsoStringOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function fromIsoStringOrNull(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 45, 0, 0);
  return result;
}

function roundUpToNextQuarterHour(date: Date): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);

  const minutes = result.getMinutes();
  const remainder = minutes % 15;

  if (remainder !== 0) {
    result.setMinutes(minutes + (15 - remainder));
  }

  return result;
}

function mapLocaleToDateFormat(locale: 'ru' | 'en'): string {
  return locale === 'ru' ? 'dd.MM.yyyy HH:mm' : 'dd/MM/yyyy HH:mm';
}

function mapLocaleToDatePickerLocale(locale: 'ru' | 'en'): 'ru' | 'en-GB' {
  return locale === 'ru' ? 'ru' : 'en-GB';
}

function getImageSectionText(locale: 'ru' | 'en') {
  if (locale === 'ru') {
    return {
      label: 'Картинка',
      hint: 'Поддерживаются PNG, JPEG, WEBP. Максимум 5 MB.',
      uploading: 'Загрузка изображения...',
      uploaded: 'Изображение загружено',
      remove: 'Удалить изображение',
      invalidType: 'Можно загружать только PNG, JPEG или WEBP.',
      invalidSize: 'Размер изображения не должен превышать 5 MB.',
      uploadError: 'Не удалось загрузить изображение.',
      uploadErrorBlock:
        'Сначала исправьте ошибку загрузки изображения: удалите файл или загрузите новый.',
    };
  }

  return {
    label: 'Image',
    hint: 'Supported: PNG, JPEG, WEBP. Maximum size: 5 MB.',
    uploading: 'Uploading image...',
    uploaded: 'Image uploaded',
    remove: 'Remove image',
    invalidType: 'Only PNG, JPEG or WEBP images are allowed.',
    invalidSize: 'Image size must not exceed 5 MB.',
    uploadError: 'Failed to upload image.',
    uploadErrorBlock: 'Fix the image upload error first: remove the file or upload another one.',
  };
}

function getModalText(locale: 'ru' | 'en', mode: 'create' | 'edit') {
  if (locale === 'ru') {
    return {
      title: mode === 'create' ? 'Создать публикацию' : 'Редактировать публикацию',
      submit: mode === 'create' ? 'Создать' : 'Сохранить',
      submitting: mode === 'create' ? 'Создание...' : 'Сохранение...',
      error:
        mode === 'create'
          ? 'Не удалось создать публикацию.'
          : 'Не удалось обновить публикацию.',
      titleRu: 'Заголовок RU',
      titleEn: 'Title EN',
      titleRuPlaceholder: 'Введите заголовок на русском',
      titleEnPlaceholder: 'Enter title in English',
      contentRu: 'Текст RU',
      contentEn: 'Content EN',
      contentRuPlaceholder: 'Введите текст публикации на русском',
      contentEnPlaceholder: 'Enter publication text in English',
      titlesBlock: 'Локализованные заголовки',
      contentBlock: 'Локализованный текст',
      titleRequired: 'Нужно заполнить хотя бы один заголовок.',
    };
  }

  return {
    title: mode === 'create' ? 'Create publication' : 'Edit publication',
    submit: mode === 'create' ? 'Create' : 'Save',
    submitting: mode === 'create' ? 'Creating...' : 'Saving...',
    error: mode === 'create' ? 'Failed to create publication.' : 'Failed to update publication.',
    titleRu: 'Title RU',
    titleEn: 'Title EN',
    titleRuPlaceholder: 'Enter title in Russian',
    titleEnPlaceholder: 'Enter title in English',
    contentRu: 'Content RU',
    contentEn: 'Content EN',
    contentRuPlaceholder: 'Enter publication text in Russian',
    contentEnPlaceholder: 'Enter publication text in English',
    titlesBlock: 'Localized titles',
    contentBlock: 'Localized content',
    titleRequired: 'At least one title is required.',
  };
}

function toFormFromPublication(publication: PublicationAdminDetails): PublicationUpsertRequest {
  return {
    titleJson: cloneLocalizedText(publication.titleJson),
    contentJson: cloneLocalizedText(publication.contentJson),
    type: publication.type,
    status: publication.status,
    pinned: publication.pinned,
    publishedAt: publication.publishedAt ?? null,
    imageBucket: publication.imageBucket ?? null,
    imageObjectKey: publication.imageObjectKey ?? null,
  };
}

function getFileNameFromObjectKey(value?: string | null): string | null {
  if (!value) return null;
  const parts = value.split('/');
  return parts.at(-1) ?? value;
}

export default function CreatePublicationModal({
  open,
  mode = 'create',
  initialPublication = null,
  onClose,
  onSaved,
}: CreatePublicationModalProps) {
  const { apiPostJson, apiPostFormData, apiPutJson } = useApi();
  const { locale, messages } = useI18n();
  const imageText = getImageSectionText(locale);
  const modalText = getModalText(locale, mode);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<PublicationUpsertRequest>(createDefaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isScheduled = form.status === PublicationStatus.SCHEDULED;
  const scheduledDate = fromIsoStringOrNull(form.publishedAt);

  const now = new Date();
  const roundedNow = roundUpToNextQuarterHour(now);

  const minSelectableTime =
    scheduledDate && !isSameDay(scheduledDate, now)
      ? startOfDay(scheduledDate)
      : roundedNow;

  const maxSelectableTime = scheduledDate ? endOfDay(scheduledDate) : endOfDay(now);

  const hasTitle = form.titleJson.ru.trim().length > 0 || form.titleJson.en.trim().length > 0;
  const canSubmit =
    !submitting &&
    !uploadingImage &&
    !imageUploadError &&
    hasTitle &&
    (!isScheduled || Boolean(form.publishedAt));

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const revokePreviewUrl = (url: string | null) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetUploadedImageState = () => {
    revokePreviewUrl(uploadedImageUrl);
    setUploadedImageUrl(null);
    setUploadedFileName(null);
    setImageUploadError(null);

    setForm((prev) => ({
      ...prev,
      imageBucket: null,
      imageObjectKey: null,
    }));

    resetFileInput();
  };

  useEffect(() => {
    return () => {
      revokePreviewUrl(uploadedImageUrl);
    };
  }, [uploadedImageUrl]);

  const resetForm = () => {
    revokePreviewUrl(uploadedImageUrl);
    setForm(createDefaultForm());
    setUploadedImageUrl(null);
    setUploadedFileName(null);
    setImageUploadError(null);
    setErrorMessage(null);
    setUploadingImage(false);
    resetFileInput();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    revokePreviewUrl(uploadedImageUrl);

    if (mode === 'edit' && initialPublication) {
      setForm(toFormFromPublication(initialPublication));
      setUploadedImageUrl(initialPublication.imageUrl ?? null);
      setUploadedFileName(getFileNameFromObjectKey(initialPublication.imageObjectKey));
      setImageUploadError(null);
      setErrorMessage(null);
      setUploadingImage(false);
      resetFileInput();
      return;
    }

    setForm(createDefaultForm());
    setUploadedImageUrl(null);
    setUploadedFileName(null);
    setImageUploadError(null);
    setErrorMessage(null);
    setUploadingImage(false);
    resetFileInput();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialPublication]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLocalizedChange = (
    key: 'titleJson' | 'contentJson',
    localeKey: keyof LocalizedText,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [localeKey]: value,
      },
    }));
  };

  const handleChange = <K extends keyof PublicationUpsertRequest>(
    key: K,
    value: PublicationUpsertRequest[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleStatusChange = (status: PublicationStatus) => {
    setForm((prev) => ({
      ...prev,
      status,
      publishedAt:
        status === PublicationStatus.SCHEDULED
          ? prev.publishedAt ?? toIsoStringOrNull(roundUpToNextQuarterHour(new Date()))
          : null,
    }));
  };

  const clearUploadedImage = () => {
    resetUploadedImageState();
    setErrorMessage(null);
  };

  const handleImageSelected = async (file: File | null) => {
    if (!file) {
      resetUploadedImageState();
      return;
    }

    setErrorMessage(null);
    setImageUploadError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      resetUploadedImageState();
      setImageUploadError(imageText.invalidType);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      resetUploadedImageState();
      setImageUploadError(imageText.invalidSize);
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiPostFormData<ImageUploadResponse>(
        '/api/v1/admin/media/images',
        formData,
      );

      revokePreviewUrl(uploadedImageUrl);

      setUploadedImageUrl(response.url);
      setUploadedFileName(file.name);
      setImageUploadError(null);

      setForm((prev) => ({
        ...prev,
        imageBucket: response.bucket,
        imageObjectKey: response.objectKey,
      }));
    } catch (error) {
      revokePreviewUrl(uploadedImageUrl);

      setUploadedImageUrl(null);
      setUploadedFileName(file.name);
      setForm((prev) => ({
        ...prev,
        imageBucket: null,
        imageObjectKey: null,
      }));

      if (error instanceof ApiError) {
        setImageUploadError(error.message);
      } else if (error instanceof Error) {
        setImageUploadError(error.message);
      } else {
        setImageUploadError(imageText.uploadError);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting || uploadingImage || imageUploadError) {
      if (imageUploadError) {
        setErrorMessage(imageText.uploadErrorBlock);
      }
      return;
    }

    if (!hasTitle) {
      setErrorMessage(modalText.titleRequired);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      if (form.status === PublicationStatus.SCHEDULED) {
        if (!form.publishedAt) {
          setErrorMessage(messages.createPublicationModal.scheduledDateRequired);
          return;
        }

        const scheduledAt = new Date(form.publishedAt);

        if (Number.isNaN(scheduledAt.getTime())) {
          setErrorMessage(messages.createPublicationModal.scheduledDateInvalid);
          return;
        }

        if (scheduledAt <= new Date()) {
          setErrorMessage(messages.createPublicationModal.scheduledDateFuture);
          return;
        }
      }

      const payload: PublicationUpsertRequest = {
        ...form,
        titleJson: cloneLocalizedText(form.titleJson),
        contentJson: cloneLocalizedText(form.contentJson),
        publishedAt: form.status === PublicationStatus.SCHEDULED ? form.publishedAt : null,
      };

      if (mode === 'edit' && initialPublication) {
        await apiPutJson<PublicationUpsertRequest, unknown>(
          `/api/v1/admin/publications/${initialPublication.id}`,
          payload,
        );
      } else {
        await apiPostJson<PublicationUpsertRequest, unknown>(
          '/api/v1/admin/publications',
          payload,
        );
      }

      resetForm();
      await onSaved(mode);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(modalText.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 px-4 py-4 sm:py-6">
      <div className="flex min-h-full items-center justify-center">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <h3 className="text-2xl font-semibold text-[var(--foreground)]">
              {modalText.title}
            </h3>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            >
              {messages.createPublicationModal.close}
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                  {modalText.titlesBlock}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                      {modalText.titleRu}
                    </label>
                    <input
                      value={form.titleJson.ru}
                      onChange={(e) => handleLocalizedChange('titleJson', 'ru', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-soft)]"
                      placeholder={modalText.titleRuPlaceholder}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                      {modalText.titleEn}
                    </label>
                    <input
                      value={form.titleJson.en}
                      onChange={(e) => handleLocalizedChange('titleJson', 'en', e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-soft)]"
                      placeholder={modalText.titleEnPlaceholder}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                  {modalText.contentBlock}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                      {modalText.contentRu}
                    </label>
                    <textarea
                      value={form.contentJson.ru}
                      onChange={(e) => handleLocalizedChange('contentJson', 'ru', e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-soft)]"
                      placeholder={modalText.contentRuPlaceholder}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                      {modalText.contentEn}
                    </label>
                    <textarea
                      value={form.contentJson.en}
                      onChange={(e) => handleLocalizedChange('contentJson', 'en', e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-soft)]"
                      placeholder={modalText.contentEnPlaceholder}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                  {imageText.label}
                </label>

                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => void handleImageSelected(e.target.files?.[0] ?? null)}
                    disabled={uploadingImage || submitting}
                    className="block w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-400/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-300"
                  />

                  <p className="text-xs text-[var(--foreground-soft)]">{imageText.hint}</p>

                  {uploadingImage && (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                      {imageText.uploading}
                    </div>
                  )}

                  {imageUploadError && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                      {imageUploadError}
                    </div>
                  )}

                  {uploadedImageUrl && (
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedImageUrl}
                        alt={uploadedFileName ?? 'Uploaded preview'}
                        className="max-h-72 w-full object-contain bg-black/20"
                      />

                      <div className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {imageText.uploaded}
                          </p>
                          <p className="truncate text-xs text-[var(--foreground-soft)]">
                            {uploadedFileName ?? ''}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={clearUploadedImage}
                          disabled={uploadingImage || submitting}
                          className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {imageText.remove}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                    {messages.createPublicationModal.typeLabel}
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value as PublicationType)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] outline-none"
                  >
                    {Object.values(PublicationType).map((type) => (
                      <option key={type} value={type}>
                        {messages.publicationType[type]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                    {messages.createPublicationModal.statusLabel}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => handleStatusChange(e.target.value as PublicationStatus)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] outline-none"
                  >
                    {AVAILABLE_CREATE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {messages.publicationStatus[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isScheduled && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground-muted)]">
                    {messages.createPublicationModal.scheduledAtLabel}
                  </label>

                  <DatePicker
                    selected={scheduledDate}
                    onChange={(date: Date | null) =>
                      handleChange('publishedAt', toIsoStringOrNull(date))
                    }
                    locale={mapLocaleToDatePickerLocale(locale)}
                    showTimeSelect
                    timeIntervals={15}
                    timeCaption={messages.createPublicationModal.timeCaption}
                    dateFormat={mapLocaleToDateFormat(locale)}
                    minDate={now}
                    minTime={minSelectableTime}
                    maxTime={maxSelectableTime}
                    placeholderText={messages.createPublicationModal.scheduledPlaceholder}
                    wrapperClassName="gp-datepicker-wrapper"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-soft)]"
                    calendarClassName="gp-datepicker"
                    popperClassName="gp-datepicker-popper"
                  />

                  <p className="mt-2 text-xs text-[var(--foreground-soft)]">
                    {messages.createPublicationModal.scheduledHint}
                  </p>
                </div>
              )}

              <label className="flex items-center gap-3 text-sm text-[var(--foreground-muted)]">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => handleChange('pinned', e.target.checked)}
                />
                {messages.createPublicationModal.pinnedLabel}
              </label>

              {errorMessage && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            >
              {messages.createPublicationModal.cancel}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? modalText.submitting : modalText.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
