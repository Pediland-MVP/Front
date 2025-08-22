import "@/styles/globals.css"
import { SWRProvider } from "@/hooks/swr/api-client";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// UI Imports
import { StandaloneChecker } from "@/components/Global/standaloneChecker";
import { GoftinoSnippet } from "@/components/third-party/goftino";
import { ZodErrorsMapProvider } from "@/components/third-party/zodErrorsMapProvider";
import { Toaster } from "@/components/ui/toaster";
import InstagramTokenErrorDialog from "./components/instagramTokenError.dialog";
import SubscriptionExpireWarningDialog from "./components/subscriptionExpireWarning.dialog";

import {
  ConsoleProvider,
  NavBottomProvider,
  Toaster as Sonner,
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
      className={locale === "fa" ? "font-Yekan antialiased" : "font-Roboto antialiased"}
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
              <Toaster />
              <Sonner />
            </NextIntlClientProvider>
          </StandaloneChecker>
        </SWRProvider>
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
