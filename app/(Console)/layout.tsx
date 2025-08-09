import "@/app/globals.css";
import { SWRProvider } from "@/hooks/swr/api-client";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// UI Imports
import { StandaloneChecker } from "@/components/global/standaloneChecker";
import { GoftinoSnippet } from "@/components/third-party/goftino";
import { ZodErrorsMapProvider } from "@/components/third-party/zodErrorsMapProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import InstagramTokenErrorDialog from "./components/instagramTokenError.dialog";
import { BottomNavProvider } from "./components/layout/bottomNavProvider";
import ConsoleProvider from "./components/layout/consoleProvider";
import SubscriptionExpireWarningDialog from "./components/subscriptionExpireWarning.dialog";

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
      className={locale === "fa" ? "font-Anjoman" : "font-Roboto"}
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
                  <BottomNavProvider />
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
