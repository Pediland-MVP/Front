// app/[locale]/client/layout.tsx
import { ReactElement } from "react";
import { I18nProviderClient } from "@/locales/client";
import { NextUIProvider } from "@nextui-org/react";

export default function SubLayout({
  params: { locale }, 
  children,
}: {
  params: { locale: string };
  children: ReactElement;
}) {
  return (
    <I18nProviderClient locale={locale}>
      <NextUIProvider>
        <div className="bg-white h-screen max-h-screen text-black">{children}</div>
      </NextUIProvider>
    </I18nProviderClient>
  );
}
