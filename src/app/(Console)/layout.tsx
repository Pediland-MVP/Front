import { SWRProvider } from "@/hooks/swr/api-client";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// UI Imports
import InstagramTokenErrorDialog from "@/components/Console/instagramTokenError.dialog";
import SubscriptionExpireWarningDialog from "@/components/Console/subscriptionExpireWarning.dialog";
import { GoftinoSnippet } from "@/components/Global/GoftinoSnippet";
import { StandaloneChecker } from "@/components/Global/standaloneChecker";

import {
  ConsoleProvider,
  NavBottom,
  Toaster,
  ZodErrorsMapProvider,
} from "@components";
import { InstagramGuard } from "@/components/Guards/InstagramGuard";
import { cookies } from "next/headers";
import * as jose from "jose";
import AuthProvider from "@/components/Providers/AuthProvider";
import { redirect } from "next/navigation";

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

  // 1️⃣ Read token from cookie
  // const token = (await cookies()).get("token")?.value;

  // console.log("token............ ⭕⭕⭕", token);

  // if (!token) {
  //   redirect("/auth");
  // }

  // let initialAuth = {
  //   isLoggedIn: false,
  //   isOnboarding: false,
  //   isConnected: false,
  //   token: null,
  // };

  // 2️⃣ If token exists, fetch user data
  // try {
  //   const res = await fetch(
  //     `${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //       cache: "no-store",
  //     },
  //   );

  //   if (res.ok) {
  //     const data = await res.json();
  //     initialAuth.isOnboarding = data.status === "onboarding";
  //     initialAuth.isConnected = Boolean(data.instagrams?.length);
  //   }
  // } catch (err) {
  //   console.warn("⚠️ Error fetching /users/me:", err);
  // }

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={
        locale === "fa" ? "font-Yekan antialiased" : "font-Roboto antialiased"
      }
    >
      <body className="bg-red-600">
        {/* <AuthProvider initialAuth={initialAuth}> */}
          <SWRProvider>
            <StandaloneChecker>
              <NextIntlClientProvider messages={messages}>
                <ZodErrorsMapProvider>
                  {/* <InstagramGuard> */}
                    <ConsoleProvider>
                      <InstagramTokenErrorDialog />

                      <SubscriptionExpireWarningDialog />

                      {children}

                      <NavBottom />
                    </ConsoleProvider>
                  {/* </InstagramGuard> */}
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
        {/* </AuthProvider> */}
        <GoftinoSnippet goftinoKey="amN3YU" />
      </body>
    </html>
  );
}
