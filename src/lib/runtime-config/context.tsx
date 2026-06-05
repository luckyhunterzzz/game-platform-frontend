'use client';

import React, { createContext, useContext } from 'react';

import type { RuntimeConfig } from '@/lib/runtime-config/types';

const RuntimeConfigContext = createContext<RuntimeConfig | null>(null);

export function RuntimeConfigProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: RuntimeConfig;
}) {
  return (
    <RuntimeConfigContext.Provider value={value}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  const context = useContext(RuntimeConfigContext);

  if (!context) {
    throw new Error('useRuntimeConfig must be used within RuntimeConfigProvider');
  }

  return context;
}
