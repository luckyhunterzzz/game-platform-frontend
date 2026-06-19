import type { Locale } from '@/lib/i18n/types';

export const DEFAULT_EN_HOST = 'gameops-platform.dev';
export const DEFAULT_RU_HOST = 'ru.gameops-platform.dev';

function normalizeHostValue(host: string | null | undefined): string {
  return (host ?? '').trim().toLowerCase();
}

function normalizeForwardedHost(value: string | null | undefined): string {
  return value?.split(',')[0]?.trim().toLowerCase() ?? '';
}

function stripPort(host: string): string {
  const normalizedHost = normalizeHostValue(host);

  if (normalizedHost.startsWith('[')) {
    const closingBracketIndex = normalizedHost.indexOf(']');
    return closingBracketIndex >= 0 ? normalizedHost.slice(0, closingBracketIndex + 1) : normalizedHost;
  }

  const colonIndex = normalizedHost.indexOf(':');
  return colonIndex >= 0 ? normalizedHost.slice(0, colonIndex) : normalizedHost;
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function resolveRequestHost(headersLike: Headers): string {
  const forwardedHost = normalizeForwardedHost(headersLike.get('x-forwarded-host'));
  const host = normalizeForwardedHost(headersLike.get('host'));

  return stripPort(forwardedHost || host || DEFAULT_EN_HOST);
}

export function resolveLocaleByHost(host: string | null | undefined): Locale {
  const normalizedHost = stripPort(normalizeHostValue(host));
  return normalizedHost === DEFAULT_RU_HOST ? 'ru' : 'en';
}

export function resolveLocaleFromHeaders(headersLike: Headers): Locale {
  return resolveLocaleByHost(resolveRequestHost(headersLike));
}

export function resolveSiteOrigin(host: string | null | undefined): string {
  const normalizedHost = normalizeHostValue(host);
  const hostWithOptionalPort = normalizedHost || DEFAULT_EN_HOST;
  const hostWithoutPort = stripPort(hostWithOptionalPort);
  const protocol = isLocalHost(hostWithoutPort) ? 'http' : 'https';

  return `${protocol}://${hostWithOptionalPort}`;
}

export function resolveAlternateOrigin(locale: Locale): string {
  return `https://${locale === 'ru' ? DEFAULT_RU_HOST : DEFAULT_EN_HOST}`;
}

export function buildAlternatesForPath(pathWithQuery: string, canonicalLocale: Locale) {
  return {
    canonical: `${resolveAlternateOrigin(canonicalLocale)}${pathWithQuery}`,
    languages: {
      en: `${resolveAlternateOrigin('en')}${pathWithQuery}`,
      ru: `${resolveAlternateOrigin('ru')}${pathWithQuery}`,
      'x-default': `${resolveAlternateOrigin('en')}${pathWithQuery}`,
    },
  };
}
