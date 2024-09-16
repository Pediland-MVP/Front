import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";

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
      <body className="bg-blue-50 h-screen p-4">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
