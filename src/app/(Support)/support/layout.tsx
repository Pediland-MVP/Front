import "@/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";

import { Metadata } from "next";

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
        <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster
                richColors
                position="top-center"
                theme="light"
                toastOptions={{
                    className: "font-Yekan text-[13px]",
                }}
            />
        </NextIntlClientProvider>
    );
}
