import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import './globals.css';

import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { RuntimeConfigProvider } from '@/lib/runtime-config/context';
import { resolveRuntimeConfigFromHeaders } from '@/lib/runtime-config/server';
import { ThemeProvider } from '@/lib/theme/theme-context';
import ScrollToTopButton from '@/components/ScrollToTopButton';

export const metadata: Metadata = {
  title: 'GameOps Platform',
  description: 'Stage',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeConfig = resolveRuntimeConfigFromHeaders(await headers());

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3JJZ7G3LKW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3JJZ7G3LKW');
          `}
        </Script>
        <RuntimeConfigProvider value={runtimeConfig}>
          <AuthProvider>
            <I18nProvider>
              <ThemeProvider>
                {children}
                <ScrollToTopButton />
              </ThemeProvider>
            </I18nProvider>
          </AuthProvider>
        </RuntimeConfigProvider>
      </body>
    </html>
  );
}
