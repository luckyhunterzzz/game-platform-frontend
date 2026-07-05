'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import type { HeroLocale, LocalizedText } from '@/lib/types/hero';
import type { ImageUploadResponse } from '@/lib/types/publication';
import { ApiError, useApi } from '@/lib/use-api';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_API = '/api/v1/admin/media/images/events';

const EMPTY_LOCALIZED: LocalizedText = {
  ru: '',
  en: '',
};

type LocalizedImageValue = {
  imageBucketJson?: LocalizedText | null;
  imageObjectKeyJson?: LocalizedText | null;
  imageUrlJson?: LocalizedText | null;
};

type ImageLocale = 'RU' | 'EN';

function getLocalizedValue(value: LocalizedText | null | undefined, imageLocale: ImageLocale): string | null {
  if (!value) {
    return null;
  }

  return imageLocale === 'RU' ? value.ru || null : value.en || null;
}

function setLocalizedValue(
  value: LocalizedText | null | undefined,
  imageLocale: ImageLocale,
  next: string | null,
): LocalizedText | null {
  const current = value ? { ...value } : { ...EMPTY_LOCALIZED };

  if (imageLocale === 'RU') {
    current.ru = next ?? '';
  } else {
    current.en = next ?? '';
  }

  if (!current.ru && !current.en) {
    return null;
  }

  return current;
}

