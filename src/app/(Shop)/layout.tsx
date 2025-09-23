import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "@/styles/globals.css";
// UI
import { Toaster } from "@/components/index";
import SWRProvider from "./swr.prvider";
import { GoftinoSnippet } from "@/components/_Global/GoftinoSnippet";

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
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={
        locale === "fa" ? "font-Yekan antialiased" : "font-Roboto antialiased"
      }
    >
      <body className="bg-fuchsia-50/75">
        <Toaster />

        <SWRProvider>
          <NextIntlClientProvider messages={messages}>
            <main>
              <div className="container mx-auto max-w-4xl px-3 sm:px-4 xl:px-0">
                {children}
              </div>
            </main>
          </NextIntlClientProvider>
        </SWRProvider>
        <footer>
          <div className="container mx-auto max-w-4xl px-3 pt-6 pb-4 sm:px-4 xl:px-0">
            <p className="text-center text-sm text-gray-500">
              تمامی حقوق ناشی از این وب‌سایت برای بـفـروش محفوظ است.
            </p>
          </div>
        </footer>
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
