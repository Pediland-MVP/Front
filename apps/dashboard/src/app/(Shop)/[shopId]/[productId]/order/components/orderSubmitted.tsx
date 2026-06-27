import { useTranslations } from 'next-intl';

export default function OrderSubmitted() {
  const t = useTranslations('Checkout.OrderSubmitted');
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <p>{t('title')}</p>
      <p>{t('description')}</p>
    </div>
  );
}
