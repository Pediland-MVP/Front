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
        <SWRConfig value={{
            fetcher
          }}>
          <header>
            <div className="container max-w-4xl px-3 sm:px-4 xl:px-0 mx-auto">
              <div className="_wrap flex items-center justify-between py-3 lg:py-4">
                <div className="_logo flex items-center gap-3">
                  <Image src="/images/befroosh-logo.svg" alt="logo" width={30} height={44} />
                  <span className="text-xl font-bold text-primary">بـفـروش</span>
                </div>
                <div className="_title flex items-center gap-2">
                  <ShoppingBagOpen size={24} weight="duotone" className="text-secondary" />
                  <h1 className="font-semibold text-secondary">ثبت سفارش</h1>
                </div>
              </div>
            </div>
          </header>
          <NextIntlClientProvider messages={messages}>
            <main>
              <div className="container max-w-4xl px-3 sm:px-4 xl:px-0 mx-auto">
                {children}
              </div>
            </main>
          </NextIntlClientProvider>
          <footer>
            <div className="container max-w-4xl px-3 sm:px-4 xl:px-0 pt-6 pb-4 mx-auto">
              <p className="text-center text-sm text-gray-500">تمامی حقوق ناشی از این وب‌سایت برای بـفـروش محفوظ است.</p>
            </div>
          </footer>

          </SWRConfig>
      </body>
    </html>
  );
}
