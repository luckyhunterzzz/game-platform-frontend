'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';

type AuthContextValue = {
  keycloak: Keycloak | null;
  loading: boolean;
  authenticated: boolean;
  userId: string | null;
  roles: string[];
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function withRolePrefix(roles: string[]): string[] {
  return (roles ?? []).map((r) => (r.startsWith('ROLE_') ? r : `ROLE_${r}`));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const kc = new Keycloak({
      url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'game-realm',
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'game-frontend',
    });

    const initOptions: KeycloakInitOptions = {
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: true,
    };

    let refreshTimer: number | null = null;

    kc.init(initOptions)
      .then((auth) => {
        setKeycloak(kc);
        setAuthenticated(auth);
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
      .catch(() => {
        setKeycloak(kc);
        setAuthenticated(false);
        setLoading(false);
      });

    return () => {
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const tokenParsed: any = keycloak?.tokenParsed ?? null;
    const rawRoles: string[] = tokenParsed?.realm_access?.roles ?? [];

    return {
      keycloak,
      loading,
      authenticated,
      userId: tokenParsed?.sub ?? null,
      roles: withRolePrefix(rawRoles),
      login: () => keycloak?.login(),
      logout: () => keycloak?.logout(),
    };
  }, [keycloak, loading, authenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}