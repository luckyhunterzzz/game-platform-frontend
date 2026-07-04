'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function EventsAdminLinkBadge() {
  const { authenticated, roles } = useAuth();
  const { messages } = useI18n();

  const isAdmin = useMemo(() => {
    return roles.includes('ROLE_admin') || roles.includes('ROLE_superadmin');
  }, [roles]);

  if (!authenticated || !isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin/events"
      className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300 transition hover:bg-amber-400/15"
    >
      {messages.heroes.adminBadge}
    </Link>
  );
}
