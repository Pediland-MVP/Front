import { IntlProvider } from "@/providers/IntlProvider";
import PageViewReporter from "@/providers/PageViewReporter";
import SiteProvider from "@/providers/SiteProvider";
import "@/styles/globals.css";
import type { Metadata } from "next";
import type { PropsWithChildren, ReactElement } from "react";

import { SiteFooter, SiteHeader } from "@/components";

export const metadata: Metadata = {
  title: "بفروش | ابزار هوشمند فروش و اتوماسیون ارتباطات در اینستاگرام",
  description:
    "بفروش؛ دایرکت هوشمند اینستاگرام برای رشد فروش شما. تعامل سریع و دقیق با مشتریان، کلید موفقیت هر کسب‌وکار اینستاگرامی است. اگر با حجم بالایی از دایرکت‌ها، ...",
};

export default function RootLayout({
  children,
}: PropsWithChildren): ReactElement {
  return (
    <IntlProvider>
      <SiteProvider>
        <PageViewReporter />
        <SiteHeader />
        {children}
        <SiteFooter />
      </SiteProvider>
    </IntlProvider>
  );
}
