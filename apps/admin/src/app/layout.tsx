// src/app/layout.tsx

import '@/styles/globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';

// UI Imports
import { Toaster } from 'sonner';
import { SWRProvider } from '@/hooks/swr/api-client';
import { RadixDirectionProvider } from '@/components/RadixDirectionProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'بفروش | سیستم مدیریت فروش و بازاریابی',
  description: 'این نرم افزار بصورت اختصاصی برای بخش بازاریابی و فروش مجموعه بفروش طراحی شده است.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const className = locale === 'fa' ? 'font-Yekan antialiased' : `${inter.className} antialiased`;

  return (
    <html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'} className={className}>
      <body>
        <SWRProvider>
          <RadixDirectionProvider dir={locale === 'fa' ? 'rtl' : 'ltr'}>
            <NextIntlClientProvider messages={messages}>
              {children}
              <Toaster
                richColors
                theme="light"
                position="bottom-left"
                toastOptions={{
                  classNames: {
                    toast: 'font-body',
                  },
                }}
              />
            </NextIntlClientProvider>
          </RadixDirectionProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
