'use client';

import Link from 'next/link';

export type SidebarMenuItem = {
  href?: string;
  isActive?: boolean;
  key: string;
  label: string;
  onClick?: () => void;
};

type AppSidebarMenuProps = {
  isOpen: boolean;
  items: SidebarMenuItem[];
  onClose: () => void;
  title: string;
};

function getItemClassName(isActive: boolean | undefined) {
  if (isActive) {
    return 'block text-[var(--foreground)] transition hover:text-cyan-300';
  }

  return 'block text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]';
}

export default function AppSidebarMenu({
  isOpen,
  items,
  onClose,
  title,
}: AppSidebarMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="w-64 border-r border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-2xl backdrop-blur">
        <h2 className="mb-6 text-xl font-bold text-cyan-400">{title}</h2>

        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.key}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => {
                    onClose();
                    item.onClick?.();
                  }}
                  className={getItemClassName(item.isActive)}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    item.onClick?.();
                  }}
                  className={`${getItemClassName(item.isActive)} w-full text-left`}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
    </div>
  );
}
