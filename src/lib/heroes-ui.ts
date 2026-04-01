import type { HeroLocale, LocalizedText } from '@/lib/types/hero';
import type { Messages } from '@/lib/i18n/types';

export function resolveHeroLocale(messages: Messages): HeroLocale {
  return messages.common.languageRussian === 'Русский' ? 'RU' : 'EN';
}

export function getLocaleText(
  value: LocalizedText | null | undefined,
  locale: HeroLocale,
): string {
  if (!value) {
    return '';
  }

  return locale === 'RU' ? value.ru : value.en;
}