'use client';

import type { RefObject } from 'react';

type HeroPreviewUploadFieldProps = {
  locale: 'RU' | 'EN';
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploading: boolean;
  uploadedImageUrl: string | null;
  storedImageUrl?: string | null;
  uploadedFileName: string | null;
  imageUploadError: string | null;
  hasStoredImage: boolean;
  storedImageLabel?: string | null;
  disabled?: boolean;
  onSelect: (file: File | null) => void | Promise<void>;
  onClear: () => void;
};

export default function HeroPreviewUploadField({
  locale,
  fileInputRef,
  uploading,
  uploadedImageUrl,
  storedImageUrl = null,
  uploadedFileName,
  imageUploadError,
  hasStoredImage,
  storedImageLabel,
  disabled = false,
  onSelect,
  onClear,
}: HeroPreviewUploadFieldProps) {
  const t =
    locale === 'RU'
      ? {
          label: 'Превью героя',
          hint: 'PNG, JPEG или WEBP. Максимум 5 MB. Одна картинка для всех локалей.',
          choose: 'Выбрать файл',
          empty: 'Файл не выбран',
          uploading: 'Загрузка превью...',
          uploaded: 'Превью загружено',
          attached: 'Превью уже привязано к герою',
          remove: 'Удалить превью',
        }
      : {
          label: 'Hero preview',
          hint: 'PNG, JPEG or WEBP. Maximum 5 MB. One image for all locales.',
          choose: 'Choose file',
          empty: 'No file selected',
          uploading: 'Uploading preview...',
          uploaded: 'Preview uploaded',
          attached: 'Preview is already attached to this hero',
          remove: 'Remove preview',
        };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--foreground-soft)]">{t.label}</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => void onSelect(e.target.files?.[0] ?? null)}
        disabled={disabled || uploading}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.choose}
        </button>
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-soft)]">
          {uploadedFileName ?? storedImageLabel ?? t.empty}
        </span>
      </div>

      <p className="text-xs text-[var(--foreground-muted)]">{t.hint}</p>

      {uploading ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-300">
          {t.uploading}
        </div>
      ) : null}

      {imageUploadError ? (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {imageUploadError}
        </div>
      ) : null}

      {uploadedImageUrl || storedImageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={uploadedImageUrl ?? storedImageUrl ?? ''}
            alt={uploadedFileName ?? storedImageLabel ?? 'Hero preview'}
            className="max-h-72 w-full object-contain bg-black/20"
          />

          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {uploadedImageUrl ? t.uploaded : t.attached}
              </p>
              <p className="truncate text-xs text-[var(--foreground-soft)]">
                {uploadedFileName ?? storedImageLabel ?? ''}
              </p>
            </div>

            <button
              type="button"
              onClick={onClear}
              disabled={disabled || uploading}
              className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.remove}
            </button>
          </div>
        </div>
      ) : hasStoredImage ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-sm font-medium text-[var(--foreground)]">{t.attached}</div>
          {storedImageLabel ? (
            <div className="mt-1 truncate text-xs text-[var(--foreground-soft)]">{storedImageLabel}</div>
          ) : null}
          <div className="mt-4">
            <button
              type="button"
              onClick={onClear}
              disabled={disabled || uploading}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.remove}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
