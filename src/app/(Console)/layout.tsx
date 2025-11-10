import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";

import { InstagramInvalidDialog } from "@/components/Console/InstagramInvalidDialog";
import { ConsoleProvider } from "@/components/Layout/ConsoleProvider";
import { NavBottom } from "@/components/Layout/NavBottom";
import { ZodErrorsMapProvider } from "@/components/Layout/ZodErrorsMapProvider";
import { AuthProvider } from "@/components/Providers/AuthProvider";
import { SiteProvider } from "@/components/Providers/SiteProvider";

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
                {/* All third party configuration goes inside SiteProvider */}
                <SiteProvider>
                  <ConsoleProvider>
                    <InstagramInvalidDialog />

                    {children}

                    <NavBottom />
                  </ConsoleProvider>
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
