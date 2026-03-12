'use client';

import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB, ru } from 'date-fns/locale';

import { useI18n } from '@/lib/i18n/i18n-context';
import { ApiError, useApi } from '@/lib/use-api';
import {
  type CreatePublicationRequest,
  PublicationStatus,
  PublicationType,
} from '@/lib/types/publication';

type CreatePublicationModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
};

const AVAILABLE_CREATE_STATUSES = [
  PublicationStatus.PUBLISHED,
  PublicationStatus.DRAFT,
  PublicationStatus.SCHEDULED,
];

registerLocale('ru', ru);
registerLocale('en-GB', enGB);

function createDefaultForm(): CreatePublicationRequest {
  return {
    title: '',
    content: '',
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

export default function CreatePublicationModal({
  open,
  onClose,
  onCreated,
}: CreatePublicationModalProps) {
  const { apiPostJson } = useApi();
  const { locale, messages } = useI18n();

  const [form, setForm] = useState<CreatePublicationRequest>(createDefaultForm());
  const [submitting, setSubmitting] = useState(false);
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

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (form.title.trim().length === 0) return false;
    if (isScheduled && !form.publishedAt) return false;
    return true;
  }, [form.title, form.publishedAt, isScheduled, submitting]);

  const resetForm = () => {
    setForm(createDefaultForm());
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = <K extends keyof CreatePublicationRequest>(
    key: K,
    value: CreatePublicationRequest[K],
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

  const handleSubmit = async () => {
    if (submitting) return;

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

      const payload: CreatePublicationRequest = {
        ...form,
        publishedAt: form.status === PublicationStatus.SCHEDULED ? form.publishedAt : null,
        imageBucket: null,
        imageObjectKey: null,
      };

      await apiPostJson<CreatePublicationRequest, unknown>(
        '/api/v1/admin/publications',
        payload,
      );

      resetForm();
      await onCreated();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(messages.createPublicationModal.createError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white">
            {messages.createPublicationModal.title}
          </h3>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white/70 transition hover:bg-white/5"
          >
            {messages.createPublicationModal.close}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              {messages.createPublicationModal.titleLabel}
            </label>
            <input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
              placeholder={messages.createPublicationModal.titlePlaceholder}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              {messages.createPublicationModal.contentLabel}
            </label>
            <textarea
              value={form.content ?? ''}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30"
              placeholder={messages.createPublicationModal.contentPlaceholder}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                {messages.createPublicationModal.typeLabel}
              </label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value as PublicationType)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              >
                {Object.values(PublicationType).map((type) => (
                  <option key={type} value={type} className="bg-slate-900">
                    {messages.publicationType[type]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                {messages.createPublicationModal.statusLabel}
              </label>
              <select
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value as PublicationStatus)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              >
                {AVAILABLE_CREATE_STATUSES.map((status) => (
                  <option key={status} value={status} className="bg-slate-900">
                    {messages.publicationStatus[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isScheduled && (
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                calendarClassName="gp-datepicker"
                popperClassName="gp-datepicker-popper"
              />

              <p className="mt-2 text-xs text-white/50">
                {messages.createPublicationModal.scheduledHint}
              </p>
            </div>
          )}

          <label className="flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => handleChange('pinned', e.target.checked)}
            />
            {messages.createPublicationModal.pinnedLabel}
          </label>

          {errorMessage && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
            >
              {messages.createPublicationModal.cancel}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? messages.createPublicationModal.submitting
                : messages.createPublicationModal.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}