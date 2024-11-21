import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthHeader from "./auth/components/auth.header";

export const metadata: Metadata = {
  title: "TabDeal Application",
  description: "This is first version of TabDeal application.",
};
export default function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen">
        <AuthHeader />

        <div className="_main-wrap h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
