import "@/styles/globals.css";
import { SWRProvider } from "@/hooks/swr/api-client";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// UI Imports
import { StandaloneChecker } from "@/components/_Global/standaloneChecker";
import { GoftinoSnippet } from "@/components/_Global/GoftinoSnippet";
import { ZodErrorsMapProvider } from "@/components/index";
import InstagramTokenErrorDialog from "./components/instagramTokenError.dialog";
import SubscriptionExpireWarningDialog from "./components/subscriptionExpireWarning.dialog";

import {
  ConsoleProvider,
  NavBottomProvider,
  Toaster,
} from "@/components/index";

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
      <body className="h-screen bg-blue-50">
        <SWRProvider>
          <StandaloneChecker>
            <NextIntlClientProvider messages={messages}>
              <ZodErrorsMapProvider>
                <ConsoleProvider>
                  <InstagramTokenErrorDialog />

                  <SubscriptionExpireWarningDialog />

                  {children}

                  <NavBottomProvider />
                </ConsoleProvider>
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
        </SWRProvider>
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
