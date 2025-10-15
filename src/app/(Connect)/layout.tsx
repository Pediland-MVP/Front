import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Link from "next/link";

import InstagramTokenErrorDialog from "@/components/Console/instagramTokenError.dialog";
import { GoftinoSnippet } from "@/components/Global/GoftinoSnippet";
import { StandaloneChecker } from "@/components/Global/standaloneChecker";
import {
  InstagramGuard,
  LogoSlogan,
  LogoText,
  Toaster,
  ZodErrorsMapProvider,
} from "@components";
import { HeadsetIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Befroosh Application",
  description: "This is first version of Befroosh application.",
};

export default async function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  // // 1️⃣ بررسی توکن در SSR
  // const token = (await cookies()).get("token")?.value;
  // if (!token) {
  //   redirect("/auth");
  // }

  // // 2️⃣ از /users/me وضعیت اتصال کاربر را بگیر
  // let user: any = null;
  // try {
  //   const res = await fetch(
  //     `${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`,
  //     {
  //       headers: { Authorization: `Bearer ${token}` },
  //       cache: "no-store",
  //     },
  //   );
  //   if (res.ok) user = await res.json();
  // } catch (err) {
  //   console.warn("⚠️ Error fetching /users/me in ConnectLayout:", err);
  // }

  // const isConnected = Boolean(user?.instagrams?.length);

  // // 3️⃣ اگر کاربر Instagram دارد، نگذار صفحه Connect دیده شود
  // if (isConnected) {
  //   redirect("/");
  // }

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={
        locale === "fa" ? "font-Yekan antialiased" : "font-Roboto antialiased"
      }
    >
      <body className="bg-pink-400">
        <SWRProvider>
          <StandaloneChecker>
            <NextIntlClientProvider messages={messages}>
              <ZodErrorsMapProvider>
                <InstagramGuard>
                  <InstagramTokenErrorDialog />

                  <main className="flex h-screen flex-col bg-gradient-to-tl from-blue-500 to-violet-700">
                    <header className="flex h-16 items-center justify-between gap-4 px-4 text-white">
                      <div className="flex items-center gap-4">
                        <SignOutIcon size={26} />

                        <Link
                          href="https://t.me/+989360226688"
                          target="_blank"
                          className="flex items-center gap-2 md:justify-center"
                        >
                          <HeadsetIcon size={28} weight="duotone" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <LogoSlogan variant="white" />
                        <LogoText variant="white" size="sm" />
                      </div>
                    </header>

                    <div className="flex-1 rounded-t-3xl bg-violet-50 py-6">
                      {children}
                    </div>
                  </main>
                </InstagramGuard>
              </ZodErrorsMapProvider>

              <Toaster
                richColors
                theme="light"
                toastOptions={{
                  className: "font-Yekan text-[13px]",
                }}
              />
            </NextIntlClientProvider>
          </StandaloneChecker>
        </SWRProvider>
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
