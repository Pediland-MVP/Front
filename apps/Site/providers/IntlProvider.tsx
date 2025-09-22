// apps/Site/app/providers/IntlProvider.tsx
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactElement } from "react";

export async function IntlProvider({
  children,
}: {
  children: React.ReactNode;
}): Promise<ReactElement> {
  const locale = await getLocale();
  const messages = await getMessages();

  const fontClass =
    locale === "fa" ? "font-Yekan antialiased" : "font-Roboto antialiased";

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={fontClass}
    >
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
