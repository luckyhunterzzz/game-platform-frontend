'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { KeycloakTokenParsed } from 'keycloak-js';
import { useRuntimeConfig } from '@/lib/runtime-config/context';

const AUTH_INIT_TIMEOUT_MS = 10_000;

type AuthContextValue = {
  keycloak: Keycloak | null;
  loading: boolean;
  authenticated: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const runtimeConfig = useRuntimeConfig();
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const kc = new Keycloak({
      url: runtimeConfig.authUrl,
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'game-realm',
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'game-frontend',
    });

    const initOptions: KeycloakInitOptions = {
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: true,
    };

    let refreshTimer: number | null = null;
    let isCancelled = false;
    let initTimeout: number | null = null;

    const initPromise = kc.init(initOptions);
    const timeoutPromise = new Promise<never>((_, reject) => {
      initTimeout = window.setTimeout(() => {
        reject(new Error('Keycloak initialization timed out'));
      }, AUTH_INIT_TIMEOUT_MS);
    });

    Promise.race([initPromise, timeoutPromise])
      .then((auth) => {
        if (isCancelled) {
          return;
        }

        if (initTimeout) {
          window.clearTimeout(initTimeout);
        }

        setKeycloak(kc);
        setAuthenticated(Boolean(auth));
        setLoading(false);

        refreshTimer = window.setInterval(async () => {
          if (!kc.authenticated) return;
          try {
            const refreshed = await kc.updateToken(90);
            if (refreshed) setAuthenticated(true);
          } catch {
            setAuthenticated(false);
          }
        }, 60_000);
      })
      .catch((initError: unknown) => {
        if (isCancelled) {
          return;
        }

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
      });

    return () => {
      isCancelled = true;
      if (initTimeout) window.clearTimeout(initTimeout);
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, [runtimeConfig.authUrl]);

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
      error,
      userId: tokenParsed?.sub ?? null,
      userEmail,
      displayName,
      roles: withRolePrefix(rawRoles),
      login: () => {
        if (!keycloak) {
          return;
        }

        void keycloak.login();
      },
      logout: () => {
        if (!keycloak) {
          return;
        }

        void keycloak.logout();
      },
    };
  }, [authenticated, error, keycloak, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
