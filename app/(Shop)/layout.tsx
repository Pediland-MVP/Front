import Image from "next/image";
import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "@/app/globals.css";
// UI 
import { Toaster } from "@/components/theme/ui/toaster";
import { ShoppingBagOpen } from "@phosphor-icons/react/dist/ssr";
import { SWRConfig } from "swr";
import { fetcher } from '../../hooks/swr/fetcher';
import SWRProvider from "./swr.prvider";

export const metadata: Metadata = {
  title: "Befroosh Application",
  description: "This is first version of Befroosh application.",
};

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} className={locale === "fa" ? "font-Anjoman" : "font-Roboto"}>
      <body className="bg-fuchsia-50/75">
        <Toaster/>

          <SWRProvider>
            <NextIntlClientProvider messages={messages}>
              <main>
                <div className="container max-w-4xl px-3 sm:px-4 xl:px-0 mx-auto">
                  {children}
                </div>
              </main>
            </NextIntlClientProvider>
          </SWRProvider>
          <footer>
            <div className="container max-w-4xl px-3 sm:px-4 xl:px-0 pt-6 pb-4 mx-auto">
              <p className="text-center text-sm text-gray-500">تمامی حقوق ناشی از این وب‌سایت برای بـفـروش محفوظ است.</p>
            </div>
          </footer>
      </body>
    </html>
  );
}
