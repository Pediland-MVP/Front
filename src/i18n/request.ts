import logger from "@/utils/logger";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookiesStore = await cookies();
  // const header = await headers()

  const locale = cookiesStore.get("NEXT_LOCALE")?.value;
  logger.debug("Locale of token", locale);

  // const acceptLanguageHeader = header.get('Accept-Language')
  //   let acceptLanguage: parser.Language[] = []
  //   if (acceptLanguageHeader) {
  //     acceptLanguage = parser.parse(acceptLanguageHeader)
  //   }

  // if (acceptLanguage.length > 0) {
  //   logger.debug("Accept-Language", acceptLanguage[0].code)
  // }

  if (locale) {
    return {
      locale,
      messages: { ...(await import(`../messages/${locale}.json`)).default },
    };
  }

  // if (acceptLanguage.length > 0) {
  //   const language = acceptLanguage[0].code
  //   return {
  //     locale: language,
  //     messages: (await import(`../messages/${language}.json`)).default
  //   };
  // }

  return {
    locale: "fa",
    messages: (await import(`../messages/${"fa"}.json`)).default,
  };
});
