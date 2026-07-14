import { SWRProvider } from '@/hooks/swr/api-client';
import '@/styles/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';

import { ConsoleProvider } from '@/components/Layout/ConsoleProvider';
import { NavBottom } from '@/components/Layout/NavBottom';
import { ZodErrorsMapProvider } from '@/components/Layout/ZodErrorsMapProvider';
import { AuthProvider } from '@/components/Providers/AuthProvider';
import { SiteProvider } from '@/components/Providers/SiteProvider';
import { Metadata } from 'next';
import InstagramInvalidRedirector from '@/components/Console/InstagramInvalidRedirector';
import WorkspaceSessionGuard from '@/components/Console/WorkspaceSessionGuard';
import WorkspaceCategoryGuard from '@/components/Console/WorkspaceCategoryGuard';

export const metadata: Metadata = {
  title: {
    default: 'بفروش | مدیریت مشتریان',
    template: '%s | بفروش',
  },
};

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <SWRProvider>
      <AuthProvider>
        <NextIntlClientProvider messages={messages}>
          <ZodErrorsMapProvider>
            {/* All third party configuration goes inside SiteProvider */}
            <SiteProvider>
              <ConsoleProvider>
                <InstagramInvalidRedirector />
                <WorkspaceSessionGuard />
                <WorkspaceCategoryGuard />

                {children}

                <NavBottom />
              </ConsoleProvider>
            </SiteProvider>
            <Toaster
              richColors
              theme="light"
              toastOptions={{
                className: 'font-Yekan text-[13px]',
              }}
            />
          </ZodErrorsMapProvider>
        </NextIntlClientProvider>
      </AuthProvider>
    </SWRProvider>
  );
}
