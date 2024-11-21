import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "../layout/header";
import Footer from "./components/footer";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "تپدیل: مدیریت اینستاگرام",
  description: "سامانه مدیریت اینستاگرام تپدیل",
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} dir="rtl">
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header />
          {children}

          <Toaster />
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
