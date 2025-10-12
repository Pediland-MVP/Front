import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// UI Imports
import InstagramTokenErrorDialog from "@/components/Console/instagramTokenError.dialog";
import SubscriptionExpireWarningDialog from "@/components/Console/subscriptionExpireWarning.dialog";
import { GoftinoSnippet } from "@/components/Global/GoftinoSnippet";
import { StandaloneChecker } from "@/components/Global/standaloneChecker";

import {
  ConsoleProvider,
  NavBottom,
  Toaster,
  ZodErrorsMapProvider,
} from "@components";
import { InstagramGuardProvider } from "@/components/Global/InstagramGuardProvider";

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
          <StandaloneChecker>
            <NextIntlClientProvider messages={messages}>
              <ZodErrorsMapProvider>
                <InstagramGuardProvider>
                  <ConsoleProvider>
                    <InstagramTokenErrorDialog />

                    <SubscriptionExpireWarningDialog />

                    {children}

                    <NavBottom />
                  </ConsoleProvider>
                </InstagramGuardProvider>
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
