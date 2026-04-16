'use client';

import { useState, type DragEvent, type RefObject } from 'react';

type HeroImageUploadFieldProps = {
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

export default function HeroImageUploadField({
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
}: HeroImageUploadFieldProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const t =
    locale === 'RU'
      ? {
          label: 'Картинка героя',
          hint: 'Поддерживаются PNG, JPEG, WEBP. Максимум 5 MB.',
          uploading: 'Загрузка изображения...',
          uploaded: 'Изображение загружено',
          attached: 'Изображение уже привязано к карточке',
          remove: 'Удалить изображение',
        }
      : {
          label: 'Hero image',
          hint: 'Supported: PNG, JPEG, WEBP. Maximum size: 5 MB.',
          uploading: 'Uploading image...',
          uploaded: 'Image uploaded',
          attached: 'Image is already attached to this hero card',
          remove: 'Remove image',
        };

  const dropHint = locale === 'RU' ? 'Перетащите файл сюда или выберите вручную.' : 'Drag and drop a file here or choose it manually.';

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || uploading) {
      return;
    }

    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled || uploading) {
      return;
    }

    void onSelect(event.dataTransfer.files?.[0] ?? null);
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

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 transition ${
          isDragOver
            ? 'border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.18)]'
            : 'border-[var(--border)] bg-[var(--surface-strong)]'
        }`}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locale === 'RU' ? 'Выбрать файл' : 'Choose file'}
        </button>
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground-soft)]">
          {uploadedFileName ?? storedImageLabel ?? (locale === 'RU' ? 'Файл не выбран' : 'No file selected')}
        </span>
        <div className="w-full text-xs text-[var(--foreground-muted)]">{dropHint}</div>
      </div>

      <p className="text-xs text-[var(--foreground-muted)]">{t.hint}</p>

      {uploading && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-300">
          {t.uploading}
        </div>
      )}

      {imageUploadError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {imageUploadError}
        </div>
      )}

      {uploadedImageUrl || storedImageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={uploadedImageUrl ?? storedImageUrl ?? ''}
            alt={uploadedFileName ?? storedImageLabel ?? 'Uploaded hero preview'}
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
          {storedImageLabel && (
            <div className="mt-1 truncate text-xs text-[var(--foreground-soft)]">{storedImageLabel}</div>
          )}
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
