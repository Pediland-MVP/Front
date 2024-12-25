
import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { SWRConfig } from "swr";
import { fetcher } from "@/hooks/swr/fetcher";

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
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} className={locale === "fa" ? "font-Anjoman" : "font-Roboto"}>
      <body className="bg-blue-50 h-screen">
        <NextIntlClientProvider messages={messages}>
          <SWRConfig value={{
            fetcher
          }}>
            {children}
            <Toaster />
          </SWRConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
