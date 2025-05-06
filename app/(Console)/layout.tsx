import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { GoftinoSnippet } from "@/components/third-party/goftino";
import { SWRProvider } from "@/hooks/swr/api-client";
import { ZodErrorsMapProvider } from "@/components/third-party/zodErrorsMapProvider";
import ConsoleProvider from "./components/consoleProvider";
import InstagramTokenErrorDialog from "./components/instagramTokenError.dialog";

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
      <body className="bg-blue-50 h-screen">
        <SWRProvider>
            <NextIntlClientProvider messages={messages}>
              <ZodErrorsMapProvider>
                <ConsoleProvider>
                  <InstagramTokenErrorDialog/>
                  {children}
                </ConsoleProvider>
              </ZodErrorsMapProvider>
              <Toaster />
            </NextIntlClientProvider>
        </SWRProvider>
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
