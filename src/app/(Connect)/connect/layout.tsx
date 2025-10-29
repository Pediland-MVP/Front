import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import {
  AuthProvider,
  SiteProvider,
  Toaster,
  ZodErrorsMapProvider,
} from "@components";

export const metadata: Metadata = {
  title: "Befroosh Application",
  description: "This is first version of Befroosh application.",
};

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={
        locale === "fa" ? "font-Yekan antialiased" : "font-Roboto antialiased"
      }
    >
      <body>
        <SWRProvider>
          <AuthProvider>
            <NextIntlClientProvider messages={messages}>
              <ZodErrorsMapProvider>
                <SiteProvider>
                  <main className="flex h-screen flex-col bg-gradient-to-tl from-blue-500 to-violet-700">
                    {children}
                  </main>
                </SiteProvider>
                <Toaster
                  richColors
                  theme="light"
                  toastOptions={{
                    className: "font-Yekan text-[13px]",
                  }}
                />
              </ZodErrorsMapProvider>
            </NextIntlClientProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
