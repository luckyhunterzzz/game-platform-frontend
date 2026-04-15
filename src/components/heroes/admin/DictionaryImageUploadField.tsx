'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, useApi } from '@/lib/use-api';
import type { ImageUploadResponse } from '@/lib/types/publication';
import type { HeroLocale } from '@/lib/types/hero';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_API = '/api/v1/admin/media/images';

type DictionaryImageValue = {
  imageBucket?: string | null;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
};

type DictionaryImageUploadFieldProps = {
  locale: HeroLocale;
  value: DictionaryImageValue;
  onChange: (value: Required<DictionaryImageValue>) => void;
  onUploadingChange: (uploading: boolean) => void;
  onErrorChange: (error: string | null) => void;
  disabled?: boolean;
};

function getText(locale: HeroLocale) {
  if (locale === 'RU') {
    return {
      label: 'Картинка',
      hint: 'Поддерживаются PNG, JPEG, WEBP. Максимум 5 MB.',
      uploading: 'Загрузка изображения...',
      uploaded: 'Изображение загружено',
      remove: 'Удалить изображение',
      invalidType: 'Можно загружать только PNG, JPEG или WEBP.',
      invalidSize: 'Размер изображения не должен превышать 5 MB.',
      fallbackError: 'Не удалось загрузить изображение.',
      inputAriaLabel: 'Загрузить картинку',
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
    fallbackError: 'Failed to upload image.',
    inputAriaLabel: 'Upload image',
  };
}

function getFileNameFromObjectKey(value?: string | null): string | null {
  if (!value) return null;
  const parts = value.split('/');
  return parts.at(-1) ?? value;
}

export default function DictionaryImageUploadField({
  locale,
  value,
  onChange,
  onUploadingChange,
  onErrorChange,
  disabled = false,
}: DictionaryImageUploadFieldProps) {
  const { apiPostFormData } = useApi();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const text = useMemo(() => getText(locale), [locale]);

  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    setFileName(getFileNameFromObjectKey(value.imageObjectKey));
  }, [value.imageObjectKey]);

  useEffect(() => {
    onUploadingChange(uploading);
  }, [onUploadingChange, uploading]);

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    onChange({
      imageBucket: null,
      imageObjectKey: null,
      imageUrl: null,
    });
    onErrorChange(null);
    setFileName(null);
    resetInput();
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) {
      clearImage();
      return;
    }

    onErrorChange(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      clearImage();
      onErrorChange(text.invalidType);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      clearImage();
      onErrorChange(text.invalidSize);
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiPostFormData<ImageUploadResponse>(IMAGE_UPLOAD_API, formData);

      onChange({
        imageBucket: response.bucket,
        imageObjectKey: response.objectKey,
        imageUrl: response.url,
      });
      setFileName(file.name);
      onErrorChange(null);
    } catch (error) {
      clearImage();
      setFileName(file.name);

      if (error instanceof ApiError) {
        onErrorChange(error.message);
      } else if (error instanceof Error) {
        onErrorChange(error.message);
      } else {
        onErrorChange(text.fallbackError);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--foreground-soft)]">
        {text.label}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={text.inputAriaLabel}
        onChange={(event) => void handleFileSelected(event.target.files?.[0] ?? null)}
        disabled={disabled || uploading}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'RU' ? 'Выбрать файл' : 'Choose file'}
        </button>
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-soft)]">
          {fileName ?? (locale === 'RU' ? 'Файл не выбран' : 'No file selected')}
        </span>
      </div>

      <p className="text-xs text-[var(--foreground-soft)]">{text.hint}</p>

      {uploading ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-300">
          {text.uploading}
        </div>
      ) : null}

      {value.imageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.imageUrl}
            alt={fileName ?? 'Dictionary image preview'}
            className="max-h-56 w-full object-contain bg-black/10"
          />

          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">{text.uploaded}</p>
              <p className="truncate text-xs text-[var(--foreground-soft)]">{fileName ?? ''}</p>
            </div>

            <button
              type="button"
              onClick={clearImage}
              disabled={disabled || uploading}
              className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {text.remove}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
