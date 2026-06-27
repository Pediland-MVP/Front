import { useTranslations } from 'next-intl';

export default function UnAuthorized() {
  const t = useTranslations('Checkout.UnAuthorized');
  return (
    <div className="_checkout flex h-svh flex-col items-center justify-center rounded-xl border bg-white p-5 md:p-10">
      <p className="text-xl font-medium">{t('accessDenied')}</p>
    </div>
  );
}
