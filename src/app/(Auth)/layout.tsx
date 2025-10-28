// Refactored
import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import { AuthProvider, SiteProvider } from "@components";

export async function generateMetadata() {
  const cookieStore = cookies();
  const locale = (await cookieStore).get("NEXT_LOCALE")?.value || "fa";
  const t = await getTranslations({ locale, namespace: "Auth.Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AuthLayout({
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
      <body className="bg-violet-50">
        <SWRProvider>
          <AuthProvider>
            <NextIntlClientProvider messages={messages}>
              <SiteProvider>
                <div className="container px-10 sm:max-w-sm">
                  <main className="flex min-h-screen flex-col items-center justify-center">
                    {children}
                  </main>
                </div>
              </SiteProvider>
            </NextIntlClientProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
