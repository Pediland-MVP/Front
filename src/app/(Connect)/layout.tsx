import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import InstagramTokenErrorDialog from "@/components/Console/instagramTokenError.dialog";
import { GoftinoSnippet } from "@/components/Global/GoftinoSnippet";
import { StandaloneChecker } from "@/components/Global/standaloneChecker";
import AuthProvider from "@/components/Providers/AuthProvider";
import { Toaster, ZodErrorsMapProvider } from "@components";

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
      <body className="bg-gradient-to-tl from-violet-700 to-blue-400">
        <SWRProvider>
          <AuthProvider>
            <StandaloneChecker>
              <NextIntlClientProvider messages={messages}>
                <ZodErrorsMapProvider>
                  <InstagramTokenErrorDialog />

                  <main className="flex h-screen flex-col bg-gradient-to-tl from-blue-500 to-violet-700">
                    {children}
                  </main>
                </ZodErrorsMapProvider>

                <Toaster
                  richColors
                  theme="light"
                  toastOptions={{
                    className: "font-Yekan text-[13px]",
                  }}
                />
              </NextIntlClientProvider>
            </StandaloneChecker>
          </AuthProvider>
        </SWRProvider>
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
