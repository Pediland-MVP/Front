import api, { SWRProvider } from "@/hooks/swr/api-client";
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
import { InstagramGuard } from "@/components/Guards/InstagramGuard";
import { cookies } from "next/headers";
import * as jose from "jose";
import AuthProvider from "@/components/Providers/AuthProvider";
import { redirect } from "next/navigation";
import useUser from "@/hooks/useUser";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

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
      <body className="bg-red-600">
        <SWRProvider>
          <AuthProvider>
            <StandaloneChecker>
              <NextIntlClientProvider messages={messages}>
                <ZodErrorsMapProvider>
                  <ConsoleProvider>
                    <InstagramTokenErrorDialog />

                    <SubscriptionExpireWarningDialog />

                    {children}

                    <NavBottom />
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
          </AuthProvider>
        </SWRProvider>
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
