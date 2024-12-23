import "@/app/globals.css";
import AuthHeader from "./auth/components/auth.header";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";

import { Toaster } from "@/components/ui/toaster";

export async function generateMetadata() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')
  const t = await getTranslations({ locale, namespace: 'Auth.Metadata' });
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} className={locale === "fa" ? "font-Anjoman" : "font-Roboto"}>
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
