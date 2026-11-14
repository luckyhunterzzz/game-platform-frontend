'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/Navbar';

type AppShellContextValue = {
  subscribeToMenuRequests: (listener: () => void) => () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppSidebar(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const context = useContext(AppShellContext);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!context) {
      return undefined;
    }

    return context.subscribeToMenuRequests(() => {
      setIsOpen((current) => !current);
    });
  }, [context]);

  return [isOpen, setIsOpen];
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const menuRequestListenersRef = useRef(new Set<() => void>());
  const isHeroSharePage =
    pathname.startsWith('/heroes/share/') || pathname.startsWith('/profile/heroes/share/');
  const subscribeToMenuRequests = useCallback((listener: () => void) => {
    const listeners = menuRequestListenersRef.current;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);
  const contextValue = useMemo(
    () => ({ subscribeToMenuRequests }),
    [subscribeToMenuRequests],
  );
  const handleMenuClick = useCallback(() => {
    menuRequestListenersRef.current.forEach((listener) => listener());
  }, []);

  if (isHeroSharePage) {
    return children;
  }

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Navbar onMenuClick={handleMenuClick} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </AppShellContext.Provider>
  );
}
