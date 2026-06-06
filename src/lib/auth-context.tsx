'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { KeycloakTokenParsed } from 'keycloak-js';
import { useRuntimeConfig } from '@/lib/runtime-config/context';

const AUTH_INIT_TIMEOUT_MS = 10_000;
const AUTH_SESSION_STORAGE_KEY = 'gameops.auth.session';
const AUTH_REMEMBERED_LOGIN_STORAGE_KEY = 'gameops.auth.remembered-login';

type AuthContextValue = {
  keycloak: Keycloak | null;
  loading: boolean;
  authenticated: boolean;
  canResumeLogin: boolean;
  error: string | null;
  userId: string | null;
  userEmail: string | null;
  displayName: string | null;
  roles: string[];
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function withRolePrefix(roles: string[]): string[] {
  return (roles ?? []).map((r) => (r.startsWith('ROLE_') ? r : `ROLE_${r}`));
}

function hasAuthCallbackParams() {
  if (typeof window === 'undefined') {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  return ['code', 'state', 'session_state', 'error', 'error_description'].some(
    (param) => searchParams.has(param) || hashParams.has(param),
  );
}

function shouldResumeAuthenticatedSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY) === '1' ||
    window.localStorage.getItem(AUTH_REMEMBERED_LOGIN_STORAGE_KEY) === '1'
  );
}

function hasRememberedLogin() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(AUTH_REMEMBERED_LOGIN_STORAGE_KEY) === '1';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const runtimeConfig = useRuntimeConfig();
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const initPromiseRef = useRef<Promise<Keycloak> | null>(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [canResumeLogin, setCanResumeLogin] = useState(hasRememberedLogin);
  const [error, setError] = useState<string | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((kc: Keycloak) => {
    clearRefreshTimer();

    refreshTimerRef.current = window.setInterval(async () => {
      if (!kc.authenticated) {
        return;
      }

      try {
        const refreshed = await kc.updateToken(90);
        if (refreshed) {
          setAuthenticated(true);
        }
      } catch {
        setAuthenticated(false);
      }
    }, 60_000);
  }, [clearRefreshTimer]);

  const createKeycloak = useCallback(() => {
    return new Keycloak({
      url: runtimeConfig.authUrl,
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'game-realm',
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'game-frontend',
    });
  }, [runtimeConfig.authUrl]);

  const initializeKeycloak = useCallback(async (mode: 'callback' | 'resume' | 'login') => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const kc = createKeycloak();
    const initOptions: KeycloakInitOptions = {
      pkceMethod: 'S256',
      checkLoginIframe: false,
    };

    if (mode === 'resume') {
      initOptions.onLoad = 'check-sso';
    }

    clearRefreshTimer();
    setLoading(true);
    setError(null);

    const initPromise = (async () => {
      let initTimeout: number | null = null;

      try {
        const auth = await Promise.race([
          kc.init(initOptions),
          new Promise<never>((_, reject) => {
            initTimeout = window.setTimeout(() => {
              reject(new Error('Keycloak initialization timed out'));
            }, AUTH_INIT_TIMEOUT_MS);
          }),
        ]);

        if (initTimeout) {
          window.clearTimeout(initTimeout);
        }

        setKeycloak(kc);
        setAuthenticated(Boolean(auth));
        setLoading(false);

        if (auth) {
          window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, '1');
          window.localStorage.setItem(AUTH_REMEMBERED_LOGIN_STORAGE_KEY, '1');
          setCanResumeLogin(true);
          scheduleRefresh(kc);
        } else if (mode !== 'login') {
          window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
          window.localStorage.removeItem(AUTH_REMEMBERED_LOGIN_STORAGE_KEY);
          setCanResumeLogin(false);
          clearRefreshTimer();
        }

        return kc;
      } catch (initError: unknown) {
        if (initTimeout) {
          window.clearTimeout(initTimeout);
        }

        setKeycloak(kc);
        setAuthenticated(false);
        setLoading(false);
        setError(
          initError instanceof Error
            ? initError.message
            : 'Authentication is temporarily unavailable',
        );

        if (mode !== 'login') {
          window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        }

        clearRefreshTimer();
        throw initError;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    initPromiseRef.current = initPromise;
    return initPromise;
  }, [clearRefreshTimer, createKeycloak, scheduleRefresh]);

  useEffect(() => {
    if (!hasAuthCallbackParams() && !shouldResumeAuthenticatedSession()) {
      setLoading(false);
      return;
    }

    const mode = hasAuthCallbackParams() ? 'callback' : 'resume';

    void initializeKeycloak(mode).catch(() => {
      // The UI falls back to guest mode and exposes the error banner.
    });

    return () => {
      initPromiseRef.current = null;
    };
  }, [initializeKeycloak]);

  useEffect(() => {
    return () => {
      clearRefreshTimer();
    };
  }, [clearRefreshTimer]);

  const value = useMemo<AuthContextValue>(() => {
    const tokenParsed = ((keycloak?.tokenParsed as KeycloakTokenParsed & {
      email?: string;
      preferred_username?: string;
      name?: string;
    }) ?? null);
    const rawRoles: string[] = tokenParsed?.realm_access?.roles ?? [];
    const userEmail = tokenParsed?.email ?? null;
    const displayName =
      tokenParsed?.preferred_username ??
      tokenParsed?.name ??
      tokenParsed?.email ??
      tokenParsed?.sub ??
      null;

    return {
      keycloak,
      loading,
      authenticated,
      canResumeLogin,
      error,
      userId: tokenParsed?.sub ?? null,
      userEmail,
      displayName,
      roles: withRolePrefix(rawRoles),
      login: () => {
        if (loading) {
          return;
        }

        window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, '1');

        void (async () => {
          try {
            const kc = authenticated && keycloak
              ? keycloak
              : await initializeKeycloak('login');
            await kc.login({
              redirectUri: window.location.href,
            });
          } catch (loginError: unknown) {
            window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
            setError(
              loginError instanceof Error
                ? loginError.message
                : 'Authentication is temporarily unavailable',
            );
          }
        })();
      },
      logout: () => {
        window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        window.localStorage.removeItem(AUTH_REMEMBERED_LOGIN_STORAGE_KEY);
        setCanResumeLogin(false);
        clearRefreshTimer();

        if (!keycloak) {
          setAuthenticated(false);
          return;
        }

        void keycloak.logout({
          redirectUri: window.location.origin,
        });
      },
    };
  }, [authenticated, canResumeLogin, clearRefreshTimer, error, initializeKeycloak, keycloak, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
