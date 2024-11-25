import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "../layout/header";
import Footer from "./components/footer";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
// Just UI Imports Below
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Tapdeal: Manage & Automate your instagram",
  description: "This is first version of TabDeal application.",
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
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="MyWebSite" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>

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
