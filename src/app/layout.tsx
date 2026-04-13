import type { Metadata } from 'next';
import './globals.css';

import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { ThemeProvider } from '@/lib/theme/theme-context';
import ScrollToTopButton from '@/components/ScrollToTopButton';

export const metadata: Metadata = {
  title: 'GameOps Platform',
  description: 'Stage',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          <I18nProvider>
            <ThemeProvider>
              {children}
              <ScrollToTopButton />
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
