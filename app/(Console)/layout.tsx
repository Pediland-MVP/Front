// app/[locale]/client/layout.tsx
import { ReactElement } from "react";
import { NextUIProvider } from "@nextui-org/react";

export default function SubLayout({
  children,
}: {
  params: { locale: string };
  children: ReactElement;
}) {
  return (
    <NextUIProvider>
      <div className="h-screen max-h-screen">
        {children}
      </div>
    </NextUIProvider>
  );
}
