// Refactored
import AuthProvider from "@/components/Providers/AuthProvider";
import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

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

  const token = (await cookies()).get("token");
  let initialAuth = { isLoggedIn: !!token }; // فقط همین کافی است

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={
        locale === "fa" ? "font-Yekan antialiased" : "font-Roboto antialiased"
      }
    >
      <body className="bg-violet-50">
        <AuthProvider initialAuth={initialAuth}>
          <NextIntlClientProvider messages={messages}>
            <div className="container px-10 sm:max-w-sm">
              <main className="flex min-h-screen flex-col items-center justify-center">
                {children}
              </main>
            </div>

            <Toaster
              richColors
              theme="light"
              toastOptions={{
                className: "font-Yekan text-[13px]",
              }}
            />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
