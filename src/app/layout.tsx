import type { Metadata } from 'next';
import './globals.css';

import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { ThemeProvider } from '@/lib/theme/theme-context';

export const metadata: Metadata = {
  title: 'GameOps Platform',
  description: 'Stage',
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
            <ThemeProvider>{children}</ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
