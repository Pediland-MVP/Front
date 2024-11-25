import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthHeader from "./auth/components/auth.header";
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
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <AuthHeader />
          <div className="_main-wrap h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]">
            {children}
          </div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
