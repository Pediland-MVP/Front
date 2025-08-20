import "@/styles/globals.css";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
// UI
import { Toaster } from "@/components/ui/toaster";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE");
  const t = await getTranslations({ locale, namespace: "Auth.Metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

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
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <div className="_main-wrap h-screen">{children}</div>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
