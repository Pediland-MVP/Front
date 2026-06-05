// src/app/(main)/layout.tsx

import "@/styles/globals.css";
import type { Metadata } from "next";

// UI Imports
import { Toaster } from "sonner";
import { SWRProvider } from "@/hooks/swr/api-client";

export const metadata: Metadata = {
  title: "بفروش | سیستم مدیریت فروش و بازاریابی",
  description:
    "این نرم افزار بصورت اختصاصی برای بخش بازاریابی و فروش مجموعه بفروش طراحی شده است.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="font-Yekan antialiased">
      <body>
        <SWRProvider>
          {children}
          <Toaster
            richColors
            theme="light"
            position="bottom-left"
            toastOptions={{
              classNames: {
                toast: "font-body",
              },
            }}
          />
        </SWRProvider>
      </body>
    </html>
  );
}
