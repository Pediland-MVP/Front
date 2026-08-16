import '@/styles/globals.css';
import { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import SWRProvider from './swr.prvider';
import { ZodErrorsMapProvider } from '@/components/Layout/ZodErrorsMapProvider';
import { SiteProvider } from '@/components/Providers/SiteProvider';

export const metadata: Metadata = {
  title: 'Befroosh Application',
  description: 'This is first version of Befroosh application.',
};

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  // NOTE: deliberately no <html>/<body> here. A route group is not a new root —
  // `app/layout.tsx` already renders them, and rendering a second pair produced
  // invalid nesting and a hydration mismatch on every shop page (server sent
  // this layout's <body className="flex h-full ...">, the client re-rendered the
  // root's bare <body>). Multiple root layouts are only legal when there is NO
  // top-level app/layout.tsx, and (Console) etc. rely on that one.
  // `lang`/`dir` come from the root layout, which applies the same locale rule.
  return (
    <div
      className={`flex h-full min-h-screen flex-col bg-linear-to-b from-violet-50 to-blue-50 ${
        locale === 'fa' ? 'font-Yekan antialiased' : 'font-Roboto antialiased'
      }`}
    >
      <SWRProvider>
        <NextIntlClientProvider messages={messages}>
          <ZodErrorsMapProvider>
            <SiteProvider>
              <main className="container mx-auto flex max-w-4xl flex-1 flex-col px-4">
                {children}
              </main>
              <footer className="py-5">
                <div className="container mx-auto max-w-4xl px-4">
                  <p className="text-muted-foreground text-center text-xs">
                    تمامی حقوق ناشی از این وب‌سایت برای بـفـروش محفوظ است.
                  </p>
                </div>
              </footer>
            </SiteProvider>
          </ZodErrorsMapProvider>
        </NextIntlClientProvider>
      </SWRProvider>
    </div>
  );
}
