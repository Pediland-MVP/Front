import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { ZodErrorsMapProvider } from "@/components/Layout/ZodErrorsMapProvider";
import { AuthProvider } from "@/components/Providers/AuthProvider";
import { SiteProvider } from "@/components/Providers/SiteProvider";
import { Toaster } from "@/components/ui";

export const metadata: Metadata = {
  title: {
    default: "بفروش | مدیریت مشتریان",
    template: "%s | بفروش",
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
            <SiteProvider>
              <main className="flex h-screen flex-col bg-linear-to-tl from-blue-500 to-violet-700">
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
  );
}
