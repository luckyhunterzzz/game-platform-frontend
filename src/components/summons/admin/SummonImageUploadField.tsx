'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { ImageUploadResponse } from '@/lib/types/publication';
import { ApiError, useApi } from '@/lib/use-api';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_API = '/api/v1/admin/media/images/summons';

export type SummonImageValue = {
  bucket?: string | null;
  objectKey?: string | null;
  url?: string | null;
};

export default function SummonImageUploadField({
  locale,
  label,
  value,
  onChange,
  onUploadingChange,
  disabled = false,
}: {
  locale: 'ru' | 'en';
  label: string;
  value: SummonImageValue;
  onChange: (value: SummonImageValue) => void;
  onUploadingChange: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const { apiPostFormData } = useApi();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const text = useMemo(
    () =>
      locale === 'ru'
        ? {
            choose: 'Выбрать файл',
            none: 'Файл не выбран',
            hint: 'PNG, JPEG или WEBP. Максимальный размер — 5 MB.',
            uploading: 'Загрузка изображения...',
            uploaded: 'Изображение загружено',
            remove: 'Удалить',
            invalidType: 'Можно загружать только PNG, JPEG или WEBP.',
            invalidSize: 'Размер изображения не должен превышать 5 MB.',
            fallbackError: 'Не удалось загрузить изображение.',
          }
        : {
            choose: 'Choose file',
            none: 'No file selected',
            hint: 'PNG, JPEG, or WEBP. Maximum size is 5 MB.',
            uploading: 'Uploading image...',
            uploaded: 'Image uploaded',
            remove: 'Remove',
            invalidType: 'Only PNG, JPEG, or WEBP images are allowed.',
            invalidSize: 'Image size must not exceed 5 MB.',
            fallbackError: 'Failed to upload image.',
          },
    [locale],
  );

  useEffect(() => {
    setFileName(value.objectKey ? value.objectKey.split('/').at(-1) ?? value.objectKey : null);
  }, [value.objectKey]);

  useEffect(() => {
    onUploadingChange(uploading);
  }, [onUploadingChange, uploading]);

  const clearImage = () => {
    onChange({ bucket: null, objectKey: null, url: null });
    setFileName(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;

    setErrorMessage(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage(text.invalidType);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage(text.invalidSize);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiPostFormData<ImageUploadResponse>(IMAGE_UPLOAD_API, formData);
      onChange({ bucket: response.bucket, objectKey: response.objectKey, url: response.url });
      setFileName(file.name);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError || error instanceof Error ? error.message : text.fallbackError,
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
      <div className="text-sm font-semibold text-[var(--foreground)]">{label}</div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => void handleFileSelected(event.target.files?.[0] ?? null)}
        disabled={disabled || uploading}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text.choose}
        </button>
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-soft)]">
          {fileName ?? text.none}
        </span>
      </div>

      <p className="text-xs text-[var(--foreground-soft)]">{text.hint}</p>
      {uploading ? <div className="text-sm text-cyan-300">{text.uploading}</div> : null}
      {errorMessage ? <div className="text-sm text-red-300">{errorMessage}</div> : null}

      {value.url ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={label} className="h-48 w-full object-contain bg-black/10" />
          <div className="flex items-center justify-between gap-3 p-3">
            <span className="truncate text-xs text-[var(--foreground-soft)]">{text.uploaded}</span>
            <button
              type="button"
              onClick={clearImage}
              disabled={disabled || uploading}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-soft)] transition hover:bg-[var(--surface-hover)]"
            >
              {text.remove}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
