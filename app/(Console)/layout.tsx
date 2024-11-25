import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

export const metadata: Metadata = {
  title: "TabDeal Application",
  description: "This is first version of TabDeal application.",
};

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body className="bg-blue-50 h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