export default function LocalizedEventImageUploadField({
  locale,
  value,
  onChange,
  onUploadingChange,
  onErrorChange,
  disabled = false,
}: {
  locale: HeroLocale;
  value: LocalizedImageValue;
  onChange: (value: LocalizedImageValue) => void;
  onUploadingChange: (uploading: boolean) => void;
  onErrorChange: (error: string | null) => void;
  disabled?: boolean;
}) {
  const { apiPostFormData } = useApi();
  const ruInputRef = useRef<HTMLInputElement | null>(null);
  const enInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingByLocale, setUploadingByLocale] = useState<Record<ImageLocale, boolean>>({ RU: false, EN: false });
  const [fileNames, setFileNames] = useState<Record<ImageLocale, string | null>>({ RU: null, EN: null });
  const [errors, setErrors] = useState<Record<ImageLocale, string | null>>({ RU: null, EN: null });

  const isUploading = uploadingByLocale.RU || uploadingByLocale.EN;

  const text = useMemo(() => {
    if (locale === 'RU') {
      return {
        title: 'Изображения блока',
        hint: 'Можно загрузить разные изображения для русской и английской локали.',
        choose: 'Выбрать файл',
        remove: 'Удалить изображение',
        noFile: 'Файл не выбран',
        uploaded: 'Изображение загружено',
        attached: 'Изображение уже привязано',
        invalidType: 'Можно загружать только PNG, JPEG или WEBP.',
        invalidSize: 'Размер изображения не должен превышать 5 MB.',
        fallbackError: 'Не удалось загрузить изображение.',
        uploading: 'Загрузка изображения...',
      };
    }

    return {
      title: 'Block images',
      hint: 'You can upload different images for Russian and English locales.',
      choose: 'Choose file',
      remove: 'Remove image',
      noFile: 'No file selected',
      uploaded: 'Image uploaded',
      attached: 'Image is already attached',
      invalidType: 'Only PNG, JPEG or WEBP images are allowed.',
      invalidSize: 'Image size must not exceed 5 MB.',
      fallbackError: 'Failed to upload image.',
      uploading: 'Uploading image...',
    };
  }, [locale]);

  useEffect(() => {
    setFileNames({
      RU: getLocalizedValue(value.imageObjectKeyJson, 'RU')?.split('/').at(-1) ?? null,
      EN: getLocalizedValue(value.imageObjectKeyJson, 'EN')?.split('/').at(-1) ?? null,
    });
  }, [value.imageObjectKeyJson]);

  useEffect(() => {
    onUploadingChange(isUploading);
  }, [isUploading, onUploadingChange]);

  useEffect(() => {
    onErrorChange(errors.RU ?? errors.EN ?? null);
  }, [errors, onErrorChange]);

  const resetInput = (imageLocale: ImageLocale) => {
    const input = imageLocale === 'RU' ? ruInputRef.current : enInputRef.current;
    if (input) {
      input.value = '';
    }
  };

  const clearLocaleImage = (imageLocale: ImageLocale) => {
    setErrors((prev) => ({ ...prev, [imageLocale]: null }));
    setFileNames((prev) => ({ ...prev, [imageLocale]: null }));
    resetInput(imageLocale);
    onChange({
      imageBucketJson: setLocalizedValue(value.imageBucketJson, imageLocale, null),
      imageObjectKeyJson: setLocalizedValue(value.imageObjectKeyJson, imageLocale, null),
      imageUrlJson: setLocalizedValue(value.imageUrlJson, imageLocale, null),
    });
  };

  const handleFileSelected = async (imageLocale: ImageLocale, file: File | null) => {
    if (!file) {
      clearLocaleImage(imageLocale);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      clearLocaleImage(imageLocale);
      setErrors((prev) => ({ ...prev, [imageLocale]: text.invalidType }));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      clearLocaleImage(imageLocale);
      setErrors((prev) => ({ ...prev, [imageLocale]: text.invalidSize }));
      return;
    }

    setErrors((prev) => ({ ...prev, [imageLocale]: null }));
    setUploadingByLocale((prev) => ({ ...prev, [imageLocale]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiPostFormData<ImageUploadResponse>(IMAGE_UPLOAD_API, formData);
      setFileNames((prev) => ({ ...prev, [imageLocale]: file.name }));
      onChange({
        imageBucketJson: setLocalizedValue(value.imageBucketJson, imageLocale, response.bucket),
        imageObjectKeyJson: setLocalizedValue(value.imageObjectKeyJson, imageLocale, response.objectKey),
        imageUrlJson: setLocalizedValue(value.imageUrlJson, imageLocale, response.url),
      });
    } catch (error) {
      clearLocaleImage(imageLocale);
      const message = error instanceof ApiError || error instanceof Error ? error.message : text.fallbackError;
      setErrors((prev) => ({ ...prev, [imageLocale]: message }));
    } finally {
      setUploadingByLocale((prev) => ({ ...prev, [imageLocale]: false }));
    }
  };

  const renderUpload = (imageLocale: ImageLocale, inputRef: RefObject<HTMLInputElement | null>) => {
    const imageUrl = getLocalizedValue(value.imageUrlJson, imageLocale);
    const fileName = fileNames[imageLocale];
    const error = errors[imageLocale];
    const localeLabel = imageLocale === 'RU' ? 'RU' : 'EN';

    return (
      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="text-sm font-semibold text-[var(--foreground)]">{localeLabel}</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void handleFileSelected(imageLocale, event.target.files?.[0] ?? null)}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {text.choose}
          </button>
          <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-soft)]">{fileName ?? text.noFile}</span>
        </div>

        {uploadingByLocale[imageLocale] ? (
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-300">{text.uploading}</div>
        ) : null}

        {error ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</div> : null}

        {imageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`Block image ${localeLabel}`} className="max-h-64 w-full object-contain bg-black/10" />
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">{text.uploaded}</p>
                <p className="truncate text-xs text-[var(--foreground-soft)]">{fileName ?? ''}</p>
              </div>
              <button
                type="button"
                onClick={() => clearLocaleImage(imageLocale)}
                disabled={disabled || isUploading}
                className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text.remove}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-[var(--foreground-soft)]">{text.title}</div>
        <p className="mt-1 text-xs text-[var(--foreground-soft)]">{text.hint}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {renderUpload('RU', ruInputRef)}
        {renderUpload('EN', enInputRef)}
      </div>
    </div>
  );
}

