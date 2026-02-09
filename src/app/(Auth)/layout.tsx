import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";

import { AuthProvider } from "@/components/Providers/AuthProvider";
import { SiteProvider } from "@/components/Providers/SiteProvider";
import { Metadata } from "next";
import SupportButton from "./auth/supportButton";

// TODO: Refactor Intl metadata with this code
// export async function generateMetadata() {
//   const cookieStore = cookies();
//   const locale = (await cookieStore).get("NEXT_LOCALE")?.value || "fa";
//   const t = await getTranslations({ locale, namespace: "Auth.Metadata" });

//   return {
//     title: t("title"),
//     description: t("description"),
//   };
// }

export const metadata: Metadata = {
  title: {
    default: "بفروش | مدیریت مشتریان",
    template: "%s | بفروش",
  },
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <SWRProvider>
      <AuthProvider>
        <NextIntlClientProvider messages={messages}>
          <SiteProvider>
            <main className="flex min-h-screen flex-col items-center justify-center bg-violet-50">
              {children}
            </main>
          </SiteProvider>

          <Toaster
            richColors
            position="top-center"
            theme="light"
            toastOptions={{
              className: "font-Yekan text-[13px]",
            }}
          />
        </NextIntlClientProvider>
      </AuthProvider>
    </SWRProvider>
  );
}
