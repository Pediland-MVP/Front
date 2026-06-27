import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookiesStore = await cookies();
  const locale = cookiesStore.get('NEXT_LOCALE')?.value || 'fa';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
