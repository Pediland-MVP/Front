import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookiesStore = await cookies();
  const locale = cookiesStore.get("NEXT_LOCALE")?.value;

  if (locale) {
    return {
      locale,
      messages: { ...(await import(`./src/messages/${locale}.json`)).default },
    };
  }

  return {
    locale: "fa",
    messages: (await import(`./src/messages/${"fa"}.json`)).default,
  };
});
