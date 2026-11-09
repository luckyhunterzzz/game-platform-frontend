'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/lib/i18n/i18n-context';
import type { Supporter, SupporterFontStyle, SupporterUpsertRequest } from '@/lib/types/supporter';
import { useApi } from '@/lib/use-api';

const ADMIN_SUPPORTERS_API = '/api/v1/admin/supporters';
const DEFAULT_FORM: SupporterUpsertRequest = {
  nickname: '',
  color: '#F59E0B',
  fontStyle: 'ELEGANT',
  active: true,
  sortOrder: 0,
};

export default function SupportersAdminSection() {
  const { locale } = useI18n();
  const { apiJson, apiPostJson, apiPutJson, apiDeleteVoid } = useApi();
  const [items, setItems] = useState<Supporter[]>([]);
  const [form, setForm] = useState<SupporterUpsertRequest>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = useMemo(
    () => locale === 'ru'
      ? {
          title: 'Благодарности', subtitle: 'Ники из этого списка появляются в бегущей строке на всех страницах.',
          nickname: 'Ник', color: 'Цвет', font: 'Стиль шрифта', order: 'Порядок', active: 'Показывать',
          add: 'Добавить', save: 'Сохранить', cancel: 'Отмена', edit: 'Изменить', remove: 'Удалить',
          empty: 'Пока никто не добавлен.', confirm: 'Удалить этот ник из списка благодарностей?',
          loadError: 'Не удалось загрузить список благодарностей.', saveError: 'Не удалось сохранить изменения.',
        }
      : {
          title: 'Supporters', subtitle: 'Names from this list appear in the ticker on every page.',
          nickname: 'Nickname', color: 'Color', font: 'Font style', order: 'Order', active: 'Visible',
          add: 'Add', save: 'Save', cancel: 'Cancel', edit: 'Edit', remove: 'Delete',
          empty: 'No supporters have been added yet.', confirm: 'Delete this supporter from the thank-you list?',
          loadError: 'Failed to load supporters.', saveError: 'Failed to save changes.',
        },
    [locale],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await apiJson<Supporter[]>(ADMIN_SUPPORTERS_API));
    } catch {
      setError(text.loadError);
    } finally {
      setLoading(false);
    }
  }, [apiJson, text.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const submit = async () => {
    if (!form.nickname.trim()) return;
    setSubmitting(true);
    setError(null);
    const payload = { ...form, nickname: form.nickname.trim() };
    try {
      if (editingId == null) {
        await apiPostJson<SupporterUpsertRequest, Supporter>(ADMIN_SUPPORTERS_API, payload);
      } else {
        await apiPutJson<SupporterUpsertRequest, Supporter>(`${ADMIN_SUPPORTERS_API}/${editingId}`, payload);
      }
      resetForm();
      await load();
      window.dispatchEvent(new Event('supporters-updated'));
    } catch {
      setError(text.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (item: Supporter) => {
    setEditingId(item.id);
    setForm({
      nickname: item.nickname,
      color: item.color,
      fontStyle: item.fontStyle,
      active: item.active,
      sortOrder: item.sortOrder,
    });
  };

  const remove = async (item: Supporter) => {
    if (!window.confirm(text.confirm)) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiDeleteVoid(`${ADMIN_SUPPORTERS_API}/${item.id}`);
      if (editingId === item.id) resetForm();
      await load();
      window.dispatchEvent(new Event('supporters-updated'));
    } catch {
      setError(text.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const fontOptions: Array<[SupporterFontStyle, string]> = [
    ['ELEGANT', locale === 'ru' ? 'Элегантный' : 'Elegant'],
    ['SCRIPT', locale === 'ru' ? 'Рукописный' : 'Script'],
    ['CLASSIC', locale === 'ru' ? 'Классический' : 'Classic'],
    ['MODERN', locale === 'ru' ? 'Современный' : 'Modern'],
  ];

  return (
    <div className="mb-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h3 className="text-xl font-bold text-[var(--foreground)]">{text.title}</h3>
      <p className="mt-1 text-sm text-[var(--foreground-soft)]">{text.subtitle}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(160px,1fr)_110px_160px_100px_auto]">
        <input
          value={form.nickname}
          onChange={(event) => setForm((prev) => ({ ...prev, nickname: event.target.value }))}
          placeholder={text.nickname}
          maxLength={100}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
        />
        <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-xs text-[var(--foreground-soft)]">
          <input type="color" value={form.color} onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))} className="h-7 w-8 cursor-pointer border-0 bg-transparent" />
          {text.color}
        </label>
        <select value={form.fontStyle} onChange={(event) => setForm((prev) => ({ ...prev, fontStyle: event.target.value as SupporterFontStyle }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none">
          {fontOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input type="number" min={0} max={9999} value={form.sortOrder} onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} aria-label={text.order} className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none" />
        <label className="flex items-center gap-2 text-sm text-[var(--foreground-soft)]">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />
          {text.active}
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void submit()} disabled={submitting || !form.nickname.trim()} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 disabled:opacity-50">
          {editingId == null ? text.add : text.save}
        </button>
        {editingId != null ? <button type="button" onClick={resetForm} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground-soft)]">{text.cancel}</button> : null}
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div> : null}
      <div className="mt-5 space-y-2">
        {loading ? <div className="text-sm text-[var(--foreground-soft)]">...</div> : items.length === 0 ? <div className="text-sm text-[var(--foreground-soft)]">{text.empty}</div> : items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3">
            <span className="min-w-0 flex-1 text-base font-semibold" style={{ color: item.color }}>{item.nickname}</span>
            <span className="text-xs text-[var(--foreground-muted)]">#{item.sortOrder}</span>
            {!item.active ? <span className="text-xs text-amber-300">{locale === 'ru' ? 'Скрыт' : 'Hidden'}</span> : null}
            <button type="button" onClick={() => edit(item)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-soft)]">{text.edit}</button>
            <button type="button" onClick={() => void remove(item)} disabled={submitting} className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300 disabled:opacity-50">{text.remove}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
